# ImmoXX Setup Guide

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Setup mit PM2 Autostart
./pm2-server.sh setup
```

### 2. Umgebungsvariablen

Erstelle eine `.env` Datei:

```env
NODE_ENV=development
PORT=5001
HOST=0.0.0.0
DATABASE_URL=file:./database.sqlite
SESSION_SECRET=your-secret-key
AUTH_ENABLED=false
OPENAI_API_KEY=your-openai-key (optional)
NOTION_API_KEY=your-notion-key (optional)
```

### 3. Server starten

```bash
# Development
npm run dev

# Production mit PM2
npm run pm2:start
```

## Server Management

### PM2 Commands

```bash
npm run pm2:start    # Server starten
npm run pm2:stop     # Server stoppen
npm run pm2:restart  # Server neustarten
npm run pm2:status   # Status anzeigen
npm run pm2:logs     # Logs anzeigen
```

### Manual Start

```bash
npm run dev          # Development mode
npm run build        # Build für Production
npm start            # Production mode
```

## Testing

```bash
npm test             # Quick validation tests
npm run test:build   # Build validation test
npm run test:e2e     # E2E tests mit Playwright
npm run test:all     # Alle Tests (via run-tests.sh)
```

### Build Testing

The build validation test checks:
- ✅ Build script exists and has correct content
- ✅ Client dependencies are installed before building
- ✅ Build outputs are created correctly

```bash
npm run test:build
```

## Monitoring

```bash
# Server health check
curl http://localhost:5001/api/health

# PM2 monitoring
npm run pm2:status
```

## Logging

Logs werden gespeichert in `./logs/`:
- `app-YYYY-MM-DD.log` - Alle Server-Logs
- `error-YYYY-MM-DD.log` - Nur Fehler
- `exceptions.log` - Unbehandelte Exceptions
- `rejections.log` - Unbehandelte Promise Rejections

## Troubleshooting

### Server startet nicht
```bash
npm run pm2:logs    # Logs prüfen
npm run pm2:restart # Neustart versuchen
```

### Tests schlagen fehl
```bash
npm run pm2:status  # Server-Status prüfen
npm ci              # Dependencies neu installieren
npx playwright install --with-deps
```

### Port bereits belegt
```bash
# Prozess auf Port 5001 finden und beenden
lsof -ti:5001 | xargs kill -9
```
