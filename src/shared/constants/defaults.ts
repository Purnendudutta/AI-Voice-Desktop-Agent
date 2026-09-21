import { AppConfig } from '../types/config';

export const DEFAULT_CONFIG: AppConfig = {
  identity: {
    agentName: 'Atlas',
    wakePhrase: 'Hey Atlas',
    voice: 'Aoede', // Default Gemini Voice option
    language: 'en-US',
    nickname: '',
    userName: 'User',
    personalityMode: 'efficient',
    voiceResponseEnabled: true,
    startOnBoot: false,
    theme: 'dark',
  },
  security: {
    defaultActionForHighRisk: 'CONFIRM',
    commandAllowlistEnabled: false,
    allowedDirectories: [],
    maxCommandTimeoutMs: 15000,
    auditRetentionDays: 30,
    screenAwarenessConsent: false,
  },
  ai: {
    provider: 'gemini',
    planningModel: 'gemini-3.8-flash',
    liveVoiceModel: 'gemini-3.1-flash-live-preview',
    transcribeModel: 'gemini-3.5-transcribe',
    cloudRoutingMode: 'auto',
    temperature: 0.2,
  },
  isOnboarded: true,
  updatedAt: Date.now(),
};

export const DANGEROUS_COMMAND_PATTERNS = [
  /\brm\s+-[rf]{1,2}\s+[\/\\]/i,
  /\bdel\b.*(\/f|\/q|\/s).*[c-z]:/i,
  /\bformat\s+[c-z]:/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/i, // fork bomb
  />\s*[\/\\]dev[\/\\]sd[a-z]/i,
  /\bshutdown\b.*[\/\-]s/i,
  /\breboot\b/i,
];

export const SAFE_COMMAND_ALLOWLIST = [
  /^git\s+(status|diff|log|branch|checkout|add|commit|pull|fetch)\b/i,
  /^npm\s+(test|run\s+[\w\-]+|list|outdated)\b/i,
  /^pnpm\s+(test|run\s+[\w\-]+|list)\b/i,
  /^node\s+--version\b/i,
  /^python\s+(--version|-m\s+pytest)\b/i,
  /^dir\b/i,
  /^ls\b/i,
  /^echo\b/i,
  /^code\s+/i,
];
