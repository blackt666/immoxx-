# 🔧 Environment Variables für Vercel

Kopieren Sie diese Werte direkt in das Vercel Dashboard:

## 📋 **Environment Variables (Copy & Paste)**

### Variable 1:
**Name:** `DATABASE_URL`  
**Value:** `file:./database.sqlite`

### Variable 2:
**Name:** `NODE_ENV`  
**Value:** `production`

### Variable 3:
**Name:** `AUTH_ENABLED`  
**Value:** `true`

### Variable 4:
**Name:** `SESSION_SECRET`  
**Value:** `bodensee-immobilien-production-secret-2025-secure`

### Variable 5 (Optional):
**Name:** `DEEPSEEK_API_KEY`  
**Value:** `sk-your-deepseek-api-key-here`

## 🎯 **Wie Sie diese in Vercel eintragen:**

1. **Im Vercel Dashboard** nach dem Import von `blackt666/immoxx-`
2. **Scrollen Sie zu "Environment Variables"**
3. **Klicken Sie "Add"** für jede Variable
4. **Kopieren Sie Name und Value** aus dieser Liste
5. **Klicken Sie "Add"** nach jeder Variable

## ⚠️ **Wichtige Einstellungen:**

### Build Settings:
- **Framework Preset:** `Other`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `./` (leer lassen)

### Deployment Settings:
- **Node.js Version:** `18.x` (empfohlen)
- **Regions:** `All` (für beste Performance)

## 🚀 **Nach dem Deployment:**

Ihre App wird verfügbar sein unter:
- `https://immoxx-blackt666.vercel.app`
- Oder eine ähnliche automatisch generierte URL

## 🧪 **Testen Sie diese URLs:**

```
https://ihre-vercel-url.vercel.app/api/health
https://ihre-vercel-url.vercel.app/admin/login
https://ihre-vercel-url.vercel.app/
```

## 💡 **Tipps:**

1. **Environment Variables** können jederzeit geändert werden
2. **Jede Änderung** löst ein neues Deployment aus
3. **Logs** finden Sie im Vercel Dashboard
4. **Domain** kann später hinzugefügt werden

---

**✅ Bereit für Copy & Paste in Vercel!**