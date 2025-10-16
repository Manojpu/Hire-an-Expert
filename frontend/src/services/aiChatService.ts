// AI Chat Widget Service - API Communication
import axios from 'axios';

// Use API Gateway instead of direct connection
const RAG_API_BASE = 'http://localhost:8000/api/rag';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  status: string;
  response: string;
  context_used: boolean;
  sources?: any[];
}

class AIchatService {
  
  /**
   * Send a chat message to the RAG system
   */
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${RAG_API_BASE}/chat`,
        {
          messages: messages,
          use_context: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Send a single query (alternative to chat)
   */
  async query(question: string): Promise<any> {
    try {
      const response = await axios.post(`${RAG_API_BASE}/query`, {
        question,
        include_sources: true,
        top_k: 5
      });
      return response.data;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get('http://localhost:8009/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default new AIchatService();
