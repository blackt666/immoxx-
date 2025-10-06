# ImmoXX - Feature Roadmap & TODOs

## 🎉 Recently Completed (2025-10-02)

### DeepSeek AI Integration ✅
- [x] DeepSeek API Service implementiert
- [x] API Routes erstellt (`/api/deepseek/*`)
- [x] Frontend Hooks (`useDeepSeek.ts`)
- [x] React Component (`PropertyValuationAI.tsx`)
- [x] Automated Tests (`test-deepseek.js`)
- [x] Vollständige Dokumentation ([DEEPSEEK-INTEGRATION.md](DEEPSEEK-INTEGRATION.md))

**Features:**
- AI-Immobilienbewertung
- Marktanalyse
- Automatische Beschreibungsgenerierung
- AI-Chat Assistent
- E-Mail-Antwort-Generator

---

## High Priority

### Calendar & Sync Features
- [x] ~~Add actual timing metrics for calendar sync operations~~ ✅ COMPLETED (2025-10-06)
  - Added performance timing to `calendarSyncService.ts`
  - Added duration logging to `googleCalendarService.ts` token refresh
  - All sync operations now report execution time

### Authentication & Notifications
- [x] ~~Implement notification system for token expiration~~ ✅ ALREADY IMPLEMENTED
  - System already in place via `notificationService.ts`
  - Token maintenance service sends notifications for expired connections
  - Email and webhook support configured

- [ ] Implement Apple Calendar token refresh
  - Location: `server/services/tokenMaintenanceService.ts:202`
  - Currently only Google is supported
  - Note: Apple uses app-specific passwords which don't expire like OAuth tokens

### Monitoring & Observability
- [ ] Integrate with security monitoring service
  - Location: `server/routes.ts:354`
  - Options: Datadog, New Relic, Sentry
  - Required for production security event tracking

## Medium Priority

### Configuration
- [x] ~~Make timezone configurable~~ ✅ COMPLETED (2025-10-06)
  - Added `CALENDAR_TIMEZONE` environment variable (defaults to 'Europe/Berlin')
  - Applied to all calendar services (Google, Apple, ICS exports)
  - Documented in `.env.example`

### Calendar Features
- [ ] Implement Google Calendar push notifications
  - Location: `server/routes/calendar.ts:804`
  - Webhook handling for real-time updates

## Low Priority

### Testing
- [ ] Increase test coverage for calendar sync
- [ ] Add integration tests for token maintenance

### Performance
- [ ] Optimize calendar sync for large datasets
- [ ] Add caching layer for frequently accessed data

## Documentation
- [ ] API documentation with OpenAPI/Swagger
- [ ] Architecture decision records (ADRs)
- [ ] Deployment playbooks

## Notes
- All TODOs are tracked in code comments
- Use `grep -r "TODO" server/` to find implementation locations
- Priority based on user impact and security considerations
