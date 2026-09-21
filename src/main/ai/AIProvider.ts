import { ToolDefinition } from '../../shared/types/tools';
import { TaskPlan, DesktopContext } from '../../shared/types/agent';

export interface AIProviderOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface AIProvider {
  id: string;
  name: string;

  generate(prompt: string, context?: Record<string, unknown>): Promise<string>;
  
  stream(
    prompt: string,
    onDelta: (chunk: string) => void,
    context?: Record<string, unknown>
  ): Promise<string>;

  planTask(
    goal: string,
    availableTools: ToolDefinition[],
    context?: DesktopContext,
    agentName?: string
  ): Promise<TaskPlan>;

  analyzeScreen(imageBuffer: Buffer, prompt: string): Promise<string>;

  embed(text: string): Promise<number[]>;
}
