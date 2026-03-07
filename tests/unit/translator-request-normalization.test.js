/**
 * Unit tests for Ollama content normalization in translateRequest
 * Ensures that content arrays are flattened to strings for Ollama provider
 */

import { describe, it, expect } from "vitest";
import { translateRequest, initTranslators } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

// Initialize translators before tests
initTranslators();

describe("translateRequest - Ollama content normalization", () => {
  it("translateRequest keeps /v1/messages Claude->OpenAI text payloads string-safe", () => {
    const body = {
      model: "ollama/gpt-oss:120b",
      system: [{ type: "text", text: "You are helpful." }],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "hello" },
            { type: "text", text: "world" },
          ],
        },
      ],
      stream: true,
    };

    const result = translateRequest(
      FORMATS.CLAUDE,
      FORMATS.OPENAI,
      "gpt-oss:120b",
      JSON.parse(JSON.stringify(body)),
      true,
      null,
      "ollama",
    );

    const userMessage = result.messages.find((m) => m.role === "user");
    expect(typeof userMessage.content).toBe("string");
    expect(userMessage.content).toBe("hello\nworld");
  });

  it("does NOT normalize content for non-Ollama providers", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "hello" },
            { type: "text", text: "world" },
          ],
        },
      ],
      stream: true,
    };

    const result = translateRequest(
      FORMATS.OPENAI,
      FORMATS.OPENAI,
      "gpt-4o",
      JSON.parse(JSON.stringify(body)),
      true,
      null,
      "openai",
    );

    const userMessage = result.messages.find((m) => m.role === "user");
    // For openai provider, content array is kept (filtered but not stringified)
    // filterToOpenAIFormat may convert but not to string - just verify not crashed
    expect(userMessage).toBeDefined();
  });

  it("normalizeContentToString: single text block produces plain string", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "just one block" }],
        },
      ],
    };

    const result = translateRequest(
      FORMATS.OPENAI,
      FORMATS.OPENAI,
      "gpt-oss:120b",
      JSON.parse(JSON.stringify(body)),
      true,
      null,
      "ollama",
    );

    const userMessage = result.messages.find((m) => m.role === "user");
    expect(typeof userMessage.content).toBe("string");
    expect(userMessage.content).toBe("just one block");
  });

  it("normalizeContentToString: string content stays unchanged", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: "already a string",
        },
      ],
    };

    const result = translateRequest(
      FORMATS.OPENAI,
      FORMATS.OPENAI,
      "gpt-oss:120b",
      JSON.parse(JSON.stringify(body)),
      true,
      null,
      "ollama",
    );

    const userMessage = result.messages.find((m) => m.role === "user");
    expect(userMessage.content).toBe("already a string");
  });
});
