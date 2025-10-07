# 🤖 Multi-AI Content Generator - Implementation Guide

## 📋 Übersicht

Das Multi-AI Content Generation System ermöglicht die Nutzung verschiedener AI-Provider für unterschiedliche Aufgaben:

- ✍️ **Text-Generierung** - Immobilienbeschreibungen, Social Media Posts, E-Mails
- 🎨 **Bild-Generierung** - Property Visualisierungen, Marketing-Grafiken
- 🎬 **Video-Generierung** - Property Tours, Social Media Reels
- 🔀 **Provider-Auswahl** - Flexibel zwischen Providern wählen

## 🚀 Unterstützte AI-Provider

### Text-Generierung

| Provider | Modell | Kosten (1M Tokens) | Use Case |
|----------|--------|-------------------|----------|
| **DeepSeek** | deepseek-chat | $0.14 | Standard-Texte (Primary) |
| **OpenAI** | gpt-4-turbo | $10.00 | Komplexe Aufgaben |
| **Google** | gemini-1.5-pro | $3.50 | Multimodal, lange Texte |
| **Qwen** | qwen-max | $0.50 | Multilingual, Budget |

### Bild-Generierung

| Provider | Modell | Kosten | Use Case |
|----------|--------|--------|----------|
| **OpenAI** | dall-e-3 | $0.040/Bild | Hochwertige Bilder |
| **Stability AI** | sdxl-1.0 | $0.004/Bild | Budget-Option |
| **Midjourney** | v6 | Premium | Künstlerische Visualisierung |

### Video-Generierung

| Provider | Modell | Kosten | Use Case |
|----------|--------|--------|----------|
| **RunwayML** | Gen-2 | $0.05/Sekunde | Property Tours |
| **Pika Labs** | Pika 1.0 | Beta | Social Media Reels |
| **Stable Video** | SVD | Open Source | Budget-Option |

## 📦 Installation

### Environment Variables

```bash
# Text Generation
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_MODEL=deepseek-chat

OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo

GOOGLE_AI_API_KEY=your-google-ai-key
GOOGLE_AI_MODEL=gemini-1.5-pro

QWEN_API_KEY=your-qwen-api-key
QWEN_MODEL=qwen-max

# Image Generation
STABILITY_AI_API_KEY=your-stability-key

# Video Generation
RUNWAY_API_KEY=your-runway-key
```

### Dependencies

```bash
npm install openai @google/generative-ai
```

## 🛠️ Implementierung

### Provider Abstraction Layer

```typescript
// server/services/ai/providers/base/BaseAIProvider.ts
export abstract class BaseAIProvider {
  abstract provider: string;
  
  constructor(protected config: AIProviderConfig) {}
  
  abstract generateText(params: TextGenerationParams): Promise<TextGenerationResult>;
  abstract generateImage?(params: ImageGenerationParams): Promise<ImageGenerationResult>;
  abstract generateVideo?(params: VideoGenerationParams): Promise<VideoGenerationResult>;
  
  protected async trackUsage(result: GenerationResult) {
    await db.insert(aiGenerations).values({
      id: nanoid(),
      userId: result.userId,
      provider: this.provider,
      generationType: result.type,
      tokensUsed: result.tokensUsed,
      costUSD: result.cost,
      status: 'completed',
    });
  }
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TextGenerationParams {
  prompt: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface TextGenerationResult {
  text: string;
  tokensUsed: number;
  cost: number;
  provider: string;
}
```

### DeepSeek Provider (Extended)

```typescript
// server/services/ai/providers/DeepSeekProvider.ts
import { BaseAIProvider } from './base/BaseAIProvider.js';

export class DeepSeekProvider extends BaseAIProvider {
  provider = 'deepseek';

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Experte für Immobilienbeschreibungen.',
          },
          {
            role: 'user',
            content: params.prompt,
          },
        ],
        temperature: params.temperature || this.config.temperature || 0.7,
        max_tokens: params.maxTokens || this.config.maxTokens || 2000,
      }),
    });

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      cost: (data.usage.total_tokens / 1000000) * 0.14, // $0.14 per 1M tokens
      provider: this.provider,
    };
  }
}
```

### OpenAI Provider (Extended)

