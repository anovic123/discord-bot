import type { AIProviderType } from '../../settings';
import { guildSettings } from '../../settings';
import { decrypt } from '../../encryption';
import { callGroq, getGroqApiKey, type GroqMessage, DEFAULT_GROQ_MODEL } from './groq';
import { callOpenAI, getOpenAIApiKey, DEFAULT_OPENAI_MODEL } from './openai';

export interface AIMessage {
  role: 'system' | 'user';
  content: string;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export function getAIApiKey(provider: AIProviderType, guildId?: string): string | undefined {
  if (guildId) {
    const settings = guildSettings.getSettings(guildId);
    const encryptedKey = provider === 'groq' ? settings.ai.groqApiKey : settings.ai.openaiApiKey;
    if (encryptedKey) {
      try {
        return decrypt(encryptedKey);
      } catch (error) {
        console.error(error);
      }
    }
  }

  switch (provider) {
    case 'groq':
      return getGroqApiKey();
    case 'openai':
      return getOpenAIApiKey();
  }
}

function getEffectiveModel(provider: AIProviderType, configuredModel?: string): string {
  if (configuredModel) return configuredModel;
  return provider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL;
}

export async function callAI(
  provider: AIProviderType,
  apiKey: string,
  messages: AIMessage[],
  options?: AIOptions
): Promise<string> {
  const model = getEffectiveModel(provider, options?.model);

  switch (provider) {
    case 'groq':
      return callGroq(apiKey, messages as GroqMessage[], { ...options, model });
    case 'openai':
      return callOpenAI(apiKey, messages, { ...options, model });
  }
}

export function getProviderLabel(provider: AIProviderType): string {
  switch (provider) {
    case 'groq':
      return 'Groq';
    case 'openai':
      return 'OpenAI';
  }
}
