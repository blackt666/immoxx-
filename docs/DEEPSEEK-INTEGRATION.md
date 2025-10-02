# DeepSeek AI Integration

## Übersicht

Die ImmoXX-Platform integriert DeepSeek AI für intelligente Immobilienbewertung, Marktanalysen und Content-Generierung.

## Features

### 🏠 Immobilienbewertung
- AI-gestützte Wertermittlung
- Berücksichtigung von Lage, Zustand, Ausstattung
- Konfidenz-Score (niedrig/mittel/hoch)
- Positive und negative Faktoren
- Empfehlungen

### 📊 Marktanalyse
- Regionale Marktübersicht
- Preisentwicklung und Trends
- Angebot und Nachfrage
- Zukunftsprognosen
- Investmentpotenzial

### ✍️ Content-Generierung
- Automatische Immobilienbeschreibungen
- E-Mail-Antworten generieren
- SEO-optimierte Texte
- Mehrsprachige Inhalte

### 💬 AI-Chat Assistent
- Beratung für Kunden
- Kontextbewusste Antworten
- Conversation History

---

## Setup

### 1. API Key konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# DeepSeek AI Configuration
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.7
```

### 2. API Key erhalten

1. Registriere dich bei [DeepSeek](https://platform.deepseek.com)
2. Navigiere zu API Keys
3. Erstelle einen neuen API Key
4. Kopiere den Key in `.env`

### 3. Server starten

```bash
npm run dev
```

---

## API Endpunkte

### Property Valuation

```http
POST /api/deepseek/valuation
Content-Type: application/json

{
  "address": "Seestraße 15, 78464 Konstanz",
  "propertyType": "Wohnung",
  "size": 120,
  "rooms": 3,
  "yearBuilt": 2015,
  "condition": "gut",
  "features": ["Balkon", "Seeblick"],
  "location": {
    "city": "Konstanz",
    "region": "Bodensee"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedValue": {
      "min": 450000,
      "max": 550000,
      "average": 500000
    },
    "confidence": "high",
    "factors": {
      "positive": ["Seeblick", "Zentrale Lage"],
      "negative": ["Keine Tiefgarage"]
    },
    "marketAnalysis": "...",
    "recommendations": ["..."]
  }
}
```

### Market Analysis

```http
POST /api/deepseek/market-analysis
Content-Type: application/json

{
  "region": "Bodensee",
  "propertyType": "Wohnung",
  "timeframe": "letzten 12 Monate"
}
```

### Generate Description

```http
POST /api/deepseek/generate-description
Content-Type: application/json

{
  "title": "Moderne 3-Zimmer-Wohnung",
  "type": "Wohnung",
  "size": 120,
  "rooms": 3,
  "features": ["Balkon", "Seeblick"],
  "location": "Konstanz"
}
```

### Chat

```http
POST /api/deepseek/chat
Content-Type: application/json

{
  "message": "Wie ist der Immobilienmarkt am Bodensee?",
  "context": "Immobilienberatung",
  "conversationHistory": []
}
```

### Generate Email

```http
POST /api/deepseek/generate-email
Content-Type: application/json

{
  "customerName": "Max Mustermann",
  "subject": "Anfrage zu Wohnung in Konstanz",
  "message": "Ich interessiere mich für die Wohnung...",
  "propertyReference": "WOH-123"
}
```

### Status & Test

```http
GET /api/deepseek/status
GET /api/deepseek/test
```

---

## Frontend Integration

### React Hooks

```tsx
import {
  usePropertyValuation,
  useMarketAnalysis,
  usePropertyDescriptionGenerator,
  useDeepSeekChat,
} from '@/hooks/useDeepSeek';

function MyComponent() {
  const { mutate: valuate, data, isPending } = usePropertyValuation();

  const handleValuation = () => {
    valuate({
      address: 'Seestraße 15',
      propertyType: 'Wohnung',
      size: 120,
      rooms: 3,
    });
  };

  return (
    <div>
      <button onClick={handleValuation} disabled={isPending}>
        Immobilie bewerten
      </button>
      {data && <div>Wert: {data.estimatedValue.average} EUR</div>}
    </div>
  );
}
```

### Property Valuation Component

```tsx
import PropertyValuationAI from '@/components/PropertyValuationAI';

