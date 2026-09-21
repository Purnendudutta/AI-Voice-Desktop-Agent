import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './AIProvider';
import { ToolDefinition } from '../../shared/types/tools';
import { TaskPlan, TaskStep, DesktopContext } from '../../shared/types/agent';
import { RiskLevel } from '../../shared/types/permissions';

export class GeminiProvider implements AIProvider {
  public id = 'gemini';
  public name = 'Google Gemini (GenAI SDK)';
  private client: GoogleGenAI | null = null;
  private planningModel: string;

  constructor(apiKey?: string, planningModel = 'gemini-3.8-flash') {
    this.planningModel = planningModel;
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  public updateApiKey(apiKey: string): void {
    this.client = new GoogleGenAI({ apiKey });
  }

  public async generate(prompt: string, context?: Record<string, unknown>): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const contextStr = context ? `Context:\n${JSON.stringify(context, null, 2)}\n\n` : '';
    const response = await this.client.models.generateContent({
      model: this.planningModel,
      contents: `${contextStr}${prompt}`,
    });

    return response.text || '';
  }

  public async stream(
    prompt: string,
    onDelta: (chunk: string) => void,
    context?: Record<string, unknown>
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const contextStr = context ? `Context:\n${JSON.stringify(context, null, 2)}\n\n` : '';
    const stream = await this.client.models.generateContentStream({
      model: this.planningModel,
      contents: `${contextStr}${prompt}`,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.text || '';
      fullText += text;
      onDelta(text);
    }
    return fullText;
  }

  public async planTask(
    goal: string,
    availableTools: ToolDefinition[],
    context?: DesktopContext,
    agentName = 'Agent'
  ): Promise<TaskPlan> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured. Please enter your API key in Settings or switch to Mock/Local provider.');
    }

    const toolsSummary = availableTools
      .map((t) => `- ${t.id} (${t.name}): ${t.description} [Risk: ${t.riskLevel}] [Category: ${t.category}]`)
      .join('\n');

    const prompt = `You are ${agentName}, a 2027-era AI desktop operating layer.
Decompose the following user goal into a structured, verifiable task plan.

CRITICAL PRINCIPLES:
1. Do not expose chain-of-thought or internal reasoning in the title or description.
2. Step titles must be concise operational summaries (e.g., "Finding project", "Opening VS Code", "Starting backend", "Running tests", "Verifying server").
3. Each step must use one of the available tools.
4. Output STRICT valid JSON matching this schema:
{
  "goal": string,
  "priority": "low" | "normal" | "high" | "critical",
  "steps": [
    {
      "order": number,
      "title": string,
      "description": string,
      "tool": string,
      "arguments": object,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "requiresConfirmation": boolean
    }
  ]
}

Available Tools:
${toolsSummary}

Desktop Context:
${JSON.stringify(context || {}, null, 2)}

User Goal:
"${goal}"`;

    const response = await this.client.models.generateContent({
      model: this.planningModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // Fallback regex extraction if json markdown wraps it
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const steps: TaskStep[] = (parsed.steps || []).map((s: any, idx: number) => ({
      id: `step_${taskId}_${idx + 1}`,
      order: s.order || idx + 1,
      title: s.title || `Execute ${s.tool || 'action'}`,
      description: s.description || '',
      tool: s.tool || 'system_status',
      arguments: s.arguments || {},
      status: 'pending' as const,
      riskLevel: (s.riskLevel as RiskLevel) || 'LOW',
      requiresConfirmation: s.requiresConfirmation ?? (s.riskLevel === 'HIGH'),
      recoveryAttempts: 0,
      maxRecoveryAttempts: 2,
    }));

    const hasHighRisk = steps.some((s) => s.riskLevel === 'HIGH');

    return {
      taskId,
      goal,
      status: 'planning',
      priority: parsed.priority || 'normal',
      steps,
      currentStepIndex: 0,
      requiredTools: Array.from(new Set(steps.map((s) => s.tool))),
      overallRiskLevel: hasHighRisk ? 'HIGH' : 'LOW',
      requiresConfirmation: hasHighRisk,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public async analyzeScreen(imageBuffer: Buffer, prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const base64Image = imageBuffer.toString('base64');
    const response = await this.client.models.generateContent({
      model: this.planningModel,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt || 'Analyze this desktop screen context.' },
          ],
        },
      ],
    });

    return response.text || '';
  }

  public async embed(text: string): Promise<number[]> {
    if (!this.client) return [];
    try {
      const response = await this.client.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
      });
      const resp = response as any;
      return resp.embedding?.values || resp.embeddings?.[0]?.values || [];
    } catch {
      return [];
    }
  }

  public async transcribeAudio(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: audioBase64 } },
            {
              text:
                'Transcribe the spoken audio precisely into text. Output ONLY the plain text of the spoken words. Do not include introductory remarks, timestamps, quotes, or commentary. If no clear voice is detected, output nothing.',
            },
          ],
        },
      ],
    });

    return (response.text || '').trim();
  }
}
