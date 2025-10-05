import { log } from '../lib/logger.js';
import nodemailer from 'nodemailer';

interface NotificationPayload {
  type: 'token_expiration' | 'calendar_sync_error' | 'system_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Notification Service für System-Benachrichtigungen
 * Unterstützt E-Mail-Benachrichtigungen und Webhook-Integration
 */
export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null;
  private static webhookUrl: string | null = null;
  private static adminEmail: string | null = null;

  /**
   * Initialisiert den Notification Service
   */
  static initialize() {
    // Email-Konfiguration aus Umgebungsvariablen
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    this.webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL || null;
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@bimm-fn.de';

    // Initialisiere Transporter nur wenn SMTP konfiguriert ist
    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      log.info('📧 Notification Service: E-Mail aktiviert');
    } else {
      log.warn('⚠️ Notification Service: E-Mail nicht konfiguriert (SMTP_* Env-Variablen fehlen)');
    }

    if (this.webhookUrl) {
      log.info('🔔 Notification Service: Webhook aktiviert');
    }

    log.info('✅ Notification Service initialisiert');
  }

  /**
   * Sendet eine Notification via E-Mail und/oder Webhook
   */
  static async send(payload: NotificationPayload): Promise<void> {
    try {
      log.info(`📬 Sende Notification: ${payload.type} - ${payload.title}`);

      // E-Mail senden
      if (this.transporter && this.adminEmail) {
        await this.sendEmail({
          to: this.adminEmail,
          subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
          html: this.formatEmailHtml(payload),
          text: this.formatEmailText(payload),
        });
      }

      // Webhook aufrufen
      if (this.webhookUrl) {
        await this.sendWebhook(payload);
      }

      // Fallback: Log-Benachrichtigung
      if (!this.transporter && !this.webhookUrl) {
        log.warn('⚠️ Notification nicht gesendet (kein Transporter/Webhook konfiguriert)');
        this.logNotification(payload);
      }
    } catch (error) {
      log.error('❌ Fehler beim Senden der Notification:', error);
      // Fallback: Immer loggen
      this.logNotification(payload);
    }
  }

  /**
   * Sendet Token-Ablauf-Benachrichtigung
   */
  static async notifyTokenExpiration(
    connectionType: string,
    connectionId: number,
    expiresAt: Date
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'token_expiration',
      title: 'Kalender-Token läuft ab',
      message: `Der Authentifizierungs-Token für ${connectionType} (ID: ${connectionId}) läuft am ${expiresAt.toLocaleString('de-DE')} ab und muss erneuert werden.`,
      severity: 'warning',
      metadata: {
        connectionType,
        connectionId,
        expiresAt: expiresAt.toISOString(),
      },
    };

    await this.send(payload);
  }

  /**
   * Sendet Sync-Fehler-Benachrichtigung
   */
  static async notifySyncError(
    connectionType: string,
    error: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'calendar_sync_error',
      title: 'Kalender-Synchronisations-Fehler',
      message: `Fehler bei der Synchronisation mit ${connectionType}: ${error}`,
      severity: 'error',
      metadata: {
        connectionType,
        error,
        ...details,
      },
    };

    await this.send(payload);
  }

  /**
   * Sendet E-Mail
   */
  private static async sendEmail(notification: EmailNotification): Promise<void> {
    if (!this.transporter) {
      log.warn('⚠️ E-Mail-Versand übersprungen: Transporter nicht initialisiert');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Bodensee Immobilien" <noreply@bimm-fn.de>',
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });

      log.info(`✅ E-Mail gesendet: ${info.messageId}`);
    } catch (error) {
      log.error('❌ E-Mail-Versand fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Sendet Webhook-Benachrichtigung
   */
  private static async sendWebhook(payload: NotificationPayload): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bodensee-Immobilien-Notification/1.0',
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: 'bodensee-immobilien',
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook fehlgeschlagen: ${response.status} ${response.statusText}`);
      }

      log.info('✅ Webhook-Benachrichtigung gesendet');
    } catch (error) {
      log.error('❌ Webhook-Versand fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Formatiert Notification als HTML für E-Mail
   */
  private static formatEmailHtml(payload: NotificationPayload): string {
    const severityColor = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626',
    }[payload.severity];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${payload.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">${payload.title}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${payload.type.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">${payload.message}</p>
            ${payload.metadata ? `
              <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Details:</h3>
                <pre style="margin: 0; font-size: 12px; color: #374151; overflow-x: auto;">${JSON.stringify(payload.metadata, null, 2)}</pre>
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Diese Benachrichtigung wurde automatisch vom Bodensee Immobilien System gesendet.<br>
              Zeitstempel: ${new Date().toLocaleString('de-DE')}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Formatiert Notification als Plain Text für E-Mail
   */
  private static formatEmailText(payload: NotificationPayload): string {
    let text = `${payload.title}\n`;
    text += `${'='.repeat(payload.title.length)}\n\n`;
    text += `Typ: ${payload.type.replace('_', ' ').toUpperCase()}\n`;
    text += `Schweregrad: ${payload.severity.toUpperCase()}\n\n`;
    text += `${payload.message}\n\n`;

    if (payload.metadata) {
      text += `Details:\n${JSON.stringify(payload.metadata, null, 2)}\n\n`;
    }

    text += `---\n`;
    text += `Diese Benachrichtigung wurde automatisch vom Bodensee Immobilien System gesendet.\n`;
    text += `Zeitstempel: ${new Date().toLocaleString('de-DE')}\n`;

    return text;
  }

  /**
   * Loggt Notification als Fallback
   */
  private static logNotification(payload: NotificationPayload): void {
    const logMethod = {
      info: log.info.bind(log),
      warning: log.warn.bind(log),
      error: log.error.bind(log),
      critical: log.error.bind(log),
    }[payload.severity];

    logMethod(`📬 NOTIFICATION: ${payload.title} - ${payload.message}`, payload.metadata);
  }
}

// Service beim Import initialisieren
NotificationService.initialize();
