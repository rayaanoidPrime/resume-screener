import OpenAI from "openai";
import ollama from "ollama";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIProvider {
  completion: (text: string, systemPrompt?: string) => Promise<any>;
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

  async completion(text: string, systemPrompt?: string): Promise<any> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are a helpful assistant",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: this.temperature,
        response_format: { type: "json_object" },
      });

      return completion.choices[0].message.content;
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
  private model: string;
  private temperature: number;

  constructor(config: AIConfig) {
    this.model = config.model || "llama3.1";
    this.temperature = config.temperature || 0.2;
  }

  async completion(text: string, systemPrompt?: string): Promise<any> {
    try {
      const response = await ollama.chat({
        options: {
          temperature: this.temperature,
        },
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are a helpful assistant",
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      return response.message.content;
    } catch (error) {
      console.error("Ollama parsing error:", error);
      throw new Error("Failed to parse text with Ollama");
    }
  }
}

class GeminiProvider implements AIProvider {
  private model: string;
  private temperature: number;
  private client: GoogleGenerativeAI;

  constructor(config: AIConfig) {
    this.model = config.model || "gemini-pro";
    this.temperature = config.temperature || 0.2;
    if (!config.apiKey) {
      throw new Error("API key is required for Gemini provider");
    }
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async completion(text: string, systemPrompt?: string): Promise<any> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent({
        generationConfig: {
          temperature: this.temperature,
        },
        contents: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
      });

      const responseText = result.response.text();

      return responseText;
    } catch (error) {
      console.error("Gemini parsing error:", error);
      throw new Error("Failed to parse text with Gemini");
    }
  }
}

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider();
    case "ollama":
      return new OllamaProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
