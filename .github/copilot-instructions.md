# Bodensee Immobilien Platform - AI Agent Instructions

## Architecture Overview

This is a **full-stack TypeScript monorepo** for a real estate management platform targeting the Bodensee (Lake Constance) region in Germany. The codebase uses a **hybrid dual-database strategy** (SQLite for dev/current, PostgreSQL for planned migration).

### Key Structure
- **Frontend**: React 18 + Vite + shadcn/ui in `client/` (separate nested package.json)
- **Backend**: Express + TypeScript in `server/`
- **Schema**: Drizzle ORM with **SQLite** (current: `shared/schema.ts`) and PostgreSQL variants (migration-ready: `shared/schema.postgres.ts`)
- **Tests**: Playwright E2E tests in `tests/` with `playwright.config.ts`
- **Build**: Custom `scripts/build.js` - builds client with Vite, then server with TypeScript

## Critical Development Patterns

### 1. Database Access (MUST KNOW)
```typescript
// ALWAYS import from shared/schema.ts (SQLite is current DB)
import * as schema from '@shared/schema';
import { db } from './db.ts'; // Already configured with better-sqlite3
import { eq } from 'drizzle-orm';

// Example: Query properties
const properties = await db.select().from(schema.properties).where(eq(schema.properties.status, 'active'));
```

**DATABASE_URL** in `.env` must be `file:database.sqlite` (SQLite file path, not connection string).

### 2. Authentication System
- **Session-based auth** via `express-session` with in-memory store (memorystore)
- Auth is **FORCE-ENABLED** in production (`server/index.ts` line 37-40)
- Use `requireAuth` middleware from `server/routes.ts` for protected endpoints
- Login endpoint: `POST /api/admin/login` (see `server/routes.ts` line ~80)
- Session stored in `req.session.user` (not `req.session.userId`)

### 3. API Route Structure
All backend routes registered in `server/routes.ts` (~2570 lines - main router file):
- **Modular routers**: DeepSeek AI (`/api/deepseek`), CRM (`/api/crm`), Calendar (`/api/calendar`), Import (`/api/import`)
- **Legacy inline routes**: Properties, inquiries, gallery uploads (defined directly in routes.ts)
- **Health check**: `/api/health` mounted EARLY in `server/index.ts` (line ~98) for test compatibility

### 4. File Uploads
```typescript
// Use pre-configured multer instances from server/lib/multer-config.ts
import { imageUpload, importUpload, backupUpload } from './lib/multer-config.js';

// Example: Image upload endpoint
app.post('/api/gallery/upload', requireAuth, imageUpload.array('images'), async (req, res) => {
  // Files in uploads/ directory, accessible via req.files
});
```
Uploads go to `uploads/` directory at project root.

### 5. AI Integration (DeepSeek Primary)
- **DeepSeek AI** is the PRIMARY AI service (`server/services/deepseekService.ts`)
- Configure in `.env`: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL=deepseek-chat`
- OpenAI is legacy (`server/openaiService.ts`) - prefer DeepSeek for new features
- Frontend hook: `client/src/hooks/useDeepSeek.ts`
- AI valuation page: `client/src/pages/ai-valuation.tsx`

### 6. Logging System
```typescript
// Use Winston logger from server/lib/logger.ts
import { log, logger } from './lib/logger.js';

log.info('Message'); // Info level
log.error('Error message', { metadata }); // Error with context
```
Logs rotate daily in `logs/` directory (app-YYYY-MM-DD.log, error-YYYY-MM-DD.log).

## Build & Test Workflows

### Development
```bash
npm run dev          # Starts dev server on :5000 (Vite proxy to Express)
```
Vite dev server (`client/`) proxies `/api` requests to Express backend.

### Production Build
```bash
npm run build        # Runs scripts/build.js
npm start            # NODE_ENV=production node dist/index.js
```
Build outputs: `dist/public/` (client), `dist/server/` (optional compiled JS, uses tsx fallback).

### Testing
```bash
npm run test         # Quick validation (test-quick-validation.js)
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Full test suite (./run-tests.sh)
```
E2E tests expect server at `http://localhost:5003` (see `playwright.config.ts`). Tests wait for `/api/health` readiness.

