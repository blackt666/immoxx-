import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// Make OpenAI optional - disable if API key is not provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface PropertyValuationData {
  propertyType: string;
  size: number;
  location: string;
  condition: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  nearbyAmenities?: string[];
}

export interface ValuationResult {
  estimatedValue: number;
  confidenceScore: number; // 0-100
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    location: { score: number; impact: string };
    condition: { score: number; impact: string };
    size: { score: number; impact: string };
    market: { score: number; impact: string };
  };
  reasoning: string;
  recommendations?: string[];
  marketTrends: string;
}

export async function generatePropertyValuation(
  propertyData: PropertyValuationData,
): Promise<ValuationResult> {
  if (!openai) {
    console.warn('OpenAI API key not configured - property valuation disabled');
    // Return a basic fallback valuation
    return {
      estimatedValue: 350000, // Basic fallback estimate
      confidenceScore: 0,
      priceRange: { min: 300000, max: 400000 },
      factors: {
        location: { score: 50, impact: "Unknown - requires API configuration" },
        condition: { score: 50, impact: "Unknown - requires API configuration" },
        size: { score: 50, impact: "Unknown - requires API configuration" },
        market: { score: 50, impact: "Unknown - requires API configuration" }
      },
      reasoning: "Property valuation requires OpenAI API configuration. Please configure OPENAI_API_KEY to enable AI-powered valuations.",
      recommendations: ["Configure OpenAI API key for detailed valuations"],
      marketTrends: "Market analysis unavailable - API configuration required"
    };
  }

  try {
    const prompt = `
Als Immobiliengutachter für die Bodenseeregion, analysiere die folgende Immobilie und erstelle eine detaillierte Bewertung:

Immobiliendaten:
- Typ: ${propertyData.propertyType}
- Größe: ${propertyData.size} m²
- Lage: ${propertyData.location}
- Zustand: ${propertyData.condition}
- Baujahr: ${propertyData.yearBuilt || "Nicht angegeben"}
- Schlafzimmer: ${propertyData.bedrooms || "Nicht angegeben"}
- Badezimmer: ${propertyData.bathrooms || "Nicht angegeben"}
- Besonderheiten: ${propertyData.features?.join(", ") || "Keine angegeben"}
- Nahegelegene Annehmlichkeiten: ${propertyData.nearbyAmenities?.join(", ") || "Keine angegeben"}

Berücksichtige für die Bodenseeregion:
- Durchschnittliche Quadratmeterpreise in der jeweiligen Stadt
- Nähe zum Bodensee als Wertfaktor
- Touristische Attraktivität der Region
- Lokale Markttrends
- Infrastruktur und Verkehrsanbindung

Antworte im JSON-Format mit folgender Struktur:
{
  "estimatedValue": number,
  "confidenceScore": number (0-100),
  "priceRange": {
    "min": number,
    "max": number
  },
  "factors": {
    "location": { "score": number (0-100), "impact": "string" },
    "condition": { "score": number (0-100), "impact": "string" },
    "size": { "score": number (0-100), "impact": "string" },
    "market": { "score": number (0-100), "impact": "string" }
  },
  "reasoning": "Detaillierte Begründung der Bewertung",
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "marketTrends": "Aktuelle Markttrends für die Region"
}
`;

    // Replit has 30s request limit, leave 5s buffer
    const timeoutMs = process.env.REPL_SLUG ? 25000 : 60000;

    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Du bist ein erfahrener Immobiliengutachter mit spezieller Expertise für die Bodenseeregion. Verwende realistische Marktpreise und berücksichtige lokale Faktoren. Antworte ausschließlich im angegebenen JSON-Format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    // Race between completion and timeout
    const completion = await Promise.race([
      completionPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("AI request timed out (Replit constraint)")),
          timeoutMs,
        ),
      ),
    ]);

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Validate and ensure proper structure
    return {
      estimatedValue: result.estimatedValue || 0,
      confidenceScore: Math.max(0, Math.min(100, result.confidenceScore || 0)),
      priceRange: {
        min: result.priceRange?.min || result.estimatedValue * 0.9,
        max: result.priceRange?.max || result.estimatedValue * 1.1,
      },
      factors: {
        location: {
          score: Math.max(
            0,
            Math.min(100, result.factors?.location?.score || 50),
          ),
          impact: result.factors?.location?.impact || "Durchschnittliche Lage",
        },
        condition: {
          score: Math.max(
            0,
            Math.min(100, result.factors?.condition?.score || 50),
          ),
          impact:
            result.factors?.condition?.impact || "Durchschnittlicher Zustand",
        },
        size: {
          score: Math.max(0, Math.min(100, result.factors?.size?.score || 50)),
          impact: result.factors?.size?.impact || "Durchschnittliche Größe",
        },
        market: {
          score: Math.max(
            0,
            Math.min(100, result.factors?.market?.score || 50),
          ),
          impact: result.factors?.market?.impact || "Stabiler Markt",
        },
      },
      reasoning: result.reasoning || "Bewertung basiert auf lokalen Marktdaten",
      recommendations: result.recommendations || [],
      marketTrends:
        result.marketTrends || "Stabile Marktentwicklung in der Bodenseeregion",
    };
  } catch (error) {
    console.error("Error generating property valuation:", error);
    // Ensure the error message is informative for timeouts
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error(
        "AI-Bewertung ist fehlgeschlagen wegen Zeitüberschreitung. Bitte versuchen Sie es erneut.",
      );
    }
    throw new Error(
      "Fehler bei der AI-Bewertung. Bitte versuchen Sie es erneut.",
    );
  }
}

