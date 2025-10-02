#!/bin/bash

# PM2 Server Management Script
# Automatische Server-Verwaltung mit PM2

set -e

PROJECT_NAME="immoxx-server"
CONFIG_FILE="ecosystem.config.json"
LOG_DIR="./logs"

echo "🚀 Starting ImmoXX Server Management..."

# Erstelle Log-Verzeichnis falls nicht vorhanden
mkdir -p "$LOG_DIR"

# Funktion zum Starten des Servers
start_server() {
    echo "📦 Starting server with PM2..."
    pm2 start "$CONFIG_FILE"
    pm2 save
    echo "✅ Server started successfully"
}

# Funktion zum Stoppen des Servers
stop_server() {
    echo "🛑 Stopping server..."
    pm2 stop "$PROJECT_NAME" || true
    pm2 delete "$PROJECT_NAME" || true
    echo "✅ Server stopped"
}

# Funktion zum Neustarten des Servers
restart_server() {
    echo "🔄 Restarting server..."
    pm2 restart "$PROJECT_NAME" || start_server
    echo "✅ Server restarted"
}

# Funktion zum Anzeigen des Status
show_status() {
    echo "📊 Server Status:"
    pm2 status
    echo ""
    echo "📋 Server Logs (last 20 lines):"
    pm2 logs "$PROJECT_NAME" --lines 20 --nostream || echo "No logs available"
}

# Funktion für Health-Check
health_check() {
    echo "🔍 Performing health check..."
    if curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "✅ Server is healthy"
        return 0
    else
        echo "❌ Server is not responding"
        return 1
    fi
}

# Hauptlogik basierend auf dem ersten Argument
case "${1:-start}" in
    "start")
        start_server
        sleep 3
        health_check
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        sleep 3
        health_check
        ;;
    "status")
        show_status
        ;;
    "logs")
        pm2 logs "$PROJECT_NAME" --lines "${2:-50}"
        ;;
    "health")
        health_check
        ;;
    "setup")
        echo "🔧 Setting up PM2 startup script..."
        pm2 startup
        pm2 save
        echo "✅ PM2 startup configured"
        ;;
    "cleanup")
        echo "🧹 Cleaning up PM2 processes..."
        pm2 kill
        echo "✅ PM2 cleaned up"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [lines]|health|setup|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the server"
        echo "  stop     - Stop the server"
        echo "  restart  - Restart the server"
        echo "  status   - Show server status and recent logs"
        echo "  logs     - Show server logs (default: 50 lines)"
        echo "  health   - Check server health"
        echo "  setup    - Configure PM2 to start on system boot"
        echo "  cleanup  - Kill all PM2 processes"
        exit 1
        ;;
esac
