# 🎨 Social Media Integration - Quick Start Guide

## 📋 Übersicht

Die Social Media Integration ermöglicht es Ihnen, Inhalte zentral zu erstellen und auf mehreren Plattformen gleichzeitig zu veröffentlichen:

- ✅ **Facebook** - Posts, Stories, Carousels
- ✅ **Instagram** - Feed Posts, Stories, Reels
- ✅ **LinkedIn** - Company Posts, Articles
- ✅ **TikTok** - Video Publishing

## 🚀 Features

### 1. Multi-Platform Publishing
- Ein Klick, mehrere Plattformen
- Plattform-spezifische Anpassungen
- Zeitplanung (Scheduling)
- Entwürfe speichern

### 2. Content Management
- Zentrale Übersicht aller Posts
- Status-Tracking (Draft, Scheduled, Published)
- Medien-Upload (Bilder, Videos)
- Integration mit Immobilien-Daten

### 3. Analytics Dashboard
- Performance-Metriken pro Post
- Engagement-Tracking
- Plattform-Vergleich
- Zeitreihen-Analysen

## 📦 Installation

Die Funktionalität ist bereits im System integriert. Folgende Schritte sind notwendig:

### 1. Database Migration

```bash
# Führe die Migration aus (erstellt neue Tabellen)
npm run db:push
```

Dies erstellt folgende Tabellen:
- `social_media_posts` - Gespeicherte Posts
- `social_media_accounts` - Verbundene Accounts
- `social_media_analytics` - Analytics-Daten
- `ai_generations` - AI-generierte Inhalte
- `ai_provider_settings` - AI-Provider-Konfiguration

### 2. API Keys konfigurieren

Erstelle oder aktualisiere `.env`:

```bash
# Social Media APIs
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# AI Providers (optional - für Content-Generierung)
DEEPSEEK_API_KEY=sk-your-deepseek-key
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
QWEN_API_KEY=your-qwen-api-key
```

## 🎯 Verwendung

### Zugriff auf das Dashboard

Nach dem Login navigiere zu:
```
https://your-domain.com/admin/social-media
```

### 1. Social Media Accounts verbinden

1. Klicke auf "Verbinden" bei der gewünschten Plattform
2. Autorisiere die Anwendung (OAuth-Flow)
3. Account wird in der Übersicht angezeigt

### 2. Ersten Post erstellen

```typescript
// Über die UI:
1. Klicke "Neuer Post"
2. Titel und Inhalt eingeben
3. Plattformen auswählen
4. Optional: Medien hochladen
5. "Jetzt veröffentlichen" oder "Planen"

// Über die API:
POST /api/social-media/publish
{
  "title": "Luxuriöse Villa am Bodensee",
  "content": "Entdecken Sie diese traumhafte Villa...",
  "platforms": ["facebook", "instagram", "linkedin"],
  "mediaUrls": ["https://..."],
  "propertyId": "property-123"
}
```

### 3. Posts verwalten

- **Entwürfe bearbeiten**: Vor Veröffentlichung anpassen
- **Geplante Posts**: Zeitplan ändern oder löschen
- **Veröffentlichte Posts**: Analytics anzeigen

## 🔌 API Endpoints

### Posts

```bash
# Liste aller Posts
GET /api/social-media/posts

# Einzelner Post
GET /api/social-media/posts/:id

# Post erstellen und veröffentlichen
POST /api/social-media/publish
{
  "title": "...",
  "content": "...",
  "platforms": ["facebook", "instagram"],
  "scheduledAt": "2025-12-31T12:00:00Z"  # Optional
}

# Post aktualisieren (nur Entwürfe)
PUT /api/social-media/posts/:id

# Post löschen
DELETE /api/social-media/posts/:id
```

### Accounts

```bash
# Verbundene Accounts
GET /api/social-media/accounts

# Account verbinden (OAuth)
POST /api/social-media/accounts/connect
{
  "platform": "facebook"
}

# Account trennen
DELETE /api/social-media/accounts/:id
```

### Analytics

```bash
# Analytics für einen Post
GET /api/social-media/analytics/:postId

# Gesamt-Übersicht
GET /api/social-media/analytics/overview
```

## 🛠️ Entwicklung

### Projekt-Struktur

```
client/src/modules/social-media/
├── components/
│   └── SocialMediaDashboard.tsx    # Haupt-Dashboard
├── hooks/
│   └── useSocialMedia.ts           # React Hooks
└── types/
    └── social-media.types.ts       # TypeScript Typen

server/
├── routes/
│   └── social-media.ts             # API Routes
└── services/social-media/
    ├── SocialMediaService.ts       # Core Service
    ├── platforms/                  # Platform Adapters (TODO)
    ├── scheduling/                 # Scheduling System (TODO)
    └── analytics/                  # Analytics Service (TODO)

shared/
└── schema.modules.ts               # Database Schema
```

### Erweiterungen implementieren

#### 1. Neuer Platform Adapter

