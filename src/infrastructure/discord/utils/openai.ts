import { createLogger } from '../../logger';

const logger = createLogger('OpenAI');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.3;

export const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] as const;

export const DEFAULT_OPENAI_MODEL = OPENAI_MODELS[0];

export interface OpenAIMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

interface OpenAIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export async function callOpenAI(
  apiKey: string,
  messages: OpenAIMessage[],
  options?: OpenAIOptions
): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_OPENAI_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.warn('OpenAI API error', { status: response.status, errorText });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI API');
  }

  return content;
}
