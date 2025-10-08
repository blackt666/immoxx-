# ⚡ Vercel Quick Fix - Output Directory

## 🚨 Wenn 404-Fehler auf Vercel:

### ✅ Korrekte Einstellung:
```
Output Directory: dist/public
```

### ❌ NICHT verwenden:
```
Output Directory: dist
Output Directory: client/dist
Output Directory: build
```

---

## 📋 Copy & Paste für Vercel Dashboard

### Build Settings:
```
Framework Preset: Other
Root Directory: .
Build Command: npm run build
Output Directory: dist/public
Install Command: npm install
```

### Environment Variables:
```
DATABASE_URL=file:./database.sqlite
NODE_ENV=production
AUTH_ENABLED=true
SESSION_SECRET=bodensee-immobilien-production-secret-2025-secure
```

---

## 🔍 Verifikation nach Deployment

Testen Sie diese URLs:

```
✅ https://ihre-app.vercel.app/
✅ https://ihre-app.vercel.app/properties
✅ https://ihre-app.vercel.app/admin/login
```

Alle sollten **200 OK** zurückgeben, nicht 404!

---

**Wichtig:** Die Output Directory MUSS `dist/public` sein, nicht nur `dist`!
