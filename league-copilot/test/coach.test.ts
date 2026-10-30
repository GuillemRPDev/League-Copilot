/** @jest-environment node */

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

import { POST } from "../app/api/coach/route";

const metric = {
  championId: 84,
  csPerMinute: 5.2,
  kda: 2.4,
  goldPerMinute: 350,
  damagePerMinute: 500,
  deathsPerMinute: 0.3,
  visionScore: 18,
  win: true,
};

const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
const originalOllamaUrl = process.env.OLLAMA_BASE_URL;
const originalOllamaModel = process.env.OLLAMA_MODEL;
const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

function makeRequest(matches = [metric]): NextRequest {
  return {
    json: async () => ({ matches }),
  } as NextRequest;
}

function mockFetch(response: Partial<Response>) {
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(response as Response);
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: fetchMock,
  });
  return fetchMock;
}

afterEach(() => {
  if (originalFetch) {
    Object.defineProperty(globalThis, "fetch", originalFetch);
  } else {
    Reflect.deleteProperty(globalThis, "fetch");
  }

  if (originalOllamaUrl === undefined) delete process.env.OLLAMA_BASE_URL;
  else process.env.OLLAMA_BASE_URL = originalOllamaUrl;

  if (originalOllamaModel === undefined) delete process.env.OLLAMA_MODEL;
  else process.env.OLLAMA_MODEL = originalOllamaModel;

  if (originalAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
});

describe("POST /api/coach with Ollama", () => {
  it("sends the configured model a concise Spanish prompt without thinking output", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434/";
    process.env.OLLAMA_MODEL = "llama3.2:3b";
    delete process.env.ANTHROPIC_API_KEY;
    const fetchMock = mockFetch({
      ok: true,
      json: async () => ({ response: "Prioridad: mejora el farmeo." }),
    });

    const response = await POST(makeRequest());
    const result = await response.json();
    const [url, options] = fetchMock.mock.calls[0] ?? [];
    const requestBody = JSON.parse(String(options?.body)) as {
      model: string;
      system: string;
      prompt: string;
      stream: boolean;
      options: { num_predict: number };
    };

    expect(response.status).toBe(200);
    expect(result).toEqual({ feedback: "Prioridad: mejora el farmeo.", provider: "ollama" });
    expect(url).toBe("http://localhost:11434/api/generate");
    expect(requestBody).toMatchObject({
      model: "llama3.2:3b",
      stream: false,
      options: { num_predict: 180 },
    });
    expect(requestBody.system).toContain("coach experto de League of Legends");
    expect(requestBody.prompt).toContain("responde exclusivamente en español");
  });

  it("returns metric-based feedback when no AI provider is configured", async () => {
    process.env.OLLAMA_BASE_URL = "";
    process.env.ANTHROPIC_API_KEY = "";
    const fetchMock = mockFetch({});

    const response = await POST(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.provider).toBe("metrics");
    expect(result.feedback).toContain("Análisis automático");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an Ollama-specific error when the model endpoint fails", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    delete process.env.ANTHROPIC_API_KEY;
    mockFetch({ ok: false, status: 404 });

    const response = await POST(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Ollama request failed: 404");
  });
});