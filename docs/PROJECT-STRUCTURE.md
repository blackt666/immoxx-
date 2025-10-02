# ImmoXX - Projekt-Struktur

Letzte Aktualisierung: 2025-10-02

## 📁 Übersicht

```
immoxx/
├── client/                     # React Frontend (Vite + TypeScript)
├── server/                     # Express Backend (TypeScript)
├── shared/                     # Shared Types & Schema
├── tests/                      # E2E & Integration Tests
├── scripts/                    # Build & Utility Scripts
├── docs/                       # Dokumentation
├── uploads/                    # File Uploads
└── .github/workflows/          # CI/CD Pipeline
```

---

## 🎨 Frontend (client/)

```
client/
├── src/
│   ├── components/             # React Components
│   │   ├── ui/                 # shadcn/ui Components
│   │   ├── landing/            # Landing Page Components
│   │   ├── admin/              # Admin Dashboard Components
│   │   └── PropertyValuationAI.tsx  # ⭐ DeepSeek AI Component
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useDeepSeek.ts      # ⭐ DeepSeek AI Hooks
│   │   └── use-toast.ts        # Toast Notifications
│   │
│   ├── pages/                  # Page Components
│   │   ├── LandingPage.tsx     # Public Landing Page
│   │   ├── AdminPage.tsx       # Admin Dashboard
│   │   └── PropertyDetailPage.tsx
│   │
│   ├── lib/                    # Utilities & Helpers
│   │   ├── utils.ts            # General Utilities
│   │   └── queryClient.ts      # React Query Setup
│   │
│   ├── App.tsx                 # Main App Component
│   └── main.tsx                # Entry Point
│
├── public/                     # Static Assets
│   ├── favicon.ico
│   └── robots.txt
│
└── package.json                # Frontend Dependencies
```

### Wichtige Frontend Features:
- **React 18** mit TypeScript
- **Vite** für schnelles Development
- **Tailwind CSS** + shadcn/ui für UI
- **TanStack React Query** für State Management
- **React Router** für Routing
- **DeepSeek AI Integration** für Immobilienbewertung

---

## ⚙️ Backend (server/)

```
server/
├── routes/                     # API Routes
│   ├── deepseek.ts             # ⭐ DeepSeek AI Endpoints
│   ├── calendar.ts             # Calendar Integration
│   ├── crm.ts                  # CRM Funktionen
│   ├── import.ts               # Data Import
│   ├── health.ts               # Health Checks
│   ├── translation.ts          # Translation API
│   └── templates.ts            # Template Downloads
│
├── services/                   # Business Logic Layer
│   ├── deepseekService.ts      # ⭐ DeepSeek AI Service
│   ├── googleCalendarService.ts # Google Calendar
│   ├── appleCalendarService.ts # Apple Calendar
│   ├── calendarSyncService.ts  # Calendar Sync
│   ├── tokenMaintenanceService.ts # Token Management
│   ├── rateLimitingService.ts  # Rate Limiting
│   └── calendarConflictResolver.ts # Conflict Resolution
│
├── lib/                        # Server Utilities
│   ├── crypto.ts               # Encryption & Hashing
│   ├── logger.ts               # Winston Logger
│   ├── multer-config.ts        # File Upload Config
│   ├── performance-monitor.ts  # Performance Tracking
│   └── seo-manager.ts          # SEO Management
│
├── middleware/                 # Express Middleware
│   └── cache.ts                # Caching Middleware
│
├── types/                      # TypeScript Types
│   └── session.ts              # Session Types
│
├── routes.ts                   # Main Routes Registration
├── index.ts                    # Server Entry Point
├── db.ts                       # Database Connection
├── storage.ts                  # File Storage
├── vite.ts                     # Vite Dev Server
├── openaiService.ts            # OpenAI Service (Legacy)
├── translationService.ts       # Translation Service
├── notionService.ts            # Notion Integration
└── calendarService.ts          # Calendar Service Wrapper
```

### Wichtige Backend Features:
- **Express.js** mit TypeScript
- **Drizzle ORM** für PostgreSQL
- **Session-based Auth** mit express-session
- **Winston Logging** mit täglicher Rotation
- **DeepSeek AI Integration**
- **Google & Apple Calendar Sync**
- **Rate Limiting** & Security
- **File Upload** mit Multer

---

## 🔗 Shared (shared/)

```
shared/
├── schema.ts                   # Database Schema (Primary)
├── schema.postgres.ts          # PostgreSQL Schema
└── constants.ts                # Shared Constants
```

### Schema Exports:
- **Properties** - Immobilien
- **Inquiries** - Kundenanfragen
- **Gallery** - Bildergalerie
- **Content** - CMS Content
- **CalendarConnections** - Calendar Integrations
- **Appointments** - Termine
- **Users** - User Management

---

## 🧪 Tests (tests/)

```
tests/
├── admin-login.spec.ts         # Admin Authentication
├── admin-login-simple.spec.ts  # Simple Login Test
├── health.spec.ts              # Health Check Tests
├── translation.spec.ts         # Translation Tests
├── rate-limiting.spec.ts       # Rate Limit Tests
├── crm.test.ts                 # CRM Tests
├── navigation-responsive.spec.ts # Navigation Tests
├── navigation-responsive-api.spec.ts
├── navigation-css-validation.spec.ts
└── content-editor-test.spec.ts # Content Editor Tests
```

