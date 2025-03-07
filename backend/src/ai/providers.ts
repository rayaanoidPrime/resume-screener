import OpenAI from "openai";

export interface AIProvider {
  completion: (text: string) => Promise<any>;
}

export interface AIConfig {
  provider: "openai" | "anthropic" | "ollama" | "gemini";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;

  constructor(config: AIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model;
    this.temperature = config.temperature || 0.2;
  }

  async completion(text: string): Promise<any> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an unstructured text parsing expert that outputs only valid JSON.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: this.temperature,
        response_format: { type: "json_object" },
      });

      return JSON.parse(completion.choices[0].message.content || "{}");
    } catch (error) {
      console.error("OpenAI parsing error:", error);
      throw new Error("Failed to parse text with OpenAI");
    }
  }
}

// Add more providers as needed (Anthropic, Ollama, etc.)
class AnthropicProvider implements AIProvider {
  // Implement Anthropic-specific logic
  async completion(text: string): Promise<any> {
    throw new Error("Anthropic provider not implemented yet");
  }
}

class OllamaProvider implements AIProvider {
  // Implement Ollama-specific logic
  async completion(text: string): Promise<any> {
    throw new Error("Ollama provider not implemented yet");
  }
}

class GeminiProvider implements AIProvider {
  // Implement Gemini-specific logic
  async completion(text: string): Promise<any> {
    throw new Error("Gemini provider not implemented yet");
  }
}

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider();
    case "ollama":
      return new OllamaProvider();
    case "gemini":
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
