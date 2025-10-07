# 🚀 ImmoXX - Comprehensive Fullstack Enterprise Plan

**Version:** 2.0  
**Erstellt:** 2025-10-07  
**Status:** Aktive Entwicklung  
**Ziel:** Modulare Enterprise-Plattform für Immobilienmakler mit Social Media & AI Integration

---

## 📋 Executive Summary

Diese Dokumentation beschreibt die vollständige Architektur für die Erweiterung der ImmoXX-Plattform zu einer modularen Enterprise-Lösung mit folgenden Kernfunktionen:

1. **Social Media Content Hub** - Multi-Platform Publishing (Facebook, Instagram, LinkedIn, TikTok)
2. **Multi-AI Content Generation** - Text, Bild & Video mit Provider-Auswahl
3. **3D-Architektur Generator** - KI-gestützte 3D-Visualisierung
4. **Projekt Management** - Integration OptimAizeFlow
5. **Erweiterte Makler-Features** - Branchen-spezifische Tools
6. **GitHub Codespaces** - Live Browser Development

---

## 🏗️ Modulare Architektur (Enterprise-Ready)

### Architektur-Prinzipien

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Dashboard │ │ Social   │ │  AI Hub  │ │ 3D View  │      │
│  │  Module  │ │  Media   │ │  Module  │ │  Module  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  CRM     │ │ Content  │ │   AI     │ │  3D Gen  │      │
│  │ Service  │ │ Service  │ │ Provider │ │ Service  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ SQLite   │ │ File     │ │  Cache   │ │ External │      │
│  │   DB     │ │ Storage  │ │  Layer   │ │   APIs   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Modul-System Design

**Kernprinzipien:**
- **Pluggable Architecture** - Module können einzeln aktiviert/deaktiviert werden
- **Dependency Injection** - Loose coupling zwischen Modulen
- **Event-Driven** - Asynchrone Kommunikation über Event Bus
- **API-First** - Jedes Modul exponiert eigene REST API
- **Configuration as Code** - JSON/YAML-basierte Modul-Konfiguration

---

## 🎯 Feature-Module im Detail

### 1. Social Media Content Hub

**Modul-ID:** `social-media-hub`  
**Status:** 🆕 Neu  
**Priorität:** Hoch

#### 1.1 Multi-Platform Publishing

```typescript
// Module Structure
client/src/modules/social-media/
├── components/
│   ├── SocialMediaDashboard.tsx       # Haupt-Dashboard
│   ├── ContentScheduler.tsx           # Post-Planung
│   ├── MultiPlatformPublisher.tsx     # Publishing Interface
│   ├── PlatformSelector.tsx           # Platform-Auswahl
│   └── ContentPreview.tsx             # Vorschau für alle Plattformen
├── hooks/
│   ├── useSocialMedia.ts              # Social Media Hook
│   ├── useContentSchedule.ts          # Scheduling Hook
│   └── usePlatformAuth.ts             # OAuth Management
├── lib/
│   ├── platformAdapters.ts            # Platform-spezifische Adapter
│   └── contentFormatter.ts            # Format-Konvertierung
└── types/
    └── social-media.types.ts          # TypeScript Definitionen

server/services/social-media/
├── SocialMediaService.ts              # Core Service
├── platforms/
│   ├── FacebookAdapter.ts             # Facebook API Integration
│   ├── InstagramAdapter.ts            # Instagram Graph API
│   ├── LinkedInAdapter.ts             # LinkedIn API v2
│   └── TikTokAdapter.ts               # TikTok API for Business
├── scheduling/
│   ├── SchedulerService.ts            # Cron-basiertes Scheduling
│   └── QueueManager.ts                # Job Queue (Bull/BullMQ)
└── analytics/
    └── SocialAnalyticsService.ts      # Performance Tracking
```

#### 1.2 Platform-Spezifikationen

**Facebook Integration:**
- **API:** Facebook Graph API v18.0
- **Features:**
  - Posting auf Pages & Groups
  - Story Publishing
  - Photo/Video Albums
  - Carousel Posts
  - Analytics (Reach, Engagement, Clicks)
- **Auth:** OAuth 2.0 mit Long-lived Tokens
- **Rate Limits:** 200 calls/hour

**Instagram Integration:**
- **API:** Instagram Graph API
- **Features:**
  - Feed Posts (Image/Video)
  - Instagram Stories
  - Reels Publishing
  - Carousel Posts
  - Hashtag Analytics
- **Auth:** Facebook OAuth + Instagram Business Account
- **Rate Limits:** 200 calls/hour (shared mit Facebook)

**LinkedIn Integration:**
- **API:** LinkedIn Marketing API v2
- **Features:**
  - Company Page Posts
  - Article Publishing
  - Document Sharing
  - Video Posts
  - Analytics (Impressions, Clicks, Engagement)
- **Auth:** OAuth 2.0 mit Token Refresh
- **Rate Limits:** 100 calls/day (pro User)

**TikTok Integration:**
- **API:** TikTok for Business API
- **Features:**
  - Video Publishing
  - Caption & Hashtags
  - Location Tagging
  - Sound Selection
  - Analytics (Views, Likes, Comments)
- **Auth:** OAuth 2.0
- **Rate Limits:** 100 posts/day

#### 1.3 Database Schema

