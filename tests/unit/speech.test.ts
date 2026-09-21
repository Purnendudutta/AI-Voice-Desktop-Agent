import { describe, it, expect } from 'vitest';
import { WindowsSpeechService } from '../../src/main/audio/WindowsSpeechService';

describe('Windows Speech Service', () => {
  it('handles empty or non-wav audio gracefully', async () => {
    const result = await WindowsSpeechService.transcribeWav('');
    expect(result).toBe('');
  });

  it('handles invalid base64 input without crashing', async () => {
    const result = await WindowsSpeechService.transcribeWav('invalid-base64-content');
    expect(result).toBe('');
  });
});
