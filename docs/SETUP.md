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
```

**Development Server Ports:**
- Frontend (Vite): http://localhost:5000
- Backend (Express): http://localhost:5001
- Vite proxied automatisch `/api` requests zum Backend

```bash
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
npm run test:e2e     # E2E tests mit Playwright
npm run test:all     # Alle Tests (via run-tests.sh)
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

### Port Conflicts / "Address already in use"
```bash
# Check which process is using a port
lsof -ti:5000  # Check Vite port
lsof -ti:5001  # Check Backend port

# Kill process on specific port
lsof -ti:5001 | xargs kill -9
```

**Port Configuration:**
- Development mode uses TWO separate ports:
  - Port 5000: Vite dev server (Frontend)
  - Port 5001: Express backend (API)
- Vite automatically proxies `/api/*` requests to backend
- In production, only one port is needed (backend serves static files)

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
