# 🚀 GitHub Codespaces Deployment Guide

## Übersicht

GitHub Codespaces bietet eine vollständige Entwicklungsumgebung direkt im Browser. Diese Anleitung zeigt, wie Sie die Bodensee Immobilien Plattform in Codespaces ausführen.

## ✨ Vorteile von Codespaces

- ✅ **Keine lokale Installation nötig** - Alles läuft im Browser
- ✅ **Automatische Konfiguration** - Environment wird automatisch eingerichtet
- ✅ **Kostenlos für Personal Accounts** - 60 Stunden/Monat gratis (2-core)
- ✅ **Öffentlich zugänglich** - URLs können geteilt werden
- ✅ **Vollständige IDE** - VS Code im Browser

## 🚀 Quick Start (3 Minuten)

### 1. Repository in Codespace öffnen

1. Gehen Sie zum GitHub Repository: [blackt666/immoxx-final-version](https://github.com/blackt666/immoxx-final-version)
2. Klicken Sie auf den grünen **"Code"** Button
3. Wechseln Sie zum **"Codespaces"** Tab
4. Klicken Sie auf **"Create codespace on main"**

**Alternativ:** Direktlink verwenden:
```
https://codespaces.new/blackt666/immoxx-final-version
```

### 2. Warten auf Setup (1-2 Minuten)

Der Codespace wird automatisch:
- ✅ Node.js 20 installieren
- ✅ Dependencies installieren (`npm install`)
- ✅ SQLite Datenbank erstellen
- ✅ Development Environment vorbereiten

### 3. Server starten

Öffnen Sie das integrierte Terminal (`` Ctrl+` ``) und führen Sie aus:

```bash
npm run dev
```

Der Server startet auf Port 5000. VS Code zeigt automatisch eine Benachrichtigung:
- Klicken Sie auf **"Open in Browser"**
- Oder öffnen Sie die URL aus dem Ports-Panel

### 4. Zugriff auf die Anwendung

Der Codespace erstellt automatisch eine öffentliche URL:
```
https://[codespace-name]-5000.app.github.dev
```

Die URL finden Sie im **Ports-Panel** (unten in VS Code).

## 🔧 Konfiguration

### Environment Variables

Standardmäßig werden folgende Werte gesetzt (via `.devcontainer/devcontainer.json`):

```env
NODE_ENV=development
PORT=5001
HOST=0.0.0.0
DATABASE_URL=file:./database.sqlite
AUTH_ENABLED=false
```

### Custom Environment Variables hinzufügen

1. Erstellen Sie eine `.env` Datei im Root:
```bash
cp .env.example .env
```

2. Bearbeiten Sie die `.env` Datei mit Ihren API Keys:
```env
# DeepSeek AI (für AI-Bewertungen)
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_MODEL=deepseek-chat

# Notion CRM Integration (optional)
NOTION_API_KEY=secret_your-notion-key
NOTION_DATABASE_ID=your-database-id

# Session Security
SESSION_SECRET=your-secure-random-string
```

3. Starten Sie den Server neu:
```bash
# Terminal: Ctrl+C zum Stoppen
npm run dev
```

## 📊 Port-Konfiguration

Der Codespace forwarded automatisch diese Ports:

| Port | Service | Zugriff |
|------|---------|---------|
| 5000 | Vite Dev Server (Frontend) | Öffentlich |
| 5001 | Express Backend (API) | Öffentlich |

**Port-Visibility ändern:**
1. Öffnen Sie das **Ports-Panel** (unten in VS Code)
2. Rechtsklick auf Port → **Port Visibility**
3. Wählen Sie: `Public`, `Private`, oder `Private to Organization`

## 🛠️ Nützliche Befehle

### Development
```bash
# Server starten
npm run dev

# Build für Production
npm run build

# Tests ausführen
npm run test
npm run test:e2e
```

### Database Management
```bash
# Schema pushen
npm run db:push

# SQLite Datenbank prüfen
sqlite3 database.sqlite "SELECT * FROM properties;"
```

### PM2 Process Management
```bash
# Mit PM2 starten (Production-like)
npm run pm2:start

# Status prüfen
npm run pm2:status

# Logs anzeigen
npm run pm2:logs

# Stoppen
npm run pm2:stop
```

## 🔒 Sicherheit

### Öffentliche URLs

**⚠️ Wichtig:** Codespace-URLs sind standardmäßig **öffentlich zugänglich**.

**Für Production-Daten:**
1. Setzen Sie Ports auf **Private**
2. Aktivieren Sie Authentication:
```env
AUTH_ENABLED=true
SESSION_SECRET=strong-random-key
```

### Secrets verwalten

**Für sensible Daten (API Keys):**

1. Verwenden Sie GitHub Codespace Secrets:
   - Gehen Sie zu: `Settings` → `Codespaces` → `Secrets`
   - Fügen Sie Secrets hinzu (z.B. `DEEPSEEK_API_KEY`)

2. Secrets werden automatisch als Environment Variables verfügbar

3. Erstellen Sie `.env` nicht im Repository (steht bereits in `.gitignore`)

## 🌐 URLs teilen

### Öffentlicher Zugriff

URLs können direkt geteilt werden:
```
https://[codespace-name]-5000.app.github.dev
```

**Hinweis:** URLs ändern sich bei jedem neuen Codespace!

### Permanente URLs

Für permanente URLs verwenden Sie:
- **Vercel** (empfohlen für Production)
- **Railway** (mit PostgreSQL)
- **Replit** (mit .replit config bereits vorhanden)

Siehe: [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md)

## 📱 Mobile Testing

Codespace URLs sind öffentlich zugänglich:
- Öffnen Sie die URL auf Ihrem Smartphone
- Testen Sie die responsive Design-Features
- Verwenden Sie Browser DevTools für verschiedene Viewports

## 🐛 Troubleshooting

### Server startet nicht

```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Port-Konflikte prüfen
lsof -ti:5000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
```

### Port nicht erreichbar

1. Prüfen Sie das **Ports-Panel**
2. Stellen Sie sicher, dass Port auf **Public** steht
3. Klicken Sie auf das Globus-Icon neben dem Port

### Build-Fehler

```bash
# TypeScript Check
npm run check

# Cache löschen
rm -rf dist client/dist .vite

# Neu bauen
npm run build
```

### Database-Fehler

```bash
# Datenbank zurücksetzen
rm database.sqlite

# Server neu starten (erstellt neue DB)
npm run dev
```

## 💰 Kosten & Limits

### Free Tier (Personal)
- ✅ **60 Stunden/Monat** für 2-core machines
- ✅ **15 GB Speicher** pro Codespace
- ✅ **Unlimited Codespaces** (aber max 2 aktiv)

### Pro Accounts
- 90 Stunden/Monat (2-core)
- 20 GB Speicher

**Tipps zum Sparen:**
- ⏱️ **Stoppen Sie Codespaces** wenn nicht in Verwendung
- 🗑️ **Löschen Sie alte Codespaces** regelmäßig
- ⚙️ **Verwenden Sie 2-core machines** (ausreichend für Development)

## 🔄 Codespace Management

### Stoppen
```bash
# Via UI: Codespaces → ⋯ → Stop codespace
# Automatisch nach 30 Minuten Inaktivität
```

### Löschen
```bash
# Via UI: Codespaces → ⋯ → Delete codespace
# Empfehlung: Alte Codespaces regelmäßig löschen
```

### Rebuild
```bash
# Bei .devcontainer-Änderungen
# Command Palette (F1) → "Rebuild Container"
```

## 🎯 Production Deployment

**⚠️ Codespaces sind NUR für Development gedacht!**

Für Production verwenden Sie:
1. **Vercel** - [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)
2. **Railway** - [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md)
3. **Replit** - `.replit` config bereits vorhanden

## 📚 Weiterführende Dokumentation

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Project Structure](./docs/PROJECT-STRUCTURE.md)
- [Setup Guide](./docs/SETUP.md)
- [Deployment Options](./DEPLOYMENT-OPTIONS.md)

## 🆘 Support

Bei Problemen:
1. Prüfen Sie die [Troubleshooting-Sektion](#-troubleshooting)
2. Erstellen Sie ein [GitHub Issue](https://github.com/blackt666/immoxx-final-version/issues)
3. Prüfen Sie die [Logs](#-nützliche-befehle)

---

**Entwickelt für die Bodensee-Region** 🌊
