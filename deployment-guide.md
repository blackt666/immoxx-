# Deployment Guide - Bodensee Immobilien Platform

## 🚀 Quick Start Deployment

### Option 1: Vercel (Empfohlen für MVP)

1. **GitHub Repository vorbereiten:**
```bash
git add .
git commit -m "feat: Ready for deployment"
git push origin main
```

2. **Vercel Setup:**
```bash
npm install -g vercel
vercel
```

3. **Umgebungsvariablen konfigurieren:**
```env
DATABASE_URL=file:./database.sqlite
NODE_ENV=production
AUTH_ENABLED=true
SESSION_SECRET=your-session-secret-here
DEEPSEEK_API_KEY=your-deepseek-key
```

### Option 2: Railway (Full-Stack mit Datenbank)

1. **Railway CLI installieren:**
```bash
npm install -g @railway/cli
railway login
```

2. **Projekt erstellen:**
```bash
railway init
railway add postgresql
railway deploy
```

3. **Environment Variables:**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=${{PORT}}
```

### Option 3: Render

1. **GitHub Repository connecten**
2. **Web Service erstellen:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

3. **PostgreSQL Database hinzufügen**

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [x] TypeScript errors resolved
- [x] ESLint warnings minimized
- [x] Build successful
- [x] Health check working
- [x] Environment variables documented

### 🔧 Configuration Files

#### package.json Scripts optimieren:
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "tsc --project tsconfig.prod.json",
    "postinstall": "npm run build"
  }
}
```

#### Dockerfile (Optional):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
```

## 🌐 Domain & SSL

### Custom Domain Setup:
1. **Vercel:** Automatic SSL, add domain in dashboard
2. **Railway:** Custom domain in project settings
3. **Render:** SSL included, configure in dashboard

## 📊 Monitoring & Analytics

### Health Monitoring:
```javascript
// Add to server/index.ts
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

### Error Tracking:
```bash
# Optional: Add Sentry
npm install @sentry/node
```

## 🗄️ Database Migration

### SQLite → PostgreSQL (für Production):
1. **Export current data:**
```bash
sqlite3 database.sqlite .dump > backup.sql
```

2. **Update schema.ts:**
```typescript
// Use schema.postgres.ts instead of schema.ts
import * as schema from '@shared/schema.postgres';
```

3. **Migration script:**
```bash
npm run db:push
npm run db:migrate
```

## 🔐 Security Checklist

### Environment Variables:
```env
# Required for production
SESSION_SECRET=generate-strong-secret-here
AUTH_ENABLED=true
RATE_LIMIT_ENABLED=true

# Optional but recommended
CORS_ORIGIN=https://yourdomain.com
SECURE_COOKIES=true
```

### Headers & Security:
```typescript
// Add to server/index.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 🧪 Testing in Production

### Health Checks:
```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/status
```

### Load Testing:
```bash
# Install k6 for load testing
brew install k6
k6 run loadtest.js
```

## 📈 Performance Optimization

### Client-Side:
- [x] Code splitting implemented
- [x] Images optimized
- [x] CSS minimized
- [x] Bundle analysis completed

### Server-Side:
- [x] Compression middleware
- [x] Caching headers
- [x] Database indexing
- [x] Error handling

## 🚦 Deployment Commands

### Vercel:
```bash
vercel --prod
```

### Railway:
```bash
railway up
```

### Manual Docker:
```bash
docker build -t bodensee-immobilien .
docker run -p 5001:5001 bodensee-immobilien
```

## 📋 Post-Deployment

1. **Test all critical paths**
2. **Verify database connections**
3. **Check error logging**
4. **Monitor performance**
5. **Setup backup strategy**

---

**🎯 Empfehlung:** Starten Sie mit Vercel für schnelle Tests, migrieren Sie zu Railway für eine vollständige Produktionsumgebung mit Datenbank.