# 🏠 Bodensee Immobilien Müller

Eine moderne, vollständig responsive Immobilienmakler-Website mit AI-Integration und umfassendem Admin-Dashboard für die Bodensee-Region.

> 📊 **[Aktueller Projekt-Status (IST-STAND)](IST-STAND.md)** - Vollständige Übersicht über Features, Build-Status, Tests und Deployment

## 🚀 Features

### 🎨 Frontend

- **Moderne Landing Page** mit Video-Hero und animierten Sektionen
- **AI-Immobilienbewertung** mit OpenAI GPT-4 Integration
- **360° Virtual Tours** für Immobilien-Präsentation
- **Responsive Design** für alle Geräte
- **Interaktive Rechner** für Immobilienwerte

### 🔧 Admin Dashboard

- **Immobilien-Management** (CRUD Operations)
- **Content-Management-System** für Website-Inhalte
- **Anfragen-Verwaltung** mit Notion-Integration
- **Bildergalerie-Management** mit Upload-Funktionalität
- **System-Diagnose** und Monitoring

### 🤖 AI & Integrationen

- **DeepSeek AI** für intelligente Immobilienbewertungen & Marktanalysen
  - AI-gestützte Immobilienbewertung
  - Automatische Marktanalysen
  - Content-Generierung (Beschreibungen, E-Mails)
  - AI-Chat Assistent
- **Notion API** für CRM-Integration
- **Pannellum.js** für 360° Tours
- **OpenAI GPT-4** (Legacy Support)

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** TanStack React Query
- **Authentication:** Session-based

## 🚀 Quick Start

### Voraussetzungen

- Node.js 18+
- PostgreSQL
- OpenAI API Key (optional, für AI-Bewertungen)
- Notion API Key (optional, für CRM Integration)

### 1. Repository klonen

```bash
git clone https://github.com/[USERNAME]/bodensee-immobilien.git
cd bodensee-immobilien
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine API-Keys hinzu:

```env
# DeepSeek AI (empfohlen)
DEEPSEEK_API_KEY=sk-...  # Für AI-Bewertungen & Analysen

# Optional: Legacy OpenAI
OPENAI_API_KEY=sk-...  # OpenAI GPT-4 (optional)

# CRM Integration
NOTION_API_KEY=secret_...  # Für CRM Integration
NOTION_DATABASE_ID=...  # Notion Datenbank ID

# Session Security
SESSION_SECRET=...  # Generiere mit: openssl rand -base64 32
```

### 4. Datenbank einrichten

```bash
# PostgreSQL Datenbank erstellen
createdb bodensee_immobilien

# Tabellen initialisieren (automatisch beim ersten Start)
npm run dev
```

### 5. Development Server starten

```bash
npm run dev
```

Die Website ist dann unter `http://localhost:5000` erreichbar.

### 6. Admin-Zugang

- URL: `http://localhost:5000/admin/login`
- Standard-Login: admin/admin (in Produktion ändern!)

## 🔧 Production Deployment

### Replit Deployment

1. Importiere das Repository in Replit
2. Setze die Umgebungsvariablen in Replit Secrets
3. Klicke auf "Run"

### Andere Hosting-Provider

```bash
# Build für Production
npm run build

# Production Server starten
npm start
```

## 📁 Projektstruktur

```
├── client/               # React Frontend
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Page Components
│   │   ├── hooks/        # Custom Hooks
│   │   └── lib/          # Utilities
├── server/               # Express Backend
│   ├── routes.ts         # API Routes
│   ├── db.ts            # Database Config
│   └── services/        # External APIs
├── shared/              # Shared TypeScript Types
└── uploads/             # File Storage
```

## 🔗 API Endpoints

### Public Endpoints

- `GET /api/properties` - Immobilien abrufen
- `POST /api/inquiries` - Anfrage senden
- `POST /api/ai-valuation` - AI-Bewertung

### Admin Endpoints (Auth required)

- `POST /api/admin/properties` - Immobilie erstellen
- `GET /api/dashboard/stats` - Dashboard Statistiken
- `POST /api/gallery/upload` - Bild hochladen

## 🎨 Design System

### Farbpalette

- **Primary:** #566B73 (Ruskin Blue)
- **Accent:** #6585BC (Arctic Blue)
- **Secondary:** #D9CDBF (Bermuda Sand)

### Components

Basiert auf shadcn/ui mit custom Bodensee-Branding.

## 🔧 Development

### Scripts

```bash
npm run dev          # Development Server
npm run build        # Production Build
npm run db:generate  # Generate DB Schema
npm run db:push      # Push Schema to DB
```

### Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Component-driven development

## 📱 Mobile Support

Vollständig responsive Design mit:

- Touch-optimierte Navigation
- Mobile-first Approach
- Progressive Web App Features

## 🔐 Security Features

- Session-based Authentication
- Input Validation mit Zod
- SQL Injection Protection
- XSS Protection
- CSRF Protection

## 📊 Performance

- Lazy Loading für Bilder
- Code Splitting
- React Query Caching
- Optimized Bundle Size

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Commit Changes (`git commit -m 'Add amazing feature'`)
4. Push to Branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

Dieses Projekt steht unter der MIT License - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:

- GitHub Issues erstellen
- [Projekt-Status](IST-STAND.md) lesen
- [Dokumentation](docs/PROJECT-STRUCTURE.md) ansehen
- Code Review anfordern

## 🗺️ Roadmap

- [ ] Testing Implementation
- [ ] Docker Support
- [ ] CI/CD Pipeline
- [ ] Advanced Analytics
- [ ] Multi-language Support

---

**Entwickelt für die Bodensee-Region** 🌊
