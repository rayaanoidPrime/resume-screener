import { AIConfig } from "./providers";

function getAIConfig(): AIConfig {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() || "openai";
  const temperature = parseFloat(process.env.LLM_TEMPERATURE || "0.2");

  switch (provider) {
    case "openai":
      return {
        provider: "openai",
        model: process.env.OPENAI_MODEL || "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
        temperature,
      };
    case "anthropic":
      return {
        provider: "anthropic",
        model: process.env.ANTHROPIC_MODEL || "claude-2",
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature,
      };
    case "ollama":
      return {
        provider: "ollama",
        model: process.env.OLLAMA_MODEL || "llama2",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        temperature,
      };
    case "gemini":
      return {
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature,
      };
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export const aiConfig = getAIConfig();
