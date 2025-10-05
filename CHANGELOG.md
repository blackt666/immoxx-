# Changelog - Bodensee Immobilien

## [1.1.0] - 2025-10-05

### ✨ Features

- **CRM-Dashboard**: Erweitert und Testdaten hinzugefügt.
- **CRM-Dashboard**: "Neuer Lead"-Modal-Komponente hinzugefügt.
- **CRM**: `LeadDetailModal`-Komponente für die Lead-Verwaltung hinzugefügt.

### 🐛 Bug Fixes

- **Sicherheit, UI, Funktionalität**: Mehrere Verbesserungen implementiert.
- **Styling & Schema**: Stile und Schemadefinitionen aktualisiert.
- **Schema**: Probleme in der Schema-Definition behoben.

### 🚀 Initial Commit

- **immoxx Real Estate Platform**: Erstes Commit.

---

## [1.0.0] - 2025-10-01

### ✨ Features

- **Bodensee Farbschema** - Professionelle Farbpalette implementiert
  - Ruskin Blue (#566B73) als Primärfarbe
  - Arctic (#65858C) für Akzente
  - Bermuda Sand (#D9CDBF) für warme Töne
  - Sublime (#8C837B) für Details
  - Mushroom (#BFADA3) für Hintergründe

### 🎨 Design Updates

- Footer mit Bodensee-Farben gestylt
- Hero Section Gradient angepasst
- Landing Page Calculator Section redesigned
- Services Section mit neuen Icon-Farben
- Navigation mit verbesserten Hover-Effekten

### 🗄️ Database

- Properties Tabelle erweitert (15+ neue Spalten)
  - currency, size, rooms, city, postal_code
  - region, country, latitude, longitude
  - year_built, has_garden, has_balcony, has_parking
  - energy_rating, heating_type
- Rate Limiting Tabelle erstellt
- Design Settings Tabelle mit Farbkonfiguration

### 🔐 Authentication

- Admin-User erstellt (username: admin)
- Admin-Dashboard funktionsfähig
- Login-System aktiviert

### 🛠️ Technical

- PostCSS Konfiguration korrigiert (ES Module Support)
- Tailwind CSS Integration optimiert
- Vite Dev Middleware konfiguriert
- SQLite Datenbank migriert

### 🐛 Bug Fixes

- PostCSS ES Module Error behoben
- Fehlende Datenbank-Spalten hinzugefügt
- Rate Limiting Fehler eliminiert
- CSS Compilation Probleme gelöst

### 📚 Documentation

- PROJEKT-FERTIGSTELLUNG.md erstellt
- Admin Login-Daten dokumentiert
- Farbsystem-Dokumentation


---

## Installation & Setup

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Admin-Zugang
URL: http://localhost:3000/admin/login
Username: admin
Passwort: admin123
```

## Tech Stack
- React 18 + TypeScript
- Vite 4
- Tailwind CSS 3
- Express + SQLite
- Drizzle ORM
