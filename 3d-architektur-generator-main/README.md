# 🏗️ 3D Architektur Generator

Ein browserbasierter 3D-Architektur-Generator, der Gebäude-Blueprints in interaktive 3D-Modelle mit Räumen, Wänden und virtuellen Touren konvertiert.

![3D Architektur Generator](https://github.com/user-attachments/assets/691be49f-8182-4412-b8c0-6a316985175d)

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [Projektstruktur](#projektstruktur)
- [Komponenten](#komponenten)
- [Services](#services)
- [Export-Formate](#export-formate)
- [E2E-Tests](#e2e-tests)
- [Entwicklung](#entwicklung)
- [Lizenz](#lizenz)

## 🎯 Überblick

Der 3D Architektur Generator ist eine fortschrittliche Web-Anwendung, die 2D-Architekturpläne automatisch in vollständige 3D-Modelle umwandelt. Die Anwendung nutzt KI-gestützte Analyseverfahren zur Erkennung von architektonischen Elementen und generiert daraus navigierbare 3D-Umgebungen.

### Hauptmerkmale

- **Automatische Blueprint-Analyse**: KI-gestützte Erkennung von Wänden, Räumen, Türen und Fenstern
- **3D-Modell-Generierung**: Erstellung realistischer Gebäudegeometrie mit konfigurierbaren Parametern
- **Interaktiver 3D-Editor**: Bearbeitung von Elementen direkt in der 3D-Ansicht mit Echtzeit-Updates
- **Virtuelle Raumtouren**: Automatische Kamera-Waypoints für geführte Gebäudetouren
- **Multi-Format-Export**: Export in OBJ, STL, PLY, GLTF sowie Blender- und FreeCAD-Skripte

## ✨ Features

### Blueprint Upload & Analyse

- **Upload-Funktionalität**: 
  - Unterstützte Formate: PNG, JPG
  - Maximum Dateigröße: 16MB
  - Drag & Drop Interface
  - Datei-Browser Integration

- **Automatische Analyse**:
  - KI-gestützte Wanderkennung
  - Raumidentifikation und -klassifizierung
  - Tür- und Fensterdetection
  - Strukturelle Element-Analyse

### 3D-Modell-Generierung

- **Konfigurierbare Parameter**:
  - Wandhöhe (Standard: 2.5m)
  - Wandstärke (Standard: 0.15m)
  - Optionale Türen-Generierung
  - Optionale Fenster-Generierung
  - Optionale Dach-Generierung

- **Qualitätsstufen**:
  - **Schnell**: Optimiert für Geschwindigkeit
  - **Standard**: Ausgewogene Qualität und Performance
  - **Hochwertig**: Detaillierte Geometrie
  - **Ultra**: Maximale Detailstufe

### Interaktiver 3D-Editor

- **Bearbeitungsfunktionen**:
  - Direkte Element-Manipulation in 3D
  - Echtzeit-Vorschau der Änderungen
  - Undo/Redo-Funktionalität
  - Präzise Eingabe von Koordinaten

### Virtuelle Touren

- **Tour-Features**:
  - Automatische Kamera-Pfade
  - Sanfte Übergänge zwischen Räumen
  - Cineastische Blickwinkel
  - Play/Pause-Steuerung
  - Tastatursteuerung (Leertaste)

### Export-Formate

#### 3D-Modell-Formate
- **GLTF**: Moderne 3D-Szenen mit PBR-Materialien
- **OBJ**: Universelles Format mit Mesh-Geometrie
- **STL**: 3D-druckfertiges Format
- **PLY**: Punktwolken-Geometrie

#### CAD-Integration
- **Blender-Skript**: Python-Skript für direkten Import in Blender
- **FreeCAD-Skript**: Python-Skript für FreeCAD-Import
- **Parametrische Daten**: JSON-Export der Gebäudestruktur

## 🛠️ Technologie-Stack

### Frontend
- **React 19**: Moderne UI-Entwicklung mit Hooks
- **TypeScript**: Type-Safety und bessere Developer Experience
- **Vite**: Schnelles Build-Tool und Dev-Server
- **Tailwind CSS**: Utility-First CSS Framework

### UI-Komponenten
- **Radix UI**: Zugängliche UI-Primitiven
- **Phosphor Icons**: Moderne Icon-Bibliothek
- **Sonner**: Toast-Benachrichtigungen
- **Framer Motion**: Animationen

### 3D-Rendering
- **Three.js**: 3D-Grafik-Engine
- **WebGL**: Hardware-beschleunigte 3D-Grafiken

### State Management
- **GitHub Spark KV**: Key-Value Storage für Persistenz
- **React Hooks**: Lokale State-Verwaltung

### Qualitätssicherung
- **ESLint**: Code-Linting
- **TypeScript**: Static Type Checking
- **E2E-Tests**: Umfassende End-to-End-Tests

## 📦 Installation

### Voraussetzungen

- Node.js (v18 oder höher)
- npm (v9 oder höher)

### Setup

1. **Repository klonen**:
```bash
git clone https://github.com/blackt666/3d-architektur-generator.git
cd 3d-architektur-generator
```

2. **Abhängigkeiten installieren**:
```bash
npm install
```

3. **Entwicklungsserver starten**:
```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:5173` verfügbar.

### Build für Produktion

```bash
npm run build
```

Das Build-Artefakt befindet sich im `dist`-Verzeichnis.

### Preview der Production-Build

```bash
npm run preview
```

## 🚀 Verwendung

### 1. Blueprint hochladen

1. Navigieren Sie zum "Hochladen"-Tab
2. Ziehen Sie eine Blueprint-Datei (PNG/JPG) in den Upload-Bereich oder klicken Sie zum Durchsuchen
3. Die Datei wird automatisch validiert (max. 16MB)

### 2. Blueprint analysieren

1. Wechseln Sie zum "Analyse"-Tab
2. Passen Sie die Analyse-Einstellungen an:
   - Wandhöhe
   - Wandstärke
   - Generierungsoptionen für Türen/Fenster/Dach
3. Klicken Sie auf "Analyse starten"
4. Warten Sie, während die KI die Blueprint analysiert

### 3. 3D-Modell generieren

1. Überprüfen Sie die Analyse-Ergebnisse
2. Wechseln Sie zum "3D-Ansicht"-Tab
3. Klicken Sie auf "3D-Modell generieren"
4. Das 3D-Modell wird erstellt und angezeigt

### 4. 3D-Modell erkunden

- **Rotation**: Linke Maustaste + Ziehen
- **Zoom**: Mausrad oder Pinch-Geste
- **Pan**: Rechte Maustaste + Ziehen
- **Tour starten**: Klicken Sie auf "Virtuelle Tour" oder drücken Sie die Leertaste

### 5. Modell exportieren

1. Wechseln Sie zum "Export"-Tab
2. Wählen Sie das gewünschte Format:
   - 3D-Modelle (GLTF, OBJ, STL, PLY)
   - CAD-Skripte (Blender, FreeCAD)
   - Parametrische Daten (JSON)
3. Konfigurieren Sie Export-Optionen
4. Klicken Sie auf "Exportieren"

## 📁 Projektstruktur

```
3d-architektur-generator/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── 3d/             # 3D-Viewer-Komponenten
│   │   │   └── ModelViewer.tsx
│   │   ├── blueprint/       # Blueprint-Upload und Analyse
│   │   │   ├── BlueprintUpload.tsx
│   │   │   └── AnalysisSettings.tsx
│   │   ├── export/         # Export-Funktionalität
│   │   │   └── ExportPanel.tsx
│   │   ├── testing/        # E2E-Test-Komponenten
│   │   │   ├── E2ETest.tsx
│   │   │   └── E2ETestGerman.tsx
│   │   └── ui/             # Wiederverwendbare UI-Komponenten
│   ├── services/           # Backend-Services
│   │   ├── api.ts          # API-Client
│   │   ├── blueprintAnalysis.ts    # Blueprint-Analyse-Engine
│   │   ├── model3DGeneration.ts    # 3D-Modell-Generator
│   │   ├── e2eTestBackend.ts       # E2E-Test-Backend
│   │   ├── database.ts     # Mock-Datenbank
│   │   └── index.ts        # Service-Integration
│   ├── lib/                # Utility-Funktionen
│   ├── hooks/              # Custom React Hooks
│   ├── styles/             # Globale Styles und Themes
│   ├── App.tsx             # Haupt-App-Komponente
│   └── main.tsx            # Einstiegspunkt
├── public/                 # Statische Assets
├── index.html              # HTML-Template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript-Konfiguration
├── vite.config.ts          # Vite-Konfiguration
├── tailwind.config.js      # Tailwind-CSS-Konfiguration
├── PRD.md                  # Product Requirements Document
├── E2E-TEST-EXECUTION-REPORT.md   # Test-Bericht
└── README.md               # Diese Datei
```

## 🧩 Komponenten

### App.tsx
Haupt-Anwendungskomponente mit Tab-Navigation und State-Management.

**Features**:
- Tab-basierte Navigation
- Blueprint-Upload-Verwaltung
- Analyse-Parameter-Verwaltung
- 3D-Generierungs-Workflow
- E2E-Test-Integration

### ModelViewer.tsx
Interaktiver 3D-Viewer basierend auf Three.js.

**Features**:
- 3D-Szenen-Rendering
- Kamera-Steuerung (Orbit Controls)
- Virtuelle Tour-Funktionalität
- Beleuchtungs-Setup
- Performance-Optimierung

### BlueprintUpload.tsx
Datei-Upload-Komponente mit Drag & Drop.

**Features**:
- Drag & Drop Interface
- Datei-Validierung
- Bildvorschau
- Fortschrittsanzeige

### AnalysisSettings.tsx
Konfiguration der Blueprint-Analyse.

**Features**:
- Wandhöhen-Einstellung
- Wandstärken-Einstellung
- Generierungs-Optionen (Türen/Fenster/Dach)
- Qualitätsstufen-Auswahl

### ExportPanel.tsx
Multi-Format-Export-Verwaltung.

**Features**:
- Format-Auswahl
- Export-Optionen
- Skript-Generierung (Blender/FreeCAD)
- Datei-Download

### E2ETest.tsx / E2ETestGerman.tsx
Umfassende End-to-End-Test-Suite.

**Features**:
- 8 Test-Schritte
- Fortschrittsanzeige
- Fehlerbehandlung
- Test-Bericht-Generierung

## 🔧 Services

### blueprintAnalysis.ts
KI-gestützte Blueprint-Analyse-Engine.

**Funktionen**:
- Bildverarbeitung
- Kantenerkennung
- Strukturanalyse
- Element-Klassifizierung

**Qualitätsstufen**:
- Schnell: Optimiert für Geschwindigkeit
- Ausgewogen: Balance zwischen Qualität und Speed
- Präzise: Maximale Genauigkeit

### model3DGeneration.ts
3D-Modell-Generator aus Blueprint-Daten.

**Funktionen**:
- Geometrie-Generierung
- Material-Anwendung
- Textur-Mapping
- Optimierung

**Qualitätsstufen**:
- Schnell: Low-Poly, schnelle Generierung
- Standard: Mittlere Detailstufe
- Hochwertig: Hohe Detailstufe
- Ultra: Maximale Detailstufe

### e2eTestBackend.ts
E2E-Test-Backend mit umfassender Test-Suite.

**Features**:
- 8 Test-Schritte
- Fehlerbehandlung
- Performance-Metriken
- Test-Berichte

### database.ts
Mock-Datenbank für Entwicklung und Tests.

**Funktionen**:
- In-Memory-Speicher
- CRUD-Operationen
- User-Management
- Projekt-Verwaltung

### api.ts
API-Client für Backend-Kommunikation.

**Services**:
- Blueprint-Service
- Model-Service
- Export-Service
- Test-Service

## 📤 Export-Formate

### GLTF (.gltf, .glb)
**Verwendung**: Moderne 3D-Anwendungen, Web-Rendering, AR/VR

**Features**:
- PBR-Materialien
- Animationen
- Hierarchische Szenen
- Kompakte Dateigröße

### OBJ (.obj + .mtl)
**Verwendung**: Universelles 3D-Format, CAD-Software

**Features**:
- Mesh-Geometrie
- Material-Gruppen
- Textur-Koordinaten
- Breite Kompatibilität

### STL (.stl)
**Verwendung**: 3D-Druck, CAD-Software

**Features**:
- Volumenkörper-Geometrie
- Mesh-Export
- Einfaches Format
- 3D-Druck-ready

### PLY (.ply)
**Verwendung**: Punktwolken, 3D-Scanning

**Features**:
- Vertex-basiert
- Farbinformationen
- Kompaktes Format

### Blender-Skript (.py)
**Verwendung**: Direkter Import in Blender

**Features**:
- Automatische Szenen-Erstellung
- Material-Setup
- Beleuchtung
- Kamera-Keyframes für Raumtouren

### FreeCAD-Skript (.py)
**Verwendung**: Import in FreeCAD

**Features**:
- Parametrische Konstruktion
- Arch-Workbench-Integration
- Wall/Window/Door-Objekte
- IFC-Export-fähig

## 🧪 E2E-Tests

Die Anwendung verfügt über eine umfassende E2E-Test-Suite, die den kompletten Blueprint-zu-3D-Workflow validiert.

### Test-Schritte

1. **Test-Umgebung einrichten**: Initialisierung und Datenbereinigung
2. **Blueprint-Upload**: Upload und Validierung
3. **Blueprint-Analyse**: KI-gestützte Analyse
4. **Analyse-Validierung**: Überprüfung der erkannten Elemente
5. **3D-Modell-Generierung**: Erstellung des 3D-Modells
6. **3D-Modell-Validierung**: Integrität-Checks
7. **Export-Funktionalität**: Test aller Export-Formate
8. **Bereinigung**: Cleanup der Test-Daten

### Test-Ausführung

**Via UI**:
1. Klicken Sie auf "E2E Test ausführen" im Header
2. Oder wechseln Sie zum "E2E Test"-Tab
3. Klicken Sie auf "E2E Test starten"

**Via Code**:
```typescript
import { architectureGenerator } from '@/services'

const testId = await architectureGenerator.runE2ETest()
```

### Test-Berichte

Nach jedem Test-Durchlauf kann ein detaillierter Bericht heruntergeladen werden:
- Test-Zusammenfassung
- Performance-Metriken
- Fehlerdetails
- Schritt-für-Schritt-Ergebnisse

Siehe [E2E-TEST-EXECUTION-REPORT.md](E2E-TEST-EXECUTION-REPORT.md) für den aktuellen Test-Bericht.

## 💻 Entwicklung

### Verfügbare Scripts

```bash
# Entwicklungsserver starten
npm run dev

# Production-Build erstellen
npm run build

# Linting durchführen
npm run lint

# Dependencies optimieren
npm run optimize

# Production-Build previews
npm run preview

# Dev-Server auf Port 5000 killen
npm run kill
```

### Code-Qualität

- **TypeScript**: Strict Mode aktiviert
- **ESLint**: Automatisches Linting
- **Prettier**: Code-Formatierung
- **Type-Safety**: Vollständige Type-Abdeckung

### Entwicklungs-Workflow

1. Feature-Branch erstellen: `git checkout -b feature/neue-funktion`
2. Änderungen implementieren
3. Linting durchführen: `npm run lint`
4. Build testen: `npm run build`
5. E2E-Tests ausführen
6. Commit und Push
7. Pull Request erstellen

### Performance-Optimierung

- **Code-Splitting**: Automatisch via Vite
- **Lazy Loading**: Komponenten bei Bedarf laden
- **Tree-Shaking**: Ungenutzter Code wird entfernt
- **Asset-Optimierung**: Bilder und Assets werden optimiert

## 🎨 Design

### Farbschema

- **Primary**: Deep Blue (#1E40AF) - Technische Präzision
- **Secondary**: Steel Gray (#64748B) - UI-Elemente
- **Accent**: Electric Orange (#F97316) - Calls-to-Action
- **Background**: White (#FFFFFF)
- **Text**: Charcoal (#374151)

### Typografie

- **Font Family**: Inter
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Hierarchie**: 
  - H1: 32px Bold
  - H2: 24px SemiBold
  - H3: 18px Medium
  - Body: 14px Regular

### Animationen

- Subtile, zweckmäßige Animationen
- Smooth Transitions für professionelles Feeling
- Fokus auf Upload-Progress, 3D-Generierung und Kamera-Touren

## 🔒 Sicherheit

- Input-Validierung für alle Uploads
- Maximale Dateigröße: 16MB
- Unterstützte Formate: PNG, JPG
- XSS-Schutz in allen Komponenten
- Sichere Daten-Serialisierung

Siehe [SECURITY.md](SECURITY.md) für Details.

## �� Beitragen

Contributions sind willkommen! Bitte beachten Sie:

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen mit aussagekräftigen Messages
4. Tests durchführen
5. Pull Request erstellen

## 📄 Lizenz

MIT License - Copyright GitHub, Inc.

Die Spark Template Dateien und Ressourcen von GitHub sind unter den Bedingungen der MIT-Lizenz lizenziert.

Siehe [LICENSE](LICENSE) für Details.

## 📞 Support

Bei Fragen oder Problemen:

- **Issues**: [GitHub Issues](https://github.com/blackt666/3d-architektur-generator/issues)
- **Dokumentation**: Siehe [PRD.md](PRD.md) für Product Requirements
- **Tests**: Siehe [E2E-TEST-EXECUTION-REPORT.md](E2E-TEST-EXECUTION-REPORT.md)

## 🙏 Danksagungen

- **React Team**: Für das fantastische Framework
- **Vite Team**: Für das schnelle Build-Tool
- **Three.js Team**: Für die 3D-Engine
- **GitHub Spark**: Für die Infrastruktur
- **Radix UI**: Für die zugänglichen UI-Komponenten
- **Tailwind CSS**: Für das Utility-First CSS Framework

---

**Made with ❤️ using GitHub Spark**