```typescript
// server/services/social-media/platforms/FacebookAdapter.ts
import type { PlatformAdapter } from '../types';

export class FacebookAdapter implements PlatformAdapter {
  platform = 'facebook' as const;

  async publishPost(post, account) {
    // Facebook Graph API Integration
    const response = await fetch('https://graph.facebook.com/v18.0/me/feed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify({
        message: post.content,
        // ... weitere Parameter
      }),
    });
    
    return {
      success: response.ok,
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`,
    };
  }

  async getAnalytics(postId, account) {
    // Fetch insights from Facebook
  }

  async validateToken(account) {
    // Check token validity
  }

  async refreshToken(account) {
    // Refresh access token
  }
}
```

#### 2. Scheduling System

Das Scheduling-System kann mit BullMQ implementiert werden:

```bash
npm install bullmq ioredis
```

```typescript
// server/services/social-media/scheduling/SchedulerService.ts
import { Queue, Worker } from 'bullmq';

const publishQueue = new Queue('social-media-publish');

// Add scheduled post to queue
await publishQueue.add('publish-post', 
  { postId: 'abc123', userId: 'user456' },
  { delay: scheduledDate - now }
);

// Worker to process scheduled posts
const worker = new Worker('social-media-publish', async job => {
  const { postId, userId } = job.data;
  await socialMediaService.publishPost(postId, userId);
});
```

## 🧪 Testing

### Unit Tests

```typescript
// tests/social-media.test.ts
import { socialMediaService } from '../server/services/social-media/SocialMediaService';

describe('SocialMediaService', () => {
  test('creates post successfully', async () => {
    const result = await socialMediaService.createPost({
      userId: 'test-user',
      title: 'Test Post',
      content: 'Test content',
      platforms: ['facebook'],
    });
    
    expect(result.success).toBe(true);
    expect(result.post).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// tests/social-media.spec.ts
import { test, expect } from '@playwright/test';

test('user can create and schedule post', async ({ page }) => {
  await page.goto('/admin/social-media');
  
  await page.click('text=Neuer Post');
  await page.fill('[name="title"]', 'Test Post');
  await page.fill('[name="content"]', 'Test content');
  await page.check('[name="platform-facebook"]');
  
  await page.click('button:has-text("Veröffentlichen")');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 🔒 Sicherheit

### Token-Verschlüsselung

Access Tokens werden verschlüsselt in der Datenbank gespeichert:

```typescript
import { encrypt, decrypt } from './lib/crypto';

// Speichern
const encryptedToken = encrypt(accessToken);
await db.insert(socialMediaAccounts).values({
  accessToken: encryptedToken,
  // ...
});

// Abrufen
const account = await db.select()...;
const decryptedToken = decrypt(account.accessToken);
```

### Rate Limiting

API Endpoints sind mit Rate Limiting geschützt:

```typescript
// 100 requests pro Stunde pro User
const rateLimits = {
  socialMedia: { maxRequests: 100, windowMs: 3600000 },
};
```

## 📊 Monitoring

### Logging

Alle Aktionen werden geloggt:

```typescript
log.info('Social media post created', { 
  postId, 
  userId, 
  platforms 
});

log.error('Failed to publish to platform', { 
  platform, 
  error 
});
```

### Metriken

Wichtige Metriken tracken:
- Posts pro Tag/Woche/Monat
- Erfolgsrate pro Plattform
- Durchschnittliche Engagement-Rate
- API-Kosten

## 🐛 Troubleshooting

### "Account nicht verbunden"

**Problem**: Platform-Account kann nicht verbunden werden  
**Lösung**: 
1. Überprüfe API Keys in `.env`
2. Stelle sicher, dass Callback-URL korrekt konfiguriert ist
3. Prüfe OAuth-App-Einstellungen auf der Plattform

### "Post wird nicht veröffentlicht"

**Problem**: Geplante Posts werden nicht publiziert  
**Lösung**:
1. Überprüfe, ob Scheduling-System läuft (BullMQ Worker)
2. Prüfe Redis-Verbindung
3. Überprüfe Logs für Fehler

### "Analytics nicht verfügbar"

**Problem**: Analytics werden nicht angezeigt  
**Lösung**:
1. Analytics-Service muss noch implementiert werden (siehe TODOs)
2. Plattform-APIs haben Verzögerung (24-48h für vollständige Daten)

## 📚 Weitere Dokumentation

- [Fullstack Plan](./fullstack-NEU-plan.md) - Vollständiger Implementierungsplan
- [API Documentation](./API.md) - Detaillierte API-Dokumentation (TODO)
- [Architecture](./ARCHITECTURE.md) - System-Architektur (TODO)

## 🎯 Roadmap

### Phase 1 (Aktuell) ✅
- [x] Grundlegende Datenbank-Schema
- [x] API Endpoints
- [x] React Components
- [x] Service Layer

### Phase 2 (In Arbeit)
- [ ] Platform Adapters implementieren
- [ ] OAuth-Flow vervollständigen
- [ ] Scheduling mit BullMQ
- [ ] Analytics-Integration

### Phase 3 (Geplant)
- [ ] AI Content Generation
- [ ] A/B Testing
- [ ] Automatische Posting-Zeitplanung
- [ ] Social Listening

## 💡 Best Practices

1. **Content-Strategie**: Plane Posts im Voraus mit dem Scheduler
2. **Plattform-Optimierung**: Nutze plattform-spezifische Formate
3. **Analytics**: Überwache Performance und optimiere Content
4. **Engagement**: Reagiere auf Kommentare und Nachrichten
5. **Konsistenz**: Regelmäßige Posts für bessere Reichweite

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues: [Repository Issues](https://github.com/blackt666/immoxx-final-version/issues)
- Dokumentation: [docs/](./docs/)

---

**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-10-07  
**Autor**: ImmoXX Development Team
