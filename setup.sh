#!/bin/bash

# Vollautomatisches Setup-Script für ImmoXX Server
# Konfiguriert Server-Stabilität, Logging, Monitoring und CI/CD

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_ROOT/setup.log"

# Logging-Funktion
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

error() {
    log "❌ ERROR: $1" >&2
    exit 1
}

success() {
    log "✅ $1"
}

warning() {
    log "⚠️ WARNING: $1"
}

# Prüfe Systemvoraussetzungen
check_requirements() {
    log "🔍 Checking system requirements..."

    # Node.js Version prüfen
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi

    local node_version=$(node --version | sed 's/v//')
    log "Node.js version: $node_version"

    # npm Version prüfen
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi

    local npm_version=$(npm --version)
    log "npm version: $npm_version"

    # PM2 prüfen/installieren
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
        success "PM2 installed"
    else
        log "PM2 already installed"
    fi

    success "System requirements check completed"
}

# Abhängigkeiten installieren
install_dependencies() {
    log "📦 Installing project dependencies..."

    cd "$PROJECT_ROOT"

    # Installiere alle npm dependencies
    npm ci

    # Installiere Playwright Browser
    npx playwright install --with-deps

    # Installiere Winston für Logging
    npm install winston winston-daily-rotate-file
    npm install --save-dev @types/winston

    success "Dependencies installed"
}

# Logging-System einrichten
setup_logging() {
    log "📝 Setting up logging system..."

    # Erstelle Logs-Verzeichnis
    mkdir -p "$PROJECT_ROOT/logs"

    # Erstelle Log-Rotations-Konfiguration
    cat > "$PROJECT_ROOT/logs/.gitignore" << 'EOF'
*
!.gitignore
!monitor.log
EOF

    success "Logging system configured"
}

# PM2 konfigurieren
setup_pm2() {
    log "⚙️ Configuring PM2..."

    cd "$PROJECT_ROOT"

    # PM2 Startup konfigurieren (optional)
    if [ "$1" = "--with-startup" ]; then
        log "Setting up PM2 startup..."
        pm2 startup | grep "sudo" | bash || warning "PM2 startup setup failed - run manually if needed"
        pm2 save
    fi

    success "PM2 configured"
}

# Test-Suite einrichten
setup_tests() {
    log "🧪 Setting up test suite..."

    cd "$PROJECT_ROOT"

    # Erstelle Test-Verzeichnis-Struktur falls nicht vorhanden
    mkdir -p tests/unit tests/e2e tests/integration

    # Test-Konfiguration für Playwright
    if [ ! -f "playwright.config.ts" ]; then
        warning "playwright.config.ts not found - tests may not work properly"
    fi

    success "Test suite configured"
}

# CI/CD Pipeline einrichten
setup_cicd() {
    log "🚀 Setting up CI/CD pipeline..."

    # GitHub Actions Workflow ist bereits erstellt
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        success "CI/CD pipeline configured"
    else
        warning "CI/CD workflow file not found"
    fi
}

# Monitoring einrichten
setup_monitoring() {
    log "📊 Setting up monitoring..."

    # Monitor-Script ist bereits erstellt
    if [ -f "monitor.js" ]; then
        success "Monitoring configured"
    else
        warning "Monitor script not found"
    fi
}

# Server-Stabilität testen
test_server_stability() {
    log "🧪 Testing server stability..."

    cd "$PROJECT_ROOT"

    # Erstelle .env falls nicht vorhanden
    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
NODE_ENV=development
PORT=5001
HOST=0.0.0.0
DATABASE_URL=file:./database.sqlite
SESSION_SECRET=auto-generated-secret-key-$(date +%s)
AUTH_ENABLED=false
EOF
        success "Created default .env file"
    fi

    # Starte Server mit PM2 zum Test
    log "Starting server for stability test..."
    ./pm2-server.sh start

    # Warte auf Server-Start
    sleep 5

    # Health-Check
    if curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
        success "Server stability test passed"
    else
        warning "Server stability test failed - server may not be responding"
    fi

    # Stoppe Server
    ./pm2-server.sh stop
}

# Finale Konfiguration
finalize_setup() {
    log "🎯 Finalizing setup..."

    cd "$PROJECT_ROOT"

    # Erstelle README für Setup
    cat > SETUP.md << 'EOF'
# ImmoXX Server Setup

## Automatische Einrichtung

Das Setup wurde automatisch durchgeführt. Der Server ist nun mit folgenden Features konfiguriert:

### 🚀 Server-Management

```bash
# Server starten
npm run pm2:start

# Server stoppen
npm run pm2:stop

# Server neustarten
npm run pm2:restart

# Status anzeigen
npm run pm2:status

# Logs anzeigen
npm run pm2:logs
```

### 📊 Monitoring

```bash
# Server überwachen
node monitor.js
```

### 🧪 Tests

```bash
# API Tests
npm run test:api

# E2E Tests
npm run test:e2e

# Alle Tests
npm test
```

### 📝 Logging

Logs werden in `./logs/` gespeichert:
- `app-YYYY-MM-DD.log` - Haupt-Logs
- `error-YYYY-MM-DD.log` - Fehler-Logs
- `exceptions.log` - Unbehandelte Exceptions
- `rejections.log` - Unbehandelte Promise Rejections
- `monitor.log` - Monitoring-Logs

### 🚀 CI/CD

GitHub Actions Pipeline ist konfiguriert für:
- Automatische Tests bei jedem Push
- Security Audits
- Staging und Production Deployments

## Troubleshooting

### Server startet nicht
```bash
# PM2 Logs prüfen
npm run pm2:logs

# Server manuell starten
npm run dev
```

### Tests schlagen fehl
```bash
# Abhängigkeiten neu installieren
npm ci

# Playwright Browser installieren
npx playwright install --with-deps
```

### Monitoring funktioniert nicht
```bash
# Monitor manuell starten
node monitor.js
```
EOF

    success "Setup finalized - check SETUP.md for usage instructions"
}

# Hauptfunktion
main() {
    log "🚀 Starting ImmoXX Server Setup..."

    local with_startup=false

    # Parameter parsen
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-startup)
                with_startup=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done

    check_requirements
    install_dependencies
    setup_logging
    setup_pm2 "$with_startup"
    setup_tests
    setup_cicd
    setup_monitoring
    test_server_stability
    finalize_setup

    log "🎉 Setup completed successfully!"
    log "📖 See SETUP.md for usage instructions"
}

# Script ausführen wenn direkt aufgerufen
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
