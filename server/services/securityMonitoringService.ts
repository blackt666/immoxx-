import { log } from '../lib/logger.js';

/**
 * Security Event Types
 */
export enum SecurityEventType {
  AUTH_FAILURE = 'auth_failure',
  AUTH_SUCCESS = 'auth_success',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_REFRESH = 'token_refresh',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CALENDAR_CONNECTION_FAILED = 'calendar_connection_failed',
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
}

/**
 * Security Event Severity
 */
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security Event Interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  userId?: string;
  agentId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Security Monitoring Configuration
 */
interface SecurityMonitoringConfig {
  enabled: boolean;
  webhookUrl?: string;
  sentryDsn?: string;
  datadogApiKey?: string;
  minSeverity: SecurityEventSeverity;
}

/**
 * Security Monitoring Service
 * 
 * Provides a centralized interface for logging security events
 * and integrating with external monitoring services.
 */
export class SecurityMonitoringService {
  private config: SecurityMonitoringConfig;
  private eventBuffer: SecurityEvent[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor() {
    this.config = {
      enabled: process.env.SECURITY_MONITORING_ENABLED === 'true',
      webhookUrl: process.env.SECURITY_WEBHOOK_URL,
      sentryDsn: process.env.SENTRY_DSN,
      datadogApiKey: process.env.DATADOG_API_KEY,
      minSeverity: (process.env.SECURITY_MIN_SEVERITY as SecurityEventSeverity) || SecurityEventSeverity.MEDIUM,
    };

    if (this.config.enabled) {
      log.info('🔒 Security Monitoring Service enabled');
      this.logConfiguration();
    } else {
      log.info('⚠️  Security Monitoring Service disabled (set SECURITY_MONITORING_ENABLED=true to enable)');
    }
  }

  /**
   * Log security monitoring configuration
   */
  private logConfiguration(): void {
    const integrations: string[] = [];
    
    if (this.config.webhookUrl) integrations.push('Webhook');
    if (this.config.sentryDsn) integrations.push('Sentry');
    if (this.config.datadogApiKey) integrations.push('Datadog');
    
    if (integrations.length > 0) {
      log.info(`🔒 Security integrations: ${integrations.join(', ')}`);
    } else {
      log.warn('⚠️  No security monitoring integrations configured (local logging only)');
    }
  }

  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to buffer for statistics
    this.addToBuffer(fullEvent);

    // Check if event meets minimum severity
    if (!this.shouldLogEvent(fullEvent)) {
      return;
    }

    // Always log to console/file
    this.logToConsole(fullEvent);

    // Send to external services if enabled
    if (this.config.enabled) {
      await this.sendToExternalServices(fullEvent);
    }
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLogEvent(event: SecurityEvent): boolean {
    const severityLevels = {
      [SecurityEventSeverity.LOW]: 1,
      [SecurityEventSeverity.MEDIUM]: 2,
      [SecurityEventSeverity.HIGH]: 3,
      [SecurityEventSeverity.CRITICAL]: 4,
    };

    return severityLevels[event.severity] >= severityLevels[this.config.minSeverity];
  }

  /**
   * Add event to buffer for statistics
   */
  private addToBuffer(event: SecurityEvent): void {
    this.eventBuffer.push(event);
    
    if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer.shift();
    }
  }

  /**
   * Log event to console/file
   */
  private logToConsole(event: SecurityEvent): void {
    const logMessage = `[Security ${event.severity.toUpperCase()}] ${event.type}: ${event.message}`;
    const logData = {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      agentId: event.agentId,
      ipAddress: event.ipAddress,
      metadata: event.metadata,
    };

    switch (event.severity) {
      case SecurityEventSeverity.CRITICAL:
      case SecurityEventSeverity.HIGH:
        log.error(logMessage, logData);
        break;
      case SecurityEventSeverity.MEDIUM:
        log.warn(logMessage, logData);
        break;
      case SecurityEventSeverity.LOW:
        log.info(logMessage, logData);
        break;
    }
  }

  /**
   * Send event to external monitoring services
   */
  private async sendToExternalServices(event: SecurityEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to webhook
    if (this.config.webhookUrl) {
      promises.push(this.sendToWebhook(event));
    }

    // Send to Sentry (placeholder - requires @sentry/node package)
    if (this.config.sentryDsn) {
      promises.push(this.sendToSentry(event));
    }

    // Send to Datadog (placeholder - requires @datadog/datadog-api-client package)
    if (this.config.datadogApiKey) {
      promises.push(this.sendToDatadog(event));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send event to webhook
   */
  private async sendToWebhook(event: SecurityEvent): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'security_event',
          severity: event.severity,
          type: event.type,
          message: event.message,
          timestamp: event.timestamp.toISOString(),
          user_id: event.userId,
          agent_id: event.agentId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          metadata: event.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }
    } catch (error) {
      log.error('Failed to send security event to webhook', { error, eventType: event.type });
    }
  }

  /**
   * Send event to Sentry
   * Note: Requires @sentry/node package installation
   */
  private async sendToSentry(event: SecurityEvent): Promise<void> {
    // Placeholder for Sentry integration
    // To implement: npm install @sentry/node
    // Then uncomment and use:
    /*
    import * as Sentry from '@sentry/node';
    
    Sentry.captureMessage(event.message, {
      level: this.mapSeverityToSentryLevel(event.severity),
      tags: {
        type: event.type,
        user_id: event.userId,
        agent_id: event.agentId,
      },
      extra: event.metadata,
    });
    */
    log.debug('Sentry integration not yet implemented', { eventType: event.type });
  }

  /**
   * Send event to Datadog
   * Note: Requires @datadog/datadog-api-client package installation
   */
  private async sendToDatadog(event: SecurityEvent): Promise<void> {
    // Placeholder for Datadog integration
    // To implement: npm install @datadog/datadog-api-client
    log.debug('Datadog integration not yet implemented', { eventType: event.type });
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  /**
   * Get security statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const event of this.eventBuffer) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }

    return {
      totalEvents: this.eventBuffer.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: this.eventBuffer.length,
    };
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get service configuration
   */
  getConfig(): Partial<SecurityMonitoringConfig> {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl ? '***configured***' : undefined,
      sentryDsn: this.config.sentryDsn ? '***configured***' : undefined,
      datadogApiKey: this.config.datadogApiKey ? '***configured***' : undefined,
      minSeverity: this.config.minSeverity,
    };
  }
}

// Create and export singleton instance
export const securityMonitoringService = new SecurityMonitoringService();