```typescript
// server/services/ai/providers/OpenAIProvider.ts
import OpenAI from 'openai';
import { BaseAIProvider } from './base/BaseAIProvider.js';

export class OpenAIProvider extends BaseAIProvider {
  provider = 'openai';
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    const completion = await this.client.chat.completions.create({
      model: this.config.model || 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für Immobilienbeschreibungen.',
        },
        {
          role: 'user',
          content: params.prompt,
        },
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2000,
    });

    return {
      text: completion.choices[0].message.content || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      cost: (completion.usage?.total_tokens || 0) / 1000000 * 10.0, // $10 per 1M tokens
      provider: this.provider,
    };
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: params.prompt,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      n: params.quantity || 1,
    });

    return {
      urls: response.data.map(img => img.url!),
      cost: (params.quantity || 1) * 0.040, // $0.040 per image
      provider: this.provider,
    };
  }
}
```

### Google Gemini Provider

```typescript
// server/services/ai/providers/GoogleAIProvider.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base/BaseAIProvider.js';

export class GoogleAIProvider extends BaseAIProvider {
  provider = 'google';
  private client: GoogleGenerativeAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    const model = this.client.getGenerativeModel({ 
      model: this.config.model || 'gemini-1.5-pro' 
    });

    const result = await model.generateContent(params.prompt);
    const response = result.response;
    const text = response.text();

    // Estimate tokens (Gemini doesn't provide exact count)
    const estimatedTokens = Math.ceil(text.length / 4);

    return {
      text,
      tokensUsed: estimatedTokens,
      cost: (estimatedTokens / 1000000) * 3.50, // $3.50 per 1M tokens
      provider: this.provider,
    };
  }
}
```

### Provider Factory

```typescript
// server/services/ai/AIProviderFactory.ts
import { DeepSeekProvider } from './providers/DeepSeekProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { GoogleAIProvider } from './providers/GoogleAIProvider.js';
import { QwenProvider } from './providers/QwenProvider.js';

export class AIProviderFactory {
  private static providers = new Map<string, BaseAIProvider>();

  static create(
    provider: 'deepseek' | 'openai' | 'google' | 'qwen',
    config?: AIProviderConfig
  ): BaseAIProvider {
    const key = `${provider}-${config?.apiKey || 'default'}`;
    
    if (!this.providers.has(key)) {
      const providerConfig = config || this.getDefaultConfig(provider);
      
      switch (provider) {
        case 'deepseek':
          this.providers.set(key, new DeepSeekProvider(providerConfig));
          break;
        case 'openai':
          this.providers.set(key, new OpenAIProvider(providerConfig));
          break;
        case 'google':
          this.providers.set(key, new GoogleAIProvider(providerConfig));
          break;
        case 'qwen':
          this.providers.set(key, new QwenProvider(providerConfig));
          break;
      }
    }

    return this.providers.get(key)!;
  }

  private static getDefaultConfig(provider: string): AIProviderConfig {
    const apiKeyMap = {
      deepseek: process.env.DEEPSEEK_API_KEY!,
      openai: process.env.OPENAI_API_KEY!,
      google: process.env.GOOGLE_AI_API_KEY!,
      qwen: process.env.QWEN_API_KEY!,
    };

    return {
      apiKey: apiKeyMap[provider as keyof typeof apiKeyMap],
    };
  }
}
```

### Content Generation Service

```typescript
// server/services/ai/generators/TextGenerator.ts
import { AIProviderFactory } from '../AIProviderFactory.js';
import { db } from '../../../db.js';
import { aiGenerations } from '../../../../shared/schema.modules.js';
import { nanoid } from 'nanoid';

export class TextGenerator {
  /**
   * Generate property description
   */
  async generatePropertyDescription(
    property: Property,
    provider: 'deepseek' | 'openai' | 'google' | 'qwen' = 'deepseek'
  ) {
    const prompt = `
Erstelle eine ansprechende Immobilienbeschreibung für folgende Immobilie:

Typ: ${property.type}
Preis: ${property.price} EUR
Größe: ${property.size} m²
Zimmer: ${property.rooms}
Lage: ${property.location}, ${property.city}

Besonderheiten:
${property.hasGarden ? '- Garten vorhanden' : ''}
${property.hasBalcony ? '- Balkon vorhanden' : ''}
${property.hasParking ? '- Parkplatz vorhanden' : ''}

Erstelle einen professionellen, ansprechenden Text, der potenzielle Käufer überzeugt.
    `;

    const aiProvider = AIProviderFactory.create(provider);
    const result = await aiProvider.generateText({ prompt });

    // Save to database
    await db.insert(aiGenerations).values({
      id: nanoid(),
      userId: property.userId || 'system',
      provider,
      generationType: 'text',
      prompt,
      result: { text: result.text },
      tokensUsed: result.tokensUsed,
      costUSD: result.cost,
      propertyId: property.id,
      status: 'completed',
    });

    return result;
  }

  /**
   * Generate social media post
   */
  async generateSocialMediaPost(
    property: Property,
    platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok',
    provider: 'deepseek' | 'openai' | 'google' | 'qwen' = 'deepseek'
  ) {
    const platformGuidelines = {
      facebook: 'max 500 Zeichen, emotional ansprechend',
      instagram: 'max 300 Zeichen, mit Hashtags, visuell beschreibend',
      linkedin: 'max 700 Zeichen, professionell, Business-orientiert',
      tiktok: 'max 150 Zeichen, jung, trendy, mit Emojis',
    };

    const prompt = `