export async function analyzePropertyImage(
  imageBuffer: Buffer,
): Promise<string> {
  return "AI image analysis not configured";
}

export async function generatePropertyDescription(
  propertyData: any,
): Promise<string> {
  return "AI description generation not configured";
}

export async function getPropertyValuation(propertyData: any) {
  return { valuation: "AI service not configured", estimate: 0 };
}

export interface SEOKeywordAnalysis {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  localKeywords: string[];
  competitorKeywords: string[];
  seasonalKeywords: string[];
  searchVolume: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  recommendations: string[];
}

export async function generateSEOKeywords(
  topic: string,
  location: string = "Bodensee",
  propertyType?: string
): Promise<SEOKeywordAnalysis> {
  if (!openai) {
    throw new Error("OpenAI client not initialized. Please check your API key.");
  }

  try {
    const prompt = `
Als SEO-Experte für Immobilien in der DACH-Region, analysiere das folgende Thema und generiere eine umfassende Keyword-Strategie:

Thema: ${topic}
Standort: ${location}
Immobilienart: ${propertyType || "Alle Arten"}

Berücksichtige:
- Deutsche Suchgewohnheiten und Begriffe
- Lokale SEO für die ${location}-Region
- Immobilienspezifische Fachbegriffe
- Saisonale Trends (Bodensee-Tourismus)
- Kaufabsicht-Keywords (transactional)
- Informationssuche-Keywords (informational)
- Lokale Konkurrenz und Nischenbegriffe

Antworte im JSON-Format mit folgender Struktur:
{
  "primaryKeywords": ["Hauptkeyword 1", "Hauptkeyword 2"],
  "secondaryKeywords": ["Sekundäres Keyword 1", "Sekundäres Keyword 2"],
  "longTailKeywords": ["Long-tail Keyword 1", "Long-tail Keyword 2"],
  "localKeywords": ["Lokales Keyword 1", "Lokales Keyword 2"],
  "competitorKeywords": ["Konkurrenz Keyword 1", "Konkurrenz Keyword 2"],
  "seasonalKeywords": ["Saisonales Keyword 1", "Saisonales Keyword 2"],
  "searchVolume": "high|medium|low",
  "difficulty": "easy|medium|hard",
  "recommendations": ["SEO-Empfehlung 1", "SEO-Empfehlung 2"]
}
`;

    const timeoutMs = process.env.REPL_SLUG ? 25000 : 60000;

    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Du bist ein erfahrener SEO-Experte für Immobilien in der DACH-Region mit Fokus auf lokale SEO und deutsche Suchgewohnheiten. Antworte ausschließlich im angegebenen JSON-Format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const completion = await Promise.race([
      completionPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("AI request timed out (Replit constraint)")),
          timeoutMs
        )
      )
    ]);

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      primaryKeywords: result.primaryKeywords || [],
      secondaryKeywords: result.secondaryKeywords || [],
      longTailKeywords: result.longTailKeywords || [],
      localKeywords: result.localKeywords || [],
      competitorKeywords: result.competitorKeywords || [],
      seasonalKeywords: result.seasonalKeywords || [],
      searchVolume: result.searchVolume || 'medium',
      difficulty: result.difficulty || 'medium',
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error generating SEO keywords:", error);
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error("AI-SEO-Analyse ist fehlgeschlagen wegen Zeitüberschreitung. Bitte versuchen Sie es erneut.");
    }
    throw new Error("Fehler bei der AI-SEO-Analyse. Bitte versuchen Sie es erneut.");
  }
}
