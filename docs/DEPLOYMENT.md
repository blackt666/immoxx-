# ImmoXX Deployment Guide

## Production Deployment

### Build für Production

```bash
# Complete build
npm run build

# Build validation
npm run test:build

# Nur Client
vite build

# Nur Server
npm run check
```

**Note:** The build script automatically installs client dependencies before building. This ensures that all required packages are available during the build process, especially important for CI/CD environments like Vercel.

### Server starten

```bash
# Mit PM2 (empfohlen)
npm run pm2:start

# Manuell
NODE_ENV=production npm start
```

## CI/CD Pipeline

GitHub Actions Pipeline ist konfiguriert (`.github/workflows/ci-cd.yml`):

- **Automatische Tests** bei jedem Push
- **Security Audits**
- **Multi-Node-Version Tests** (18.x, 20.x)
- **Staging Deployment** (develop branch)
- **Production Deployment** (main branch)

### Workflow Triggers

- Push zu `main` oder `develop` → Tests + Deployment
- Pull Request zu `main` → Tests

## Replit Deployment

### 1. Environment Variables setzen

Secrets in Replit hinzufügen:
- `DATABASE_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY` (optional)
- `NOTION_API_KEY` (optional)

### 2. Build & Run Commands

```toml
# .replit oder replit.nix
run = "npm run pm2:start"
```

## Health Checks

```bash
# Health endpoint
curl http://your-domain.com/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-01-02T10:00:00.000Z",
  "port": 5001,
  "host": "0.0.0.0"
}
```

## Performance Monitoring

### PM2 Monitoring

```bash
npm run pm2:status   # CPU, Memory, Uptime
```

### Log Monitoring

```bash
npm run pm2:logs     # Live logs
tail -f logs/app-*.log
tail -f logs/error-*.log
```

## Backup & Restore

```bash
# Database backup
cp database.sqlite database.sqlite.backup

# Logs backup
tar -czf logs-backup.tar.gz logs/
```

## Security

### Production Checklist

- [ ] `NODE_ENV=production` gesetzt
- [ ] `SESSION_SECRET` mit starkem Key
- [ ] `AUTH_ENABLED=true` aktiviert
- [ ] Firewall konfiguriert
- [ ] HTTPS aktiviert
- [ ] Rate Limiting aktiviert
- [ ] Logs werden rotiert

### Environment Variables

```bash
# Sichere Secrets generieren
openssl rand -base64 32  # SESSION_SECRET
```

## Rollback

```bash
# PM2 Rollback
pm2 reload ecosystem.config.json

# Git Rollback
git checkout <previous-commit>
npm run build
npm run pm2:restart
```
