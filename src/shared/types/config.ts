export interface AgentIdentity {
  agentName: string;
  wakePhrase: string;
  voice: string;
  language: string;
  nickname?: string;
  userName: string;
  personalityMode: 'efficient' | 'friendly' | 'concise' | 'technical';
  voiceResponseEnabled: boolean;
  startOnBoot: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface SecuritySettings {
  defaultActionForHighRisk: 'CONFIRM' | 'BLOCK';
  commandAllowlistEnabled: boolean;
  allowedDirectories: string[];
  maxCommandTimeoutMs: number;
  auditRetentionDays: number;
  screenAwarenessConsent: boolean;
}

export interface AISettings {
  provider: 'gemini' | 'mock' | 'local';
  geminiApiKey?: string;
  planningModel: string;
  liveVoiceModel: string;
  transcribeModel: string;
  cloudRoutingMode: 'auto' | 'cloud_only' | 'local_only';
  temperature: number;
}

export interface AppConfig {
  identity: AgentIdentity;
  security: SecuritySettings;
  ai: AISettings;
  isOnboarded: boolean;
  updatedAt: number;
}