### PM2 Process Management
```bash
npm run pm2:start    # Start with PM2 (ecosystem.config.json)
npm run pm2:logs     # View logs
npm run pm2:stop     # Stop server
```
PM2 config in `ecosystem.config.json` - used for production deployments.

## Component & Styling Conventions

### UI Components
- **shadcn/ui** components in `client/src/components/ui/`
- Configure via `components.json` at root
- Custom theme: `client/tailwind.config.ts` with brand colors:
  - Primary: `#566B73` (Ruskin Blue)
  - Accent: `#6585BC` (Arctic Blue)
  - Secondary: `#D9CDBF` (Bermuda Sand)

### Path Aliases (Vite)
```typescript
import { Button } from '@/components/ui/button';  // client/src/components/ui/button
import * as schema from '@shared/schema';         // shared/schema.ts
import logo from '@assets/logo.png';              // attached_assets/logo.png
```

### React Query (TanStack)
```typescript
// Use query client from client/src/lib/queryClient.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi, apiRequest } from '@/lib/queryClient';

// Example: Fetch properties
const { data: properties } = useQuery({
  queryKey: ['/api/properties'],
  queryFn: () => fetchApi<Property[]>('/api/properties')
});
```
Custom `fetchApi` and `apiRequest` utilities handle auth, timeouts (8s), and error types.

## Project-Specific Gotchas

1. **Dual Schema Reality**: `schema.ts` (SQLite) is ACTIVE, `schema.postgres.ts` exists but unused. Always import from `schema.ts`.

2. **Auth in Tests**: Authentication disabled in dev (`AUTH_ENABLED=true` in .env to test), forced in production. Tests may need to mock `req.session.user`.

3. **Rate Limiting**: Login endpoints use DB-backed rate limiting (`server/services/rateLimitingService.ts`). Service cleans up expired records automatically.

4. **German Localization**: Primary language is German. UI text, error messages, and content are in German. Use `client/src/contexts/LanguageContext.tsx` for i18n.

5. **Mobile-First Design**: All components must be mobile-responsive. Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). See `client/src/components/landing/navigation.tsx` for mobile menu patterns.

6. **tel: & mailto: Links**: Phone numbers and emails MUST use clickable links (`<a href="tel:+491608066630">`). See implementation in `client/src/components/landing/footer.tsx` and `navigation.tsx`.

7. **Virtual Tours**: Pannellum.js integration for 360° property tours. Images marked with `imageType='360'` in `galleryImages` table.

8. **Notion CRM Integration**: Inquiries sync to Notion via `server/notionService.ts`. Configure `NOTION_API_KEY` and `NOTION_DATABASE_ID` in `.env`.

9. **Google Calendar Sync**: Calendar appointments managed via `server/services/googleCalendarService.ts` with token refresh in `server/services/tokenMaintenanceService.ts`.

## When Adding New Features

1. **API Endpoints**: Add modular routers in `server/routes/` OR append to `server/routes.ts` for simple CRUD
2. **Database Changes**: Update `shared/schema.ts`, then run `npm run db:push` (Drizzle Kit)
3. **Frontend Pages**: Add to `client/src/pages/`, register route in `client/src/App.tsx`
4. **Tests**: Create Playwright spec in `tests/`, follow existing patterns (e.g., `tests/admin-login.spec.ts`)
5. **Documentation**: Update `docs/PROJECT-STRUCTURE.md` for architecture changes

## References
- Project structure: `docs/PROJECT-STRUCTURE.md`
- Implementation history: `docs/IMPLEMENTATION-SUMMARY.md`
- Setup guide: `docs/SETUP.md`
- E2E test report: `docs/E2E-TEST-REPORT.md`