Erstelle einen Social Media Post für ${platform} für folgende Immobilie:

Typ: ${property.type}
Preis: ${property.price} EUR
Lage: ${property.city}

Plattform-Richtlinien: ${platformGuidelines[platform]}

Erstelle einen überzeugenden Post, der zum Klicken animiert.
    `;

    const aiProvider = AIProviderFactory.create(provider);
    return await aiProvider.generateText({ prompt });
  }

  /**
   * Generate email response
   */
  async generateEmailResponse(
    inquiry: any,
    context: 'initial_response' | 'follow_up' | 'viewing_confirmation',
    provider: 'deepseek' | 'openai' | 'google' | 'qwen' = 'deepseek'
  ) {
    const prompt = `
Erstelle eine professionelle E-Mail-Antwort auf folgende Anfrage:

Von: ${inquiry.name}
Betreff: Interesse an ${inquiry.propertyTitle}
Nachricht: ${inquiry.message}

Kontext: ${context}

Erstelle eine freundliche, professionelle Antwort, die alle Fragen beantwortet.
    `;

    const aiProvider = AIProviderFactory.create(provider);
    return await aiProvider.generateText({ prompt });
  }
}

export const textGenerator = new TextGenerator();
```

## 🎨 Frontend Integration

### AI Studio Dashboard

```typescript
// client/src/modules/ai-studio/components/AIStudioDashboard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useContentGeneration } from '../hooks/useContentGeneration';

export function AIStudioDashboard() {
  const [provider, setProvider] = useState<'deepseek' | 'openai' | 'google' | 'qwen'>('deepseek');
  const [prompt, setPrompt] = useState('');
  const { generate, isGenerating, result } = useContentGeneration();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Studio</h1>

      <Card>
        <CardHeader>
          <CardTitle>Text-Generierung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">AI Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <option value="deepseek">DeepSeek ($0.14/1M tokens) - Standard</option>
              <option value="openai">OpenAI GPT-4 ($10/1M tokens) - Premium</option>
              <option value="google">Google Gemini ($3.50/1M tokens) - Multimodal</option>
              <option value="qwen">Qwen ($0.50/1M tokens) - Budget</option>
            </Select>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Beschreibe, was du generieren möchtest..."
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => generate({ provider, prompt })}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generiere...' : 'Generieren'}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Ergebnis:</h3>
              <p className="whitespace-pre-wrap">{result.text}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Tokens: {result.tokensUsed} | Kosten: ${result.cost.toFixed(4)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 📊 Usage Tracking & Budgets

```typescript
// server/services/ai/UsageTracker.ts
export class UsageTracker {
  /**
   * Check if user has budget remaining
   */
  async checkBudget(userId: string, estimatedCost: number): Promise<boolean> {
    const [settings] = await db
      .select()
      .from(aiProviderSettings)
      .where(eq(aiProviderSettings.userId, userId));

    if (!settings?.monthlyBudgetUSD) return true; // No budget limit

    const currentMonth = new Date().getMonth();
    const monthlyUsage = await this.getMonthlyUsage(userId, currentMonth);

    return (monthlyUsage + estimatedCost) <= settings.monthlyBudgetUSD;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId: string) {
    const generations = await db
      .select()
      .from(aiGenerations)
      .where(eq(aiGenerations.userId, userId));

    return {
      totalGenerations: generations.length,
      totalCost: generations.reduce((sum, g) => sum + (g.costUSD || 0), 0),
      byProvider: this.groupByProvider(generations),
      byType: this.groupByType(generations),
    };
  }
}
```

## 🧪 Testing

```typescript
describe('AI Content Generation', () => {
  test('generates property description with DeepSeek', async () => {
    const result = await textGenerator.generatePropertyDescription(
      mockProperty,
      'deepseek'
    );

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(100);
    expect(result.cost).toBeLessThan(0.01);
  });

  test('respects budget limits', async () => {
    const hasB udget = await usageTracker.checkBudget('test-user', 100);
    expect(hasB udget).toBe(false); // User over budget
  });
});
```

---

**Status**: ✅ Implementiert (Text), 🚧 In Arbeit (Bild/Video)  
**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-10-07
