import { TaskStep } from '../../shared/types/agent';
import { ToolRegistry } from '../tools/ToolRegistry';
import { ToolRecoveryStrategy } from '../../shared/types/tools';

export class RecoveryEngine {
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  public async evaluateFailure(
    step: TaskStep,
    errorMessage: string,
    context?: any
  ): Promise<{
    action: 'retry' | 'alternative' | 'ask_user' | 'abort';
    suggestedArguments?: Record<string, unknown>;
    alternativeTool?: string;
    explanation: string;
  }> {
    // 1. Check if maximum recovery attempts reached
    if (step.recoveryAttempts >= step.maxRecoveryAttempts) {
      return {
        action: 'abort',
        explanation: `Step "${step.title}" reached maximum retry attempts (${step.maxRecoveryAttempts}). Aborting step safely.`,
      };
    }

    // 2. Query tool-specific recovery strategy
    const tool = this.toolRegistry.getTool(step.tool);
    if (tool && tool.recover) {
      try {
        const strategy: ToolRecoveryStrategy = await tool.recover(step.arguments, errorMessage, context);
        if (strategy.canRecover) {
          if (strategy.alternativeTool) {
            return {
              action: 'alternative',
              alternativeTool: strategy.alternativeTool,
              suggestedArguments: strategy.suggestedArguments || step.arguments,
              explanation: `Switching to alternative tool "${strategy.alternativeTool}".`,
            };
          }
          if (strategy.suggestedArguments) {
            return {
              action: 'retry',
              suggestedArguments: strategy.suggestedArguments,
              explanation: `Retrying with adjusted arguments.`,
            };
          }
        }
        if (strategy.userClarificationRequired) {
          return {
            action: 'ask_user',
            explanation: strategy.clarificationQuestion || 'Action could not be automatically verified. Please confirm how to proceed.',
          };
        }
      } catch {
        // fallback to standard retry
      }
    }

    // 3. General backoff retry
    return {
      action: 'retry',
      explanation: `Verification failed (${errorMessage}). Retrying step (attempt ${step.recoveryAttempts + 1}/${step.maxRecoveryAttempts})...`,
    };
  }
}