```typescript
// shared/schema.social-media.ts
export const socialMediaPosts = sqliteTable('social_media_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'), // Optional - Link zu Immobilie
  
  // Content
  title: text('title').notNull(),
  content: text('content').notNull(),
  mediaUrls: text('media_urls', { mode: 'json' }).$type<string[]>(),
  mediaType: text('media_type').$type<'image' | 'video' | 'carousel'>(),
  
  // Platforms
  platforms: text('platforms', { mode: 'json' }).$type<string[]>(),
  platformSpecificContent: text('platform_specific_content', { mode: 'json' }),
  
  // Scheduling
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  status: text('status').$type<'draft' | 'scheduled' | 'published' | 'failed'>(),
  
  // Results
  publishResults: text('publish_results', { mode: 'json' }),
  analytics: text('analytics', { mode: 'json' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const socialMediaAccounts = sqliteTable('social_media_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  platform: text('platform').$type<'facebook' | 'instagram' | 'linkedin' | 'tiktok'>().notNull(),
  
  // Account Info
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type'), // page, profile, business
  
  // Authentication
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
  
  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const socialMediaAnalytics = sqliteTable('social_media_analytics', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  platform: text('platform').notNull(),
  
  // Metrics
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  engagement: integer('engagement').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  clicks: integer('clicks').default(0),
  saves: integer('saves').default(0),
  
  // Metadata
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

#### 1.4 API Endpoints

```typescript
// POST /api/social-media/publish
// Publish content to one or multiple platforms
interface PublishRequest {
  title: string;
  content: string;
  mediaUrls?: string[];
  platforms: ('facebook' | 'instagram' | 'linkedin' | 'tiktok')[];
  scheduledAt?: Date;
  propertyId?: string;
  platformSpecific?: {
    facebook?: { targetType: 'page' | 'group', targetId: string };
    instagram?: { type: 'feed' | 'story' | 'reel' };
    linkedin?: { visibility: 'public' | 'connections' };
    tiktok?: { privacy: 'public' | 'friends' | 'private' };
  };
}

// GET /api/social-media/posts
// List all posts with filtering
// Query params: status, platform, dateFrom, dateTo

// GET /api/social-media/posts/:id
// Get single post details

// PUT /api/social-media/posts/:id
// Update scheduled post

// DELETE /api/social-media/posts/:id
// Delete draft or scheduled post

// GET /api/social-media/accounts
// List connected accounts

// POST /api/social-media/accounts/connect
// OAuth flow initiation

// DELETE /api/social-media/accounts/:id
// Disconnect account

// GET /api/social-media/analytics/:postId
// Get analytics for specific post

// GET /api/social-media/analytics/overview
// Get aggregated analytics
```

---

### 2. Multi-AI Content Generation System

**Modul-ID:** `ai-content-generator`  
**Status:** 🆕 Neu (Erweitert DeepSeek)  
**Priorität:** Hoch

#### 2.1 AI Provider Abstraction Layer

```typescript
// Module Structure
server/services/ai/
├── AIProviderFactory.ts               # Factory Pattern für Provider
├── providers/
│   ├── base/
│   │   └── BaseAIProvider.ts          # Abstract Base Class
│   ├── DeepSeekProvider.ts            # Existing DeepSeek (Primary)
│   ├── OpenAIProvider.ts              # Existing OpenAI (Extended)
│   ├── GoogleAIProvider.ts            # Google Gemini
│   └── QwenProvider.ts                # Alibaba Qwen
├── generators/
│   ├── TextGenerator.ts               # Text Content Generation
│   ├── ImageGenerator.ts              # Image Generation (DALL-E, Midjourney, etc.)
│   └── VideoGenerator.ts              # Video Generation (RunwayML, etc.)
└── cache/
    └── AIResponseCache.ts             # Redis-based caching

client/src/modules/ai-studio/
├── components/
│   ├── AIStudioDashboard.tsx          # Main AI Hub
│   ├── ProviderSelector.tsx           # Choose AI Provider
│   ├── TextGeneratorPanel.tsx         # Text Generation UI
│   ├── ImageGeneratorPanel.tsx        # Image Generation UI
│   ├── VideoGeneratorPanel.tsx        # Video Generation UI
│   └── GenerationHistory.tsx          # Previous Generations
└── hooks/
    ├── useAIProvider.ts               # Provider Management
    └── useContentGeneration.ts        # Generation Hooks
```

#### 2.2 Provider Specifications

**DeepSeek (Primary):**
- **Model:** deepseek-chat
- **Capabilities:** Text generation, property descriptions, market analysis
- **Cost:** ~$0.14 per 1M input tokens
- **Use Cases:** Standard text generation, chat, analysis

**OpenAI GPT-4:**
- **Models:** gpt-4-turbo, gpt-4-vision
- **Capabilities:** Advanced text, image understanding, DALL-E 3 integration
- **Cost:** $10 per 1M input tokens
- **Use Cases:** Complex tasks, image analysis, high-quality generation

**Google Gemini:**
- **Models:** gemini-1.5-pro, gemini-1.5-flash
- **Capabilities:** Multimodal (text, image, video), long context
- **Cost:** $3.50 per 1M input tokens
- **Use Cases:** Multimodal tasks, large documents, video analysis

**Qwen (Alibaba):**
- **Models:** qwen-turbo, qwen-plus, qwen-max
- **Capabilities:** Multilingual, code generation
- **Cost:** ~$0.50 per 1M input tokens
- **Use Cases:** Chinese language, cost-effective alternative

#### 2.3 Generation Types

**Text Generator Features:**
```typescript
interface TextGenerationRequest {
  provider: 'deepseek' | 'openai' | 'google' | 'qwen';
  type: 'property_description' | 'social_post' | 'email' | 'blog_article' | 'custom';
  context?: {
    propertyData?: Property;
    targetPlatform?: string;
    tone?: 'professional' | 'casual' | 'luxury' | 'friendly';
    language?: 'de' | 'en' | 'fr' | 'it';
  };
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}
```

**Image Generator Features:**
```typescript
interface ImageGenerationRequest {
  provider: 'openai' | 'stability' | 'midjourney';
  prompt: string;
  style?: 'realistic' | 'artistic' | 'architectural' | '3d_render';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quantity?: number;
  propertyId?: string; // Link zu Immobilie
}

