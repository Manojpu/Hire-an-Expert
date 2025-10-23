// AI Chat Widget Service - API Communication (fetch-based, no axios)

const API_GATEWAY_URL = (
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000"
).replace(/\/$/, "");
const RAG_API_BASE = `${API_GATEWAY_URL}/api/rag`;
const RAG_HEALTH_URL = `${API_GATEWAY_URL}/api/rag/health`;
// Toggle health checks to avoid noisy console errors when the AI service is down
const AI_HEALTHCHECK_ENABLED =
  import.meta.env.VITE_AI_HEALTHCHECK_ENABLED === "true";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  status: string;
  response: string;
  context_used: boolean;
  sources?: unknown[];
}

class AIchatService {
  /**
   * Send a chat message to the RAG system
   */
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const res = await fetch(`${RAG_API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, use_context: true }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return (await res.json()) as ChatResponse;
    } catch (error) {
      console.error("Chat error:", error);
      throw error;
    }
  }

  /**
   * Send a single query (alternative to chat)
   */
  async query(question: string): Promise<unknown> {
    try {
      const res = await fetch(`${RAG_API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, include_sources: true, top_k: 5 }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json();
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<boolean> {
    // Temporarily disable health checks to hide connection errors when service isn't running
    if (!AI_HEALTHCHECK_ENABLED) return false;
    try {
      const res = await fetch(RAG_HEALTH_URL);
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === "healthy";
    } catch {
      return false;
    }
  }
}

export default new AIchatService();
