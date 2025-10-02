import { useMutation, useQuery } from '@tanstack/react-query';

interface PropertyValuationRequest {
  address: string;
  propertyType: string;
  size: number;
  rooms: number;
  yearBuilt?: number;
  condition?: string;
  features?: string[];
  location?: {
    city: string;
    region: string;
    proximity?: string[];
  };
}

interface PropertyValuationResponse {
  estimatedValue: {
    min: number;
    max: number;
    average: number;
  };
  confidence: 'low' | 'medium' | 'high';
  factors: {
    positive: string[];
    negative: string[];
  };
  marketAnalysis: string;
  recommendations: string[];
  timestamp: Date;
}

interface MarketAnalysisRequest {
  region: string;
  propertyType?: string;
  timeframe?: string;
}

interface PropertyDescriptionRequest {
  title: string;
  type: string;
  size: number;
  rooms: number;
  features: string[];
  location: string;
}

interface ChatRequest {
  message: string;
  context?: string;
  conversationHistory?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

interface EmailResponseRequest {
  customerName: string;
  subject: string;
  message: string;
  propertyReference?: string;
}

/**
 * Hook for property valuation with DeepSeek AI
 */
export function usePropertyValuation() {
  return useMutation({
    mutationFn: async (data: PropertyValuationRequest): Promise<PropertyValuationResponse> => {
      const response = await fetch('/api/deepseek/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Property valuation failed');
      }

      const result = await response.json();
      return result.data;
    },
  });
}

/**
 * Hook for market analysis with DeepSeek AI
 */
export function useMarketAnalysis() {
  return useMutation({
    mutationFn: async (data: MarketAnalysisRequest): Promise<string> => {
      const response = await fetch('/api/deepseek/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Market analysis failed');
      }

      const result = await response.json();
      return result.data.analysis;
    },
  });
}

/**
 * Hook for generating property descriptions with DeepSeek AI
 */
export function usePropertyDescriptionGenerator() {
  return useMutation({
    mutationFn: async (data: PropertyDescriptionRequest): Promise<string> => {
      const response = await fetch('/api/deepseek/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Description generation failed');
      }

      const result = await response.json();
      return result.data.description;
    },
  });
}

/**
 * Hook for AI chat with DeepSeek
 */
export function useDeepSeekChat() {
  return useMutation({
    mutationFn: async (data: ChatRequest): Promise<string> => {
      const response = await fetch('/api/deepseek/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat failed');
      }

      const result = await response.json();
      return result.data.response;
    },
  });
}

/**
 * Hook for generating email responses with DeepSeek AI
 */
export function useEmailGenerator() {
  return useMutation({
    mutationFn: async (data: EmailResponseRequest): Promise<string> => {
      const response = await fetch('/api/deepseek/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Email generation failed');
      }

      const result = await response.json();
      return result.data.emailResponse;
    },
  });
}

/**
 * Hook for checking DeepSeek service status
 */
export function useDeepSeekStatus() {
  return useQuery({
    queryKey: ['deepseek', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/deepseek/status', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch DeepSeek status');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for testing DeepSeek connection
 */
export function useDeepSeekConnectionTest() {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const response = await fetch('/api/deepseek/test', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Connection test failed');
      }

      const result = await response.json();
      return result.data.connected;
    },
  });
}
