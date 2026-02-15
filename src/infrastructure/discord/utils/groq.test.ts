import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../logger', () => ({
  createLogger: () => ({ warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { callGroq, getGroqApiKey, DEFAULT_GROQ_MODEL, GROQ_MODELS } from './groq';

function groqResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

describe('callGroq', () => {
  const apiKey = 'test-key';
  const messages = [{ role: 'user' as const, content: 'Hello' }];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  it('should return content from choices[0]', async () => {
    mockFetch.mockResolvedValue(groqResponse('Hi there'));

    const result = await callGroq(apiKey, messages);
    expect(result).toBe('Hi there');
  });

  it('should use default temperature 0.3, maxTokens 1024 and default model', async () => {
    mockFetch.mockResolvedValue(groqResponse('ok'));

    await callGroq(apiKey, messages);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(1024);
    expect(body.model).toBe(DEFAULT_GROQ_MODEL);
  });

  it('should pass custom options to body', async () => {
    mockFetch.mockResolvedValue(groqResponse('ok'));

    await callGroq(apiKey, messages, { temperature: 0.9, maxTokens: 512 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.9);
    expect(body.max_tokens).toBe(512);
  });

  it('should use custom model when provided', async () => {
    mockFetch.mockResolvedValue(groqResponse('ok'));

    await callGroq(apiKey, messages, { model: 'llama-3.1-8b-instant' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe('llama-3.1-8b-instant');
  });

  it('should throw on HTTP error with status code', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    });

    await expect(callGroq(apiKey, messages)).rejects.toThrow('Groq API error: 429');
  });

  it('should throw on empty content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '' } }] }),
    });

    await expect(callGroq(apiKey, messages)).rejects.toThrow('Empty response from Groq API');
  });
});

describe('GROQ_MODELS', () => {
  it('should export a non-empty models list with default as first', () => {
    expect(GROQ_MODELS.length).toBeGreaterThan(0);
    expect(DEFAULT_GROQ_MODEL).toBe(GROQ_MODELS[0]);
  });
});

describe('getGroqApiKey', () => {
  it('should read process.env.GROQ_API_KEY', () => {
    const original = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'my-secret-key';

    expect(getGroqApiKey()).toBe('my-secret-key');

    if (original !== undefined) {
      process.env.GROQ_API_KEY = original;
    } else {
      delete process.env.GROQ_API_KEY;
    }
  });

  it('should return undefined when env var is not set', () => {
    const original = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    expect(getGroqApiKey()).toBeUndefined();

    if (original !== undefined) {
      process.env.GROQ_API_KEY = original;
    }
  });
});