function AdminPage() {
  return (
    <div>
      <h1>AI Immobilienbewertung</h1>
      <PropertyValuationAI />
    </div>
  );
}
```

---

## Testing

### Automated Tests

```bash
# Run DeepSeek integration tests
node test-deepseek.js

# With custom base URL
TEST_BASE_URL=http://localhost:5001 node test-deepseek.js
```

### Manual Testing

```bash
# Test connection
curl http://localhost:5001/api/deepseek/test

# Test status
curl http://localhost:5001/api/deepseek/status

# Test valuation
curl -X POST http://localhost:5001/api/deepseek/valuation \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Seestraße 15",
    "propertyType": "Wohnung",
    "size": 120,
    "rooms": 3
  }'
```

---

## Kosten & Limits

### DeepSeek Pricing
- **deepseek-chat**: ~$0.27 / 1M tokens (Input), ~$1.10 / 1M tokens (Output)
- Sehr kostengünstig im Vergleich zu GPT-4

### Rate Limiting
- Standardmäßig begrenzt durch DeepSeek API
- Empfehlung: Eigene Rate-Limiting-Layer implementieren

### Token Management
- Durchschnittliche Bewertung: ~800-1200 tokens
- Marktanalyse: ~1000-1500 tokens
- Beschreibung: ~300-500 tokens

---

## Best Practices

### 1. Error Handling
```typescript
try {
  const valuation = await deepseek.valuateProperty(data);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('API key')) {
    // Handle authentication errors
  }
}
```

### 2. Caching
```typescript
// Cache Bewertungen für 24h
const cacheKey = `valuation:${propertyId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const valuation = await deepseek.valuateProperty(data);
await redis.setex(cacheKey, 86400, JSON.stringify(valuation));
```

### 3. Prompt Engineering
```typescript
// Klare, strukturierte Prompts
const prompt = `
Bewerte folgende Immobilie:
- Adresse: ${address}
- Typ: ${propertyType}
- Größe: ${size} m²

Antworte im JSON-Format.
`;
```

---

## Troubleshooting

### API Key Fehler
```
Error: DEEPSEEK_API_KEY environment variable is not set
```
**Lösung:** Füge `DEEPSEEK_API_KEY` in `.env` hinzu

### Connection Timeout
```
Error: Connection timeout
```
**Lösung:** Prüfe Internetverbindung und Firewall-Einstellungen

### Rate Limit Exceeded
```
Error: Rate limit exceeded
```
**Lösung:** Warte 60 Sekunden oder upgrade DeepSeek Plan

### Invalid Response Format
```
Error: Unexpected response format
```
**Lösung:** Prüfe Prompt und `response_format` Parameter

---

## Sicherheit

### API Key Schutz
- ✅ Niemals API Keys im Code committen
- ✅ `.env` in `.gitignore`
- ✅ Verwende Environment Variables
- ✅ API-Endpunkte mit `requireAuth` schützen

### Input Validation
- ✅ Alle Eingaben mit Zod validieren
- ✅ SQL Injection Prevention
- ✅ XSS Protection

### Rate Limiting
- ✅ Server-seitiges Rate Limiting
- ✅ Client-seitige Anfragen-Drosselung

---

## Weiterführende Links

- [DeepSeek Documentation](https://platform.deepseek.com/docs)
- [DeepSeek API Reference](https://platform.deepseek.com/api-docs)
- [OpenAI SDK (kompatibel)](https://github.com/openai/openai-node)

---

## Support

Bei Problemen oder Fragen:
1. Prüfe [Troubleshooting](#troubleshooting)
2. Konsultiere [DeepSeek Docs](https://platform.deepseek.com/docs)
3. Erstelle ein GitHub Issue

---

**Last Updated:** 2025-10-02
