# 🔧 Environment Variables für Vercel

Kopieren Sie diese Werte direkt in das Vercel Dashboard:

## 📋 **Environment Variables (Copy & Paste)**

### Variable 1:
**Name:** `DATABASE_URL`  
**Value:** `file:./database.sqlite`

**Hinweis:** SQLite in Vercel ist ephemeral (Daten werden bei jedem Deployment zurückgesetzt). Für Production sollten Sie eine persistente Datenbank wie PostgreSQL verwenden.

### Variable 2:
**Name:** `NODE_ENV`  
**Value:** `production`

### Variable 3:
**Name:** `AUTH_ENABLED`  
**Value:** `true`

### Variable 4 (WICHTIG):
**Name:** `SESSION_SECRET`  
**Value:** `IHR_SICHERER_ZUFÄLLIGER_STRING_MINDESTENS_32_ZEICHEN`

**⚠️ SICHERHEITSWARNUNG:** 
- NIEMALS den Beispiel-Wert verwenden!
- Generieren Sie einen zufälligen, sicheren String mit mindestens 32 Zeichen
- Beispiel-Generator: `openssl rand -base64 32` (in Terminal ausführen)
- Oder verwenden Sie einen Online-Generator: https://www.random.org/strings/

### Variable 5 (Optional):
**Name:** `DEEPSEEK_API_KEY`  
**Value:** `sk-your-deepseek-api-key-here`

**Hinweis:** Nur erforderlich, wenn Sie die AI-Bewertungsfunktion nutzen möchten. Erhalten Sie einen API-Key von [DeepSeek](https://platform.deepseek.com/).

## 🎯 **Wie Sie diese in Vercel eintragen:**

1. **Im Vercel Dashboard** nach dem Import von `blackt666/immoxx-final-version`
2. **Scrollen Sie zu "Environment Variables"**
3. **Klicken Sie "Add"** für jede Variable
4. **Kopieren Sie Name und Value** aus dieser Liste
5. **Wählen Sie "All Environments"** (Production, Preview, Development)
6. **Klicken Sie "Save"** nach jeder Variable

## ⚠️ **Wichtige Einstellungen:**

### Build Settings:
- **Framework Preset:** `Other`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `./` (leer lassen)
- **Node.js Version:** `18.x` (wird automatisch erkannt)

### Deployment Settings:
- **Node.js Version:** `18.x` oder höher
- **Regions:** `All` (für beste Performance weltweit)
- **Function Region:** `iad1` (US East) - empfohlen für Europa

### Erweiterte Einstellungen (Optional):
- **Include Source Paths:** Standardwerte beibehalten
- **Ignore Build Command:** `false`
- **Auto-assign Custom Domain:** Nach Wunsch aktivieren

## 🚀 **Nach dem Deployment:**

Ihre App wird verfügbar sein unter:
- `https://ihre-app-name.vercel.app`
- Oder eine automatisch generierte URL (wird im Dashboard angezeigt)

## 🧪 **Testen Sie diese URLs:**

```bash
# Health Check (sollte sofort antworten)
curl https://ihre-vercel-url.vercel.app/api/health

# Homepage (kann bei Cold Start 2-5 Sekunden dauern)
curl https://ihre-vercel-url.vercel.app/

# Admin Login (Webseite im Browser öffnen)
https://ihre-vercel-url.vercel.app/admin/login
```

### Erwartete Health Check Response:
```json
{
  "status": "ready",
  "ready": true,
  "timestamp": "2025-01-XX...",
  "environment": "production",
  "service": "bodensee-immobilien",
  "platform": "vercel"
}
```

## 💡 **Tipps:**

### Environment Variables verwalten:
1. **Änderungen** können jederzeit vorgenommen werden
2. **Jede Änderung** triggert automatisch ein Redeploy
3. **Secrets schützen:** Niemals in Git committen!
4. **Backup:** Speichern Sie Ihre Production-Werte sicher (z.B. in 1Password, LastPass)

### Performance optimieren:
1. **Cold Starts reduzieren:** Vercel Pro für schnellere Starts
2. **Keep-Alive:** UptimeRobot oder ähnliche Services verwenden
3. **Edge-Functions:** Für kritische Endpoints (nicht in diesem Setup)

### Debugging:
1. **Logs:** Vercel Dashboard → Deployments → Function Logs
2. **Real-time:** Vercel CLI: `vercel logs`
3. **Local Testing:** `vercel dev` für lokales Serverless-Testing

### Datenbank-Migration (von SQLite zu PostgreSQL):
1. **Vercel Postgres:** Über Dashboard hinzufügen
2. **DATABASE_URL:** Automatisch gesetzt nach Postgres-Integration
3. **Schema Migration:** `npm run db:push` (Drizzle ORM)

## 🔒 **Sicherheits-Checkliste:**

- [ ] `SESSION_SECRET` mit sicherem, zufälligen Wert gesetzt (≥32 Zeichen)
- [ ] Standard-Admin-Passwort nach Deployment geändert
- [ ] `AUTH_ENABLED=true` aktiviert
- [ ] Environment Variables nur in Vercel Dashboard (nicht in Code)
- [ ] HTTPS aktiviert (automatisch durch Vercel)
- [ ] DEEPSEEK_API_KEY sicher gespeichert (wenn verwendet)

## 📚 **Zusätzliche Resourcen:**

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Node.js on Vercel](https://vercel.com/docs/runtimes#official-runtimes/node-js)

---

**✅ Bereit für Copy & Paste in Vercel!**

**Nächster Schritt:** Öffnen Sie [Vercel Dashboard](https://vercel.com/dashboard) und starten Sie das Deployment.