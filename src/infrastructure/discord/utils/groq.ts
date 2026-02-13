import { createLogger } from '../../logger';

const logger = createLogger('Groq');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.3;

export interface GroqMessage {
  role: 'system' | 'user';
  content: string;
}

interface GroqChoice {
  message: {
    content: string;
  };
}

interface GroqResponse {
  choices: GroqChoice[];
}

interface GroqOptions {
  maxTokens?: number;
  temperature?: number;
}

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

export async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  options?: GroqOptions
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.warn('Groq API error', { status: response.status, errorText });
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq API');
  }

  return content;
}
