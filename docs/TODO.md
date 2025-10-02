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
- [ ] Add actual timing metrics for calendar sync operations
  - Location: `server/services/calendarSyncService.ts:762`
  - Location: `server/services/googleCalendarService.ts:802`

### Authentication & Notifications
- [ ] Implement notification system for token expiration
  - Location: `server/services/tokenMaintenanceService.ts:169`
  - Send email/webhook notifications for connections requiring re-authentication

- [ ] Implement Apple Calendar token refresh
  - Location: `server/services/tokenMaintenanceService.ts:202`
  - Currently only Google is supported

### Monitoring & Observability
- [ ] Integrate with security monitoring service
  - Location: `server/routes.ts:354`
  - Options: Datadog, New Relic, Sentry
  - Required for production security event tracking

## Medium Priority

### Configuration
- [ ] Make timezone configurable
  - Location: `server/services/googleCalendarService.ts:328`
  - Currently hardcoded to 'Europe/Berlin'

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
