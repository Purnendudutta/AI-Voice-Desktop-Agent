import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { MockAIProvider } from './MockAIProvider';
import { AppConfig } from '../../shared/types/config';

export type RoutingDecision = {
  route: 'local' | 'cloud' | 'mock' | 'vision';
  reason: string;
  provider: AIProvider;
  timestamp: number;
};

export class ModelRouter {
  private config: AppConfig;
  private geminiProvider: GeminiProvider;
  private mockProvider: MockAIProvider;
  private routingLog: RoutingDecision[] = [];

  constructor(config: AppConfig) {
    this.config = config;
    this.geminiProvider = new GeminiProvider(config.ai.geminiApiKey, config.ai.planningModel);
    this.mockProvider = new MockAIProvider();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    if (config.ai.geminiApiKey) {
      this.geminiProvider.updateApiKey(config.ai.geminiApiKey);
    }
  }

  public routeTask(input: string, isMultimodal = false): RoutingDecision {
    const timestamp = Date.now();
    const lower = input.toLowerCase().trim();

    // Forced modes in settings
    if (this.config.ai.provider === 'mock') {
      const decision: RoutingDecision = {
        route: 'mock',
        reason: 'User configured provider to Mock/Offline mode',
        provider: this.mockProvider,
        timestamp,
      };
      this.logDecision(decision);
      return decision;
    }

    if (this.config.ai.cloudRoutingMode === 'local_only' || !this.config.ai.geminiApiKey) {
      const decision: RoutingDecision = {
        route: 'local',
        reason: !this.config.ai.geminiApiKey
          ? 'No Gemini API key present, defaulting to local/mock provider'
          : 'Local-only routing enforced by settings',
        provider: this.mockProvider,
        timestamp,
      };
      this.logDecision(decision);
      return decision;
    }

    // Vision tasks
    if (isMultimodal || lower.includes('look at my screen') || lower.includes('what is on my screen')) {
      const decision: RoutingDecision = {
        route: 'vision',
        reason: 'Multimodal screen understanding requires vision model',
        provider: this.geminiProvider,
        timestamp,
      };
      this.logDecision(decision);
      return decision;
    }

    // Direct simple local triggers
    const stripped = lower.replace(/^(hey\s+)?(atlas|nova|agent)[,:\s]+/i, '').trim();
    if (
      stripped.startsWith('open ') ||
      stripped.startsWith('launch ') ||
      stripped.startsWith('close ') ||
      stripped === 'terminal' ||
      stripped === 'notepad' ||
      stripped === 'calculator' ||
      stripped === 'powershell'
    ) {
      const decision: RoutingDecision = {
        route: 'local',
        reason: 'Simple local application command',
        provider: this.mockProvider,
        timestamp,
      };
      this.logDecision(decision);
      return decision;
    }

    // Default to Gemini Cloud for multi-step reasoning
    const decision: RoutingDecision = {
      route: 'cloud',
      reason: 'Complex multi-step reasoning delegated to Gemini Cloud',
      provider: this.geminiProvider,
      timestamp,
    };
    this.logDecision(decision);
    return decision;
  }

  private logDecision(decision: RoutingDecision): void {
    this.routingLog.unshift(decision);
    if (this.routingLog.length > 100) {
      this.routingLog.pop();
    }
  }

  public getRoutingHistory(limit = 20): RoutingDecision[] {
    return this.routingLog.slice(0, limit);
  }

  public getGeminiProvider(): GeminiProvider {
    return this.geminiProvider;
  }
}