### Test Setup:
- **Playwright** für E2E Tests
- **Multi-Node Testing** (18.x, 20.x)
- **CI/CD Integration** via GitHub Actions

---

## 🛠️ Scripts (scripts/)

```
scripts/
└── build.js                    # ⭐ Unified Build Script
```

**Build Script Features:**
- Vite Build für Client
- TypeScript Compilation für Server
- Fallback zu tsx runtime
- Build Verification

---

## 📚 Dokumentation (docs/)

```
docs/
├── SETUP.md                    # Setup & Installation
├── DEPLOYMENT.md               # Deployment Guide
├── DEEPSEEK-INTEGRATION.md     # ⭐ DeepSeek AI Docs
├── TODO.md                     # Feature Roadmap
└── PROJECT-STRUCTURE.md        # Diese Datei
```

---

## 📦 Root-Dateien

### Configuration Files:
```
├── .env.example                # Environment Template
├── .gitignore                  # Git Ignore Rules
├── package.json                # Dependencies & Scripts
├── tsconfig.json               # TypeScript Config
├── tsconfig.prod.json          # Production TS Config
├── vite.config.ts              # Vite Configuration
├── tailwind.config.ts          # Tailwind CSS Config
├── drizzle.config.ts           # Drizzle ORM Config
├── playwright.config.ts        # Playwright Config
├── playwright-validation.config.ts
├── postcss.config.cjs          # PostCSS Config
└── components.json             # shadcn/ui Config
```

### Shell Scripts:
```
├── pm2-server.sh               # PM2 Management
├── run-tests.sh                # Test Runner
└── setup.sh                    # Automated Setup
```

### Test Files:
```
├── test-deepseek.js            # ⭐ DeepSeek API Tests
└── test-quick-validation.js    # Quick Validation
```

### Documentation:
```
├── README.md                   # Main Documentation
├── CHANGELOG.md                # Version History
├── AUTOMATION_COMPLETE.md      # Automation Status
└── AI_AGENT_PROMPT.md          # AI Agent Guide
```

### PM2 & Database:
```
├── ecosystem.config.json       # PM2 Configuration
└── database.sqlite             # SQLite Database (dev)
```

---

## 🌐 CI/CD (.github/)

```
.github/
└── workflows/
    └── ci-cd.yml               # GitHub Actions Workflow
```

**Pipeline Features:**
- Multi-Node Testing (18.x, 20.x)
- TypeScript Check
- API & E2E Tests
- Security Audits
- Automated Deployments

---

## 📁 File Uploads (uploads/)

```
uploads/
├── .gitkeep                    # Keep directory
├── hero-bodensee-sunset.jpg    # Hero Images
├── penthouse-ueberlingen.jpg   # Property Images
└── villa-bodensee-1.jpg        # Sample Images
```

---

## 📊 Statistiken

### Codebase Metriken:
- **Frontend Components**: ~100+ React Components
- **Backend Routes**: 9 Route Files
- **Services**: 8 Business Logic Services
- **Tests**: 15+ Test Files
- **Dokumentation**: 5 MD-Dateien

### Technologie Stack:
- **Frontend**: React 18, TypeScript, Vite, Tailwind
- **Backend**: Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (prod), SQLite (dev)
- **AI**: DeepSeek API
- **Testing**: Playwright
- **Deployment**: PM2, GitHub Actions

---

## 🚀 Wichtige Verzeichnisse

### Development:
- `/client/src` - Frontend Code
- `/server` - Backend Code
- `/tests` - Test Suite

### Configuration:
- `/docs` - Alle Dokumentation
- `/scripts` - Build Scripts
- Root - Config Files

### Runtime:
- `/uploads` - File Uploads
- `/logs` - Server Logs (auto-generated)
- `/dist` - Build Output (auto-generated)

---

## 📝 Namenskonventionen

### Dateien:
- **Components**: PascalCase (`PropertyValuationAI.tsx`)
- **Hooks**: camelCase mit "use" Prefix (`useDeepSeek.ts`)
- **Routes**: kebab-case (`deepseek.ts`)
- **Services**: camelCase mit "Service" Suffix (`deepseekService.ts`)
- **Tests**: kebab-case mit `.spec.ts` oder `.test.ts`

### Verzeichnisse:
- Alle lowercase
- Plural für Collections (`components/`, `services/`)
- Singular für Single Purpose (`lib/`, `middleware/`)

---

## 🔄 Aktualisierungen

### Letzte Änderungen (2025-10-02):
- ✅ DeepSeek AI Integration hinzugefügt
- ✅ Projekt-Struktur bereinigt (16 obsolete Dateien entfernt)
- ✅ `/docs` Verzeichnis organisiert
- ✅ `/scripts` konsolidiert (26 → 1 Build-Script)
- ✅ Tests bereinigt (5 obsolete Tests entfernt)
- ✅ Bilder nach `/uploads` verschoben

---

## 📖 Weitere Dokumentation

- **Setup**: [docs/SETUP.md](SETUP.md)
- **Deployment**: [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- **DeepSeek**: [docs/DEEPSEEK-INTEGRATION.md](DEEPSEEK-INTEGRATION.md)
- **TODOs**: [docs/TODO.md](TODO.md)

---

**Maintainer**: ImmoXX Team
**Last Updated**: 2025-10-02
