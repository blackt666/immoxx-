# 🚀 Vercel CLI Deployment (Alternative)

Falls Sie die Vercel CLI verwenden möchten (lokal oder in CI/CD):

## Voraussetzungen:

```bash
# Vercel CLI installieren (falls noch nicht installiert)
npm install -g vercel

# Bei Vercel anmelden
vercel login
```

## Deployment:

### Production Deployment:

```bash
# Im Projekt-Verzeichnis
cd /path/to/immoxx-final-version

# Deploy zu Production
vercel --prod
```

Bei der ersten Verwendung fragt Vercel:
- **Set up and deploy?** → `Y`
- **Which scope?** → Wählen Sie Ihren Account
- **Link to existing project?** → `N` (für neues Projekt)
- **What's your project's name?** → `immoxx-final-version`
- **In which directory is your code located?** → `./` (Enter)

Vercel erkennt automatisch:
- Build Command aus `package.json`: `vercel-build`
- Output Directory: `dist/public`
- Environment Variables müssen Sie im Dashboard setzen

### Preview Deployment (Test):

```bash
# Deploy als Preview (nicht Production)
vercel
```

## Environment Variables setzen (CLI):

```bash
# Einzeln hinzufügen
vercel env add DATABASE_URL production
# Dann Wert eingeben: file:./database.sqlite

vercel env add NODE_ENV production
# Wert: production

vercel env add AUTH_ENABLED production
# Wert: true

vercel env add SESSION_SECRET production
# Wert: bodensee-immobilien-vercel-2025-secure-key-replace-me

vercel env add VERCEL production
# Wert: 1
```

Oder alle auf einmal über Dashboard setzen (empfohlen).

## Nützliche Befehle:

```bash
# Deployment-Status
vercel ls

# Logs anzeigen
vercel logs

# Projekt-Info
vercel inspect

# Environment Variables auflisten
vercel env ls

# Domain hinzufügen
vercel domains add your-domain.com

# Alias setzen
vercel alias set deployment-url.vercel.app your-domain.com

# Deployment entfernen
vercel rm deployment-url
```

## GitHub Integration (empfohlen):

Statt CLI können Sie auch die GitHub Integration verwenden:
1. Gehen Sie zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. "Add New Project" → Repository auswählen
3. Automatisches Deployment bei jedem Push!

**Vorteil:** 
- ✅ Automatisch bei jedem Git Push
- ✅ Preview für Pull Requests
- ✅ Einfaches Rollback
- ✅ Keine lokale CLI nötig

---

**Empfehlung:** Verwenden Sie die GitHub Integration (siehe VERCEL-DEPLOYMENT-ANLEITUNG.md) für einfachstes Deployment!