// Supported Providers:
// - OpenAI DALL-E 3: $0.040 per image (1024x1024)
// - Stability AI: $0.004 per image via API
// - Midjourney: Via Discord Bot (Premium)
```

**Video Generator Features:**
```typescript
interface VideoGenerationRequest {
  provider: 'runway' | 'pika' | 'stable_video';
  type: 'property_tour' | 'slideshow' | 'social_reel' | 'custom';
  input: {
    images?: string[];
    text?: string;
    audio?: string;
  };
  duration?: number; // seconds
  style?: 'cinematic' | 'modern' | 'minimalist';
  resolution?: '720p' | '1080p' | '4k';
}

// Supported Providers:
// - RunwayML Gen-2: $0.05 per second
// - Pika Labs: Via API (Beta)
// - Stable Video Diffusion: Open Source
```

#### 2.4 Database Schema

```typescript
// shared/schema.ai-generation.ts
export const aiGenerations = sqliteTable('ai_generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  
  // Provider & Type
  provider: text('provider').$type<'deepseek' | 'openai' | 'google' | 'qwen'>().notNull(),
  generationType: text('generation_type').$type<'text' | 'image' | 'video'>().notNull(),
  
  // Input
  prompt: text('prompt').notNull(),
  context: text('context', { mode: 'json' }),
  parameters: text('parameters', { mode: 'json' }),
  
  // Output
  result: text('result', { mode: 'json' }),
  resultUrls: text('result_urls', { mode: 'json' }).$type<string[]>(),
  
  // Metadata
  status: text('status').$type<'pending' | 'generating' | 'completed' | 'failed'>().notNull(),
  errorMessage: text('error_message'),
  tokensUsed: integer('tokens_used'),
  costUSD: real('cost_usd'),
  generationTime: integer('generation_time'), // milliseconds
  
  // Relations
  propertyId: text('property_id'),
  socialMediaPostId: text('social_media_post_id'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const aiProviderSettings = sqliteTable('ai_provider_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(),
  
  // Configuration
  apiKey: text('api_key'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  defaultSettings: text('default_settings', { mode: 'json' }),
  
  // Usage Tracking
  totalGenerations: integer('total_generations').default(0),
  totalCostUSD: real('total_cost_usd').default(0),
  monthlyBudgetUSD: real('monthly_budget_usd'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

#### 2.5 API Endpoints

```typescript
// POST /api/ai/generate/text
// Generate text content

// POST /api/ai/generate/image
// Generate images

// POST /api/ai/generate/video
// Generate video content

// GET /api/ai/generations
// List generation history

// GET /api/ai/generations/:id
// Get specific generation

// GET /api/ai/providers
// List available providers

// POST /api/ai/providers/:provider/configure
// Configure provider settings

// GET /api/ai/usage
// Get usage statistics and costs
```

---

### 3. 3D Architecture Generator

**Modul-ID:** `3d-architecture`  
**Status:** 🆕 Neu  
**Priorität:** Mittel

#### 3.1 Module Overview

```typescript
// Module Structure
client/src/modules/3d-architecture/
├── components/
│   ├── ThreeDViewer.tsx               # Three.js Viewer
│   ├── FloorPlanEditor.tsx            # 2D Floor Plan Editor
│   ├── ThreeDGeneratorPanel.tsx       # Generation Interface
│   └── ModelLibrary.tsx               # Pre-built Models
├── lib/
│   ├── threeJsUtils.ts                # Three.js helpers
│   ├── gltfLoader.ts                  # 3D Model Loading
│   └── floorPlanParser.ts             # Convert 2D to 3D
└── hooks/
    └── useThreeDGeneration.ts

server/services/3d-generation/
├── ThreeDGeneratorService.ts          # Core Service
├── engines/
│   ├── BlenderAPIAdapter.ts           # Blender Python API
│   └── ThreeJSGenerator.ts            # Browser-based generation
└── processors/
    └── FloorPlanProcessor.ts          # Process floor plan images
```

#### 3.2 Features

**Input Methods:**
1. **Grundriss-Upload** - PDF/PNG Grundriss → 3D Modell
2. **Parametrische Eingabe** - Raum-Dimensionen → Automatische Generierung
3. **AI-Generierung** - Text Beschreibung → 3D Architektur
4. **Template Bibliothek** - Vorgefertigte Modelle anpassen

**Technologies:**
- **Three.js** - Browser-based 3D rendering
- **Blender API** - Server-side complex modeling
- **OpenCV** - Image processing für Grundrisse
- **Stable Diffusion 3D** - AI-based generation

**Output Formats:**
- **GLTF/GLB** - Web-optimized 3D models
- **FBX** - Industry standard
- **OBJ** - Universal format
- **Interactive Viewer** - Embedded in property pages

#### 3.3 Database Schema

```typescript
// shared/schema.3d-models.ts
export const threeDModels = sqliteTable('3d_models', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'),
  
  // Model Info
  name: text('name').notNull(),
  description: text('description'),
  modelType: text('model_type').$type<'floor_plan' | 'exterior' | 'interior' | 'full_building'>(),
  
  // Files
  sourceFile: text('source_file'), // Original input
  modelUrl: text('model_url').notNull(), // GLB/GLTF URL
  thumbnailUrl: text('thumbnail_url'),
  alternateFormats: text('alternate_formats', { mode: 'json' }), // FBX, OBJ, etc.
  
  // Metadata
  polyCount: integer('poly_count'),
  fileSize: integer('file_size'), // bytes
  dimensions: text('dimensions', { mode: 'json' }), // {width, height, depth}
  
  // Generation
  generationMethod: text('generation_method').$type<'upload' | 'ai' | 'template' | 'manual'>(),
  generationParams: text('generation_params', { mode: 'json' }),
  
  // Status
  status: text('status').$type<'processing' | 'completed' | 'failed'>().notNull(),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

#### 3.4 API Endpoints

```typescript
// POST /api/3d/generate
// Generate 3D model from input

// POST /api/3d/upload
// Upload and process floor plan

// GET /api/3d/models
// List 3D models

// GET /api/3d/models/:id
// Get specific model

// GET /api/3d/templates
// List template library

// POST /api/3d/models/:id/export
// Export in different format
```

---

### 4. Project Management Integration (OptimAizeFlow)

**Modul-ID:** `project-management`  
**Status:** 🆕 Integration  
**Priorität:** Mittel

#### 4.1 Integration Approach

```typescript
// Module Structure
client/src/modules/project-management/
├── components/
│   ├── ProjectDashboard.tsx           # Kanban Board
│   ├── TaskManager.tsx                # Task Management
│   ├── GanttChart.tsx                 # Timeline Visualization
│   └── TeamCollaboration.tsx          # Team Features
└── hooks/
    └── useProjectManagement.ts

server/services/project-management/
├── ProjectManagementService.ts        # Core Service
├── integrations/
│   └── OptimAizeFlowAdapter.ts        # External repo integration
└── workflow/
    └── WorkflowEngine.ts              # Custom workflow logic
```

#### 4.2 Features

**Core Features:**
- **Task Management** - Create, assign, track tasks
- **Kanban Boards** - Visual workflow management
- **Gantt Charts** - Project timeline visualization
- **Team Collaboration** - Comments, mentions, file sharing
- **Automation** - Workflow automation rules
- **Integration** - Sync with existing CRM system

**Property-Specific Workflows:**
1. **Akquisitions-Workflow** - Lead → Viewing → Offer → Contract
2. **Marketing-Workflow** - Photos → Description → Listings → Social Media
3. **Documentation-Workflow** - Document collection → Verification → Storage
4. **Transaction-Workflow** - Negotiation → Notary → Handover

#### 4.3 Database Schema

```typescript
// shared/schema.projects.ts
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'), // Optional link to property
  
  // Project Info
  name: text('name').notNull(),
  description: text('description'),
  projectType: text('project_type').$type<'acquisition' | 'marketing' | 'transaction' | 'custom'>(),
  
  // Timeline
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  status: text('status').$type<'planning' | 'active' | 'completed' | 'on_hold'>().notNull(),
  
  // Team
  ownerId: text('owner_id').notNull(),
  teamMembers: text('team_members', { mode: 'json' }).$type<string[]>(),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projectTasks = sqliteTable('project_tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  
  // Task Info
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').$type<'low' | 'medium' | 'high' | 'urgent'>().notNull(),
  status: text('status').$type<'todo' | 'in_progress' | 'review' | 'done'>().notNull(),
  
  // Assignment
  assignedTo: text('assigned_to'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  
  // Relationships
  parentTaskId: text('parent_task_id'), // For subtasks
  dependencies: text('dependencies', { mode: 'json' }).$type<string[]>(),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});
```

---

### 5. Erweiterte Makler-Features

**Modul-ID:** `broker-tools`  
**Status:** 🔄 Erweiterung bestehender Features  
**Priorität:** Hoch

#### 5.1 Zusätzliche Features

**Dokumenten-Management:**
```typescript
// Features:
- Digitale Dokumentenmappe pro Immobilie
- OCR für gescannte Dokumente
- Automatische Kategorisierung
- E-Signatur Integration
- Versionsverwaltung
- Ablaufdatum-Tracking (z.B. Energieausweis)
```

**Finanzrechner:**
```typescript
// Features:
- Finanzierungsrechner mit Zins-Vergleich
- Amortisationsrechner
- Nebenkosten-Kalkulator
- ROI-Rechner für Investoren
- Steuer-Abschätzung
- PDF-Export für Kunden
```

**Lead-Scoring & Qualifizierung:**
```typescript
// Features:
- Automatisches Lead-Scoring (1-100 Punkte)
- Kaufkraft-Einschätzung
- Interesse-Tracking (Page Views, Time on Site)
- Email-Engagement-Score
- Prognose: Abschluss-Wahrscheinlichkeit
- Automatische Segmentierung
```

**Marktanalyse-Tools:**
```typescript
// Features:
- Vergleichsobjekte-Suche
- Preisentwicklung-Charts (Bodensee Region)
- Nachfrage-Heatmap
- Konkurrenz-Monitoring
- Marktberichte-Generator
- Export für Exposés
```

**Besichtigungs-Management:**
```typescript
// Features:
- Kalender-Integration (bestehend, erweitern)
- Automatische Reminder (Email/SMS)
- Check-in System (QR-Code)
- Feedback-Formular nach Besichtigung
- Route-Planung für mehrere Termine
- Besuchsstatistiken
```

**Multi-Tenant System (Enterprise):**
```typescript
// Features für Makler-Netzwerke:
- Mandanten-Verwaltung
- Unterkonten für Team-Mitglieder
- Rechte-Management (Role-based)
- White-Label Option
- Zentrale Verwaltung
- Separate Datenbanken oder Row-Level-Security
```

#### 5.2 Database Schema Additions

```typescript
// shared/schema.broker-tools.ts
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  propertyId: text('property_id'),
  leadId: text('lead_id'),
  
  // Document Info
  name: text('name').notNull(),
  category: text('category').$type<'contract' | 'energy_cert' | 'floor_plan' | 'photos' | 'other'>(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  
  // Metadata
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  
  // OCR
  ocrText: text('ocr_text'),
  ocrProcessed: integer('ocr_processed', { mode: 'boolean' }).default(false),
  
  // Timestamps
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leadScores = sqliteTable('lead_scores', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  
  // Scoring
  totalScore: integer('total_score').notNull().default(0), // 0-100
  engagementScore: integer('engagement_score').notNull().default(0),
  qualificationScore: integer('qualification_score').notNull().default(0),
  closeProbability: real('close_probability').notNull().default(0), // 0.0-1.0
  
  // Factors
  scoringFactors: text('scoring_factors', { mode: 'json' }),
  
  // Timestamps
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const marketAnalyses = sqliteTable('market_analyses', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  
  // Analysis Data
  comparableProperties: text('comparable_properties', { mode: 'json' }),
  priceRecommendation: integer('price_recommendation'),
  marketTrend: text('market_trend').$type<'rising' | 'stable' | 'falling'>(),
  demandLevel: text('demand_level').$type<'low' | 'medium' | 'high'>(),
  
  // Report
  reportData: text('report_data', { mode: 'json' }),
  reportPdfUrl: text('report_pdf_url'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  
  // Configuration
  subdomain: text('subdomain').unique(),
  customDomain: text('custom_domain'),
  branding: text('branding', { mode: 'json' }),
  
  // Subscription
  plan: text('plan').$type<'free' | 'professional' | 'enterprise'>().notNull(),
  maxUsers: integer('max_users').notNull().default(1),
  maxProperties: integer('max_properties'),
  
  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

---

## 🔧 GitHub Codespaces Configuration

### Konfiguration für Live Development

#### .devcontainer/devcontainer.json

```json
{
  "name": "ImmoXX Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "eamodio.gitlens"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "typescript.tsdk": "node_modules/typescript/lib"
      }
    }
  },
  
  "forwardPorts": [5000, 5173, 5003],
  "portsAttributes": {
    "5000": {
      "label": "Backend API",
      "onAutoForward": "notify"
    },
    "5173": {
      "label": "Vite Dev Server",
      "onAutoForward": "openBrowser"
    },
    "5003": {
      "label": "E2E Test Server",
      "onAutoForward": "silent"
    }
  },
  
  "postCreateCommand": "npm install && npm run db:push",
  "postStartCommand": "npm run dev",
  
  "remoteUser": "node"
}
```

#### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Development Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

#### .vscode/tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Build Production",
      "type": "npm",
      "script": "build",
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "npm",
      "script": "test:e2e",
      "problemMatcher": []
    }
  ]
}
```

---

## 📦 Implementation Roadmap

### Phase 1: Foundation (Woche 1-2)

**Sprint 1.1: Modular Architecture Setup**
- [ ] Erstelle Modul-Loader System
- [ ] Implementiere Dependency Injection
- [ ] Setup Event Bus für Modul-Kommunikation
- [ ] Erstelle Modul-Konfiguration (JSON/YAML)

**Sprint 1.2: GitHub Codespaces**
- [ ] Erstelle `.devcontainer/devcontainer.json`
- [ ] Konfiguriere VS Code Extensions
- [ ] Setup automatische Port-Forwarding
- [ ] Teste Live-Development-Flow

**Sprint 1.3: Database Migrations**
- [ ] Erstelle neue Schema-Dateien für alle Module
- [ ] Schreibe Migrations-Scripts
- [ ] Setup Rollback-Mechanismen
- [ ] Teste mit Sample-Daten

### Phase 2: Social Media Integration (Woche 3-4)

**Sprint 2.1: Core Social Media Service**
- [ ] Implementiere `SocialMediaService.ts`
- [ ] Erstelle Platform Adapter Interface
- [ ] Setup OAuth Flow für alle Plattformen
- [ ] Implementiere Token Management

**Sprint 2.2: Platform Adapters**
- [ ] Facebook Adapter + Tests
- [ ] Instagram Adapter + Tests
- [ ] LinkedIn Adapter + Tests
- [ ] TikTok Adapter + Tests

**Sprint 2.3: Scheduling & Publishing**
- [ ] Implementiere Job Queue (BullMQ)
- [ ] Erstelle Scheduler Service
- [ ] Setup Cron Jobs für geplante Posts
- [ ] Implementiere Retry-Logik

**Sprint 2.4: Frontend Dashboard**
- [ ] Erstelle Social Media Dashboard Component
- [ ] Implementiere Multi-Platform Publisher
- [ ] Erstelle Content Preview für alle Plattformen
- [ ] Implementiere Calendar-View für Schedule

### Phase 3: Multi-AI Content Generation (Woche 5-6)

**Sprint 3.1: AI Provider Abstraction**
- [ ] Erstelle `BaseAIProvider` Abstract Class
- [ ] Implementiere `AIProviderFactory`
- [ ] Setup Provider Configuration System
- [ ] Implementiere Kosten-Tracking

**Sprint 3.2: Provider Implementations**
- [ ] Erweitere DeepSeek Provider
- [ ] Erweitere OpenAI Provider
- [ ] Implementiere Google Gemini Provider
- [ ] Implementiere Qwen Provider

**Sprint 3.3: Content Generators**
- [ ] Text Generator mit Templates
- [ ] Image Generator (DALL-E, Stability AI)
- [ ] Video Generator (RunwayML Integration)
- [ ] Cache Layer für Responses

**Sprint 3.4: AI Studio Frontend**
- [ ] Erstelle AI Studio Dashboard
- [ ] Provider Selector Component
- [ ] Generation Panels (Text/Image/Video)
- [ ] Generation History & Preview

### Phase 4: 3D Architecture Generation (Woche 7-8)

**Sprint 4.1: 3D Viewer Setup**
- [ ] Integriere Three.js
- [ ] Erstelle 3D Viewer Component
- [ ] Implementiere Camera Controls
- [ ] Setup Lighting & Materials

**Sprint 4.2: Floor Plan Processing**
- [ ] PDF/Image Upload
- [ ] OpenCV Integration für Floor Plan Detection
- [ ] 2D zu 3D Konvertierung
- [ ] Parametrische Raum-Generierung

**Sprint 4.3: 3D Model Generation**
- [ ] Blender API Integration
- [ ] Template Library
- [ ] AI-basierte Generierung (Text → 3D)
- [ ] Export Funktionen (GLTF, FBX, OBJ)

**Sprint 4.4: Integration in Property Pages**
- [ ] Embed 3D Viewer in Property Details
- [ ] Erstelle Model Gallery
- [ ] Implementiere Interactive Controls
- [ ] Mobile Optimization

### Phase 5: Project Management (Woche 9-10)

**Sprint 5.1: Core Project Management**
- [ ] Implementiere `ProjectManagementService`
- [ ] Erstelle Task Management System
- [ ] Implementiere Team Assignment
- [ ] Setup Notification System

**Sprint 5.2: Visualization Components**
- [ ] Kanban Board Component
- [ ] Gantt Chart Integration
- [ ] Timeline View
- [ ] Calendar Integration

**Sprint 5.3: OptimAizeFlow Integration**
- [ ] Erstelle Adapter für externes Repo
- [ ] Implementiere Data Sync
- [ ] Setup Webhook für Updates
- [ ] Teste Integration

**Sprint 5.4: Property-Specific Workflows**
- [ ] Akquisitions-Workflow
- [ ] Marketing-Workflow
- [ ] Documentation-Workflow
- [ ] Transaction-Workflow

### Phase 6: Extended Broker Tools (Woche 11-12)

**Sprint 6.1: Document Management**
- [ ] Upload System für Dokumente
- [ ] OCR Integration (Tesseract.js)
- [ ] Automatische Kategorisierung
- [ ] E-Signatur Integration

**Sprint 6.2: Financial Calculators**
- [ ] Finanzierungsrechner
- [ ] ROI-Rechner
- [ ] Nebenkosten-Kalkulator
- [ ] PDF-Export

**Sprint 6.3: Lead Scoring**
- [ ] Scoring Algorithm
- [ ] Tracking System (Page Views, Engagement)
- [ ] Email-Engagement-Tracking
- [ ] Automatische Segmentierung

**Sprint 6.4: Market Analysis Tools**
- [ ] Vergleichsobjekte-Suche
- [ ] Preisentwicklung-Charts
- [ ] Marktberichte-Generator
- [ ] Konkurrenz-Monitoring

### Phase 7: Enterprise Features (Woche 13-14)

**Sprint 7.1: Multi-Tenant System**
- [ ] Tenant Management Service
- [ ] Subdomain Routing
- [ ] Daten-Isolation (Row-Level-Security)
- [ ] White-Label Configuration

**Sprint 7.2: Advanced Access Control**
- [ ] Role-based Access Control (RBAC)
- [ ] Team Management
- [ ] Permission System
- [ ] Audit Logging

**Sprint 7.3: Billing & Subscriptions**
- [ ] Subscription Plans
- [ ] Stripe Integration
- [ ] Usage-based Billing
- [ ] Invoice Generation

**Sprint 7.4: Admin Dashboard**
- [ ] Super-Admin Panel
- [ ] Tenant Overview
- [ ] Usage Analytics
- [ ] System Health Monitoring

### Phase 8: Testing & Deployment (Woche 15-16)

**Sprint 8.1: Comprehensive Testing**
- [ ] Unit Tests für alle Services
- [ ] Integration Tests
- [ ] E2E Tests (Playwright)
- [ ] Performance Tests

**Sprint 8.2: Documentation**
- [ ] API Documentation (OpenAPI/Swagger)
- [ ] User Guides
- [ ] Admin Documentation
- [ ] Developer Documentation

**Sprint 8.3: Production Deployment**
- [ ] Setup Production Environment
- [ ] Configure CI/CD Pipeline
- [ ] Database Migration auf Production
- [ ] Performance Optimization

**Sprint 8.4: Monitoring & Support**
- [ ] Setup Error Tracking (Sentry)
- [ ] Performance Monitoring (Datadog)
- [ ] User Analytics (Posthog)
- [ ] Support System

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Example: AI Provider Tests
describe('AIProviderFactory', () => {
  it('should create correct provider based on type', () => {
    const deepseek = AIProviderFactory.create('deepseek');
    expect(deepseek).toBeInstanceOf(DeepSeekProvider);
  });
  
  it('should handle provider configuration', () => {
    const config = { apiKey: 'test-key', model: 'deepseek-chat' };
    const provider = AIProviderFactory.create('deepseek', config);
    expect(provider.config).toEqual(config);
  });
});

// Example: Social Media Tests
describe('FacebookAdapter', () => {
  it('should publish text post successfully', async () => {
    const adapter = new FacebookAdapter(mockConfig);
    const result = await adapter.publishPost({
      content: 'Test post',
      mediaUrls: []
    });
    expect(result.success).toBe(true);
    expect(result.postId).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Example: End-to-End Social Media Flow
describe('Social Media Publishing Flow', () => {
  it('should publish to multiple platforms', async () => {
    // 1. Generate content with AI
    const aiResult = await generateText({
      provider: 'deepseek',
      type: 'social_post',
      context: { propertyData: mockProperty }
    });
    
    // 2. Generate image
    const imageResult = await generateImage({
      provider: 'openai',
      prompt: aiResult.text
    });
    
    // 3. Publish to platforms
    const publishResult = await publishToSocialMedia({
      content: aiResult.text,
      mediaUrls: [imageResult.url],
      platforms: ['facebook', 'instagram', 'linkedin']
    });
    
    expect(publishResult.facebook.success).toBe(true);
    expect(publishResult.instagram.success).toBe(true);
    expect(publishResult.linkedin.success).toBe(true);
  });
});
```

### E2E Tests (Playwright)

```typescript
// Example: Full User Journey
test('Broker creates property and publishes to social media', async ({ page }) => {
  // 1. Login
  await page.goto('/admin/login');
  await page.fill('[name="email"]', 'broker@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 2. Create property
  await page.goto('/admin/properties/new');
  await page.fill('[name="title"]', 'Luxus Villa am Bodensee');
  await page.fill('[name="price"]', '2500000');
  await page.click('button[type="submit"]');
  
  // 3. Generate AI content
  await page.click('text=AI Content Generator');
  await page.selectOption('[name="provider"]', 'deepseek');
  await page.click('text=Generate Description');
  await page.waitForSelector('.ai-result');
  
  // 4. Publish to social media
  await page.click('text=Publish to Social Media');
  await page.check('[name="platform-facebook"]');
  await page.check('[name="platform-instagram"]');
  await page.click('button:has-text("Publish Now")');
  
  // 5. Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 📊 Performance Considerations

### Caching Strategy

```typescript
// Redis-based caching for AI responses
const cacheKey = `ai:${provider}:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await provider.generate(prompt);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
```

### Database Optimization

```sql
-- Indexes für schnelle Queries
CREATE INDEX idx_social_media_posts_user_status ON social_media_posts(user_id, status);
CREATE INDEX idx_social_media_posts_scheduled ON social_media_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_ai_generations_user_type ON ai_generations(user_id, generation_type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_tasks_assigned ON project_tasks(assigned_to, status);
```

### API Rate Limiting

```typescript
// Per-User Rate Limits
const rateLimits = {
  socialMedia: { maxRequests: 100, windowMs: 3600000 }, // 100/hour
  aiGeneration: { maxRequests: 50, windowMs: 3600000 },  // 50/hour
  threeD: { maxRequests: 10, windowMs: 3600000 },        // 10/hour
};
```

---

## 🔒 Security Considerations

### API Key Management

```typescript
// Verschlüsselung sensibler Daten
import { encrypt, decrypt } from './lib/crypto';

// Store encrypted
await db.insert(socialMediaAccounts).values({
  accessToken: encrypt(token),
  refreshToken: encrypt(refreshToken)
});

// Retrieve decrypted
const account = await db.select().from(socialMediaAccounts).where(...);
const decryptedToken = decrypt(account.accessToken);
```

### OAuth Security

```typescript
// State Parameter für OAuth
const state = nanoid(32);
await redis.setex(`oauth:state:${state}`, 600, userId); // 10 min expiry

// Verify in callback
const storedUserId = await redis.get(`oauth:state:${state}`);
if (!storedUserId) throw new Error('Invalid OAuth state');
```

### Input Validation

```typescript
// Zod Schemas für alle API Inputs
import { z } from 'zod';

const publishPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10),
  platforms: z.array(z.enum(['facebook', 'instagram', 'linkedin', 'tiktok'])),
  scheduledAt: z.date().optional()
});
```

---

## 📚 Documentation Requirements

### API Documentation (OpenAPI)

```yaml
openapi: 3.0.0
info:
  title: ImmoXX API
  version: 2.0.0
  description: Comprehensive Real Estate Platform API

paths:
  /api/social-media/publish:
    post:
      summary: Publish content to social media platforms
      tags: [Social Media]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PublishRequest'
      responses:
        '200':
          description: Successfully published
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublishResponse'
```

### User Documentation

1. **Getting Started Guide** - Erste Schritte für neue Nutzer
2. **Feature Guides** - Detaillierte Anleitungen pro Feature
3. **API Reference** - Vollständige API-Dokumentation
4. **Video Tutorials** - Screencasts für komplexe Workflows
5. **FAQ** - Häufig gestellte Fragen

### Developer Documentation

1. **Architecture Overview** - System-Architektur
2. **Module Development Guide** - Eigene Module entwickeln
3. **API Integration Guide** - Integration in Drittsysteme
4. **Deployment Guide** - Production Deployment
5. **Contributing Guide** - Beiträge zum Projekt

---

## 🚀 Deployment Strategy

### Environment Configuration

```bash
# .env.production
NODE_ENV=production

# Database
DATABASE_URL=file:./database/production.sqlite

# API Keys (per Module)
DEEPSEEK_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_AI_API_KEY=xxx
QWEN_API_KEY=xxx

# Social Media (per Platform)
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
INSTAGRAM_APP_ID=xxx
INSTAGRAM_APP_SECRET=xxx
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx

# 3D Generation
BLENDER_API_URL=http://localhost:8080

# Monitoring
SENTRY_DSN=xxx
DATADOG_API_KEY=xxx

# Feature Flags (Module Activation)
MODULE_SOCIAL_MEDIA=true
MODULE_AI_STUDIO=true
MODULE_3D_GENERATION=true
MODULE_PROJECT_MANAGEMENT=true
MODULE_BROKER_TOOLS=true
MODULE_MULTI_TENANT=false  # Enterprise only
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

# Expose ports
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./database:/app/database
      - ./uploads:/app/uploads
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Kubernetes Deployment (Enterprise)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: immoxx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: immoxx
  template:
    metadata:
      labels:
        app: immoxx
    spec:
      containers:
      - name: immoxx
        image: immoxx:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: immoxx-secrets
              key: database-url
```

---

## 💰 Cost Estimation

### AI Provider Costs (pro 1000 Generationen)

| Provider | Type | Cost | Notes |
|----------|------|------|-------|
| DeepSeek | Text | ~$0.14 | Primary für Standard-Tasks |
| OpenAI GPT-4 | Text | ~$10.00 | Für komplexe Tasks |
| Google Gemini | Text | ~$3.50 | Multimodal Alternative |
| Qwen | Text | ~$0.50 | Budget-Option |
| OpenAI DALL-E 3 | Image | ~$40.00 | 1024x1024 Bilder |
| Stability AI | Image | ~$4.00 | Budget Image Generation |
| RunwayML Gen-2 | Video | ~$50.00 | Per second ($0.05/sec) |

**Empfohlene Monatliche Budget:**
- Small Business: €50-100/Monat (~500 Text, 50 Image, 10 Video)
- Professional: €200-500/Monat (~2000 Text, 200 Image, 50 Video)
- Enterprise: €1000+/Monat (Unlimited mit eigenen API Keys)

### Infrastructure Costs

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| VPS (4 CPU, 8GB RAM) | Hetzner CX31 | €12 |
| Domain & SSL | Cloudflare | €0 (Free) |
| Redis Cache | Redis Cloud | €0 (Free tier) |
| Monitoring | Sentry | €26 (Developer) |
| CDN | Bunny CDN | ~€10 (1TB) |
| Backup Storage | Backblaze B2 | ~€5 (100GB) |
| **Total** | | **~€53/month** |

---

## 📈 Success Metrics (KPIs)

### Business Metrics

- **User Adoption:** % aktive Nutzer der neuen Features
- **Content Generation:** Anzahl generierter Inhalte pro Monat
- **Social Media Reach:** Follower-Wachstum, Impressions
- **Time Saved:** Durchschnittliche Zeitersparnis pro Makler
- **Revenue Impact:** ROI durch erhöhte Verkaufszahlen

### Technical Metrics

- **API Response Time:** < 200ms (p95)
- **Error Rate:** < 1%
- **Uptime:** > 99.5%
- **Cache Hit Rate:** > 80%
- **Test Coverage:** > 80%

---

## 🎯 Next Steps

### Immediate Actions (Diese Woche)

1. ✅ **Dieses Dokument reviewen** und Feedback geben
2. ⏳ **GitHub Codespaces** konfigurieren
3. ⏳ **Development Environment** aufsetzen
4. ⏳ **Sprint 1.1** starten (Modular Architecture)

### Vorbereitung für Entwicklung

1. **API Keys besorgen:**
   - Facebook Developer Account
   - Instagram Business Account
   - LinkedIn Developer Account
   - TikTok for Business
   - Google AI Studio
   - Qwen API Access

2. **Tools installieren:**
   - Docker & Docker Compose
   - Postman/Insomnia für API Testing
   - Redis (lokal oder Cloud)

3. **Dokumentation lesen:**
   - Facebook Graph API Docs
   - Instagram API Docs
   - LinkedIn API Docs
   - TikTok API Docs

---

## 📞 Support & Kontakt

**Projektleitung:** ImmoXX Team  
**Dokumentation:** [docs/](./docs/)  
**Issues:** GitHub Issues  
**Discussions:** GitHub Discussions

---

**Version:** 2.0  
**Last Updated:** 2025-10-07  
**Status:** 🚀 Ready for Implementation
