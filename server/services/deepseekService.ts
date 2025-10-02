import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * DeepSeek AI Service
 *
 * Provides AI-powered features using DeepSeek's API:
 * - Property valuation and analysis
 * - Market insights
 * - Document generation
 * - Customer support automation
 *
 * DeepSeek API is OpenAI-compatible, so we use the OpenAI SDK
 * with custom base URL and API key.
 */

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PropertyValuationRequest {
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

export interface PropertyValuationResponse {
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

export interface MarketAnalysisRequest {
  region: string;
  propertyType?: string;
  timeframe?: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
  conversationHistory?: ChatCompletionMessageParam[];
}

export class DeepSeekService {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: DeepSeekConfig) {
    if (!config.apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com/v1',
    });

    this.model = config.model || 'deepseek-chat';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * AI-powered property valuation
   */
  async valuateProperty(request: PropertyValuationRequest): Promise<PropertyValuationResponse> {
    const prompt = this.buildValuationPrompt(request);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Immobiliengutachter für die Bodensee-Region. Analysiere Immobilien basierend auf Marktdaten, Lage, Zustand und lokalen Faktoren. Antworte immer im JSON-Format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent valuations
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from DeepSeek API');
      }

      const parsed = JSON.parse(response);

      return {
        estimatedValue: parsed.estimatedValue,
        confidence: parsed.confidence,
        factors: parsed.factors,
        marketAnalysis: parsed.marketAnalysis,
        recommendations: parsed.recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('DeepSeek valuation error:', error);
      throw new Error(`Property valuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate market analysis for a region
   */
  async analyzeMarket(request: MarketAnalysisRequest): Promise<string> {
    const prompt = `
Erstelle eine detaillierte Marktanalyse für die Region ${request.region}.
${request.propertyType ? `Fokus auf ${request.propertyType}.` : ''}
${request.timeframe ? `Zeitraum: ${request.timeframe}.` : ''}

Bitte analysiere:
1. Aktuelle Marktlage und Trends
2. Preisentwicklung
3. Angebot und Nachfrage
4. Zukunftsprognosen
5. Investmentpotenzial

Gib eine fundierte, sachliche Analyse im Fließtext.
    `.trim();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Immobilienmarkt-Analyst mit Expertise in der Bodensee-Region. Liefere fundierte, datenbasierte Analysen.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      return completion.choices[0]?.message?.content || 'Analyse konnte nicht erstellt werden.';
    } catch (error) {
      console.error('DeepSeek market analysis error:', error);
      throw new Error(`Market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate property description
   */
  async generatePropertyDescription(property: {
    title: string;
    type: string;
    size: number;
    rooms: number;
    features: string[];
    location: string;
  }): Promise<string> {
    const prompt = `
Erstelle eine ansprechende, professionelle Immobilienbeschreibung für:

Titel: ${property.title}
Typ: ${property.type}
Größe: ${property.size} m²
Zimmer: ${property.rooms}
Lage: ${property.location}
Besonderheiten: ${property.features.join(', ')}

Die Beschreibung soll:
- Emotional ansprechend aber sachlich sein
- Die Vorzüge der Immobilie hervorheben
- Die Lage beschreiben
- Potenzielle Käufer ansprechen
- Etwa 150-200 Wörter umfassen
    `.trim();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Immobilienmakler, der ansprechende und verkaufsfördernde Immobilienbeschreibungen erstellt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || 'Beschreibung konnte nicht erstellt werden.';
    } catch (error) {
      console.error('DeepSeek description generation error:', error);
      throw new Error(`Description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat with AI assistant
   */
  async chat(request: ChatRequest): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Du bist ein hilfreicher Assistent für eine Immobilienmakler-Website in der Bodensee-Region.
          ${request.context || 'Beantworte Fragen professionell und freundlich.'}`
        }
      ];

      // Add conversation history if provided
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        messages.push(...request.conversationHistory);
      }

      // Add current message
      messages.push({
        role: 'user',
        content: request.message
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      return completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
    } catch (error) {
      console.error('DeepSeek chat error:', error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate email response for customer inquiry
   */
  async generateEmailResponse(inquiry: {
    customerName: string;
    subject: string;
    message: string;
    propertyReference?: string;
  }): Promise<string> {
    const prompt = `
Erstelle eine professionelle E-Mail-Antwort für folgende Kundenanfrage:

Von: ${inquiry.customerName}
Betreff: ${inquiry.subject}
${inquiry.propertyReference ? `Immobilie: ${inquiry.propertyReference}` : ''}

Nachricht:
${inquiry.message}

Die Antwort soll:
- Professionell und freundlich sein
- Auf die Anfrage eingehen
- Weitere Schritte vorschlagen
- Eine persönliche Note haben
- Mit einer Grußformel enden
    `.trim();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein professioneller Immobilienmakler, der auf Kundenanfragen antwortet.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return completion.choices[0]?.message?.content || 'E-Mail-Antwort konnte nicht erstellt werden.';
    } catch (error) {
      console.error('DeepSeek email generation error:', error);
      throw new Error(`Email generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build valuation prompt from request
   */
  private buildValuationPrompt(request: PropertyValuationRequest): string {
    return `
Bewerte folgende Immobilie für die Bodensee-Region:

Adresse: ${request.address}
Typ: ${request.propertyType}
Größe: ${request.size} m²
Zimmer: ${request.rooms}
${request.yearBuilt ? `Baujahr: ${request.yearBuilt}` : ''}
${request.condition ? `Zustand: ${request.condition}` : ''}
${request.features?.length ? `Ausstattung: ${request.features.join(', ')}` : ''}
${request.location ? `Lage: ${request.location.city}, ${request.location.region}` : ''}
${request.location?.proximity?.length ? `In der Nähe: ${request.location.proximity.join(', ')}` : ''}

Erstelle eine Bewertung im folgenden JSON-Format:
{
  "estimatedValue": {
    "min": <minimaler Wert in EUR>,
    "max": <maximaler Wert in EUR>,
    "average": <durchschnittlicher Wert in EUR>
  },
  "confidence": "<low|medium|high>",
  "factors": {
    "positive": [<Liste positiver Faktoren>],
    "negative": [<Liste negativer Faktoren>]
  },
  "marketAnalysis": "<Kurze Marktanalyse>",
  "recommendations": [<Liste von Empfehlungen>]
}
    `.trim();
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: 'Hallo, kannst du mich hören?' }
        ],
        max_tokens: 50
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('DeepSeek connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
let deepseekInstance: DeepSeekService | null = null;

export function getDeepSeekService(): DeepSeekService {
  if (!deepseekInstance) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }

    deepseekInstance = new DeepSeekService({
      apiKey,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
    });
  }

  return deepseekInstance;
}

// Export for testing
export function resetDeepSeekService(): void {
  deepseekInstance = null;
}
