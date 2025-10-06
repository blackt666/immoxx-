# Security Monitoring System

## Overview

The ImmoXX platform includes a comprehensive security monitoring system that tracks, logs, and reports security events across the application. This system provides real-time visibility into authentication attempts, unauthorized access, token issues, and other security-related events.

## Features

### 1. Event Tracking

The security monitoring service tracks various types of security events:

- **Authentication Events**
  - Login attempts (successful and failed)
  - Invalid credentials
  - Missing credentials
  - Session management

- **Authorization Events**
  - Unauthorized access attempts
  - Token expiration
  - Token refresh operations

- **Rate Limiting Events**
  - Rate limit exceeded
  - Suspicious activity patterns

- **System Events**
  - Calendar connection failures
  - API errors
  - Database errors

### 2. Severity Levels

Events are categorized by severity:

- **LOW**: Routine events, informational
- **MEDIUM**: Events requiring attention
- **HIGH**: Potentially serious security concerns
- **CRITICAL**: Urgent security issues requiring immediate action

### 3. External Integrations

The system supports integration with popular monitoring services:

- **Webhooks**: Send events to any HTTP endpoint
- **Sentry**: Error tracking and monitoring (placeholder)
- **Datadog**: Application performance monitoring (placeholder)

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Enable security monitoring
SECURITY_MONITORING_ENABLED=true

# Minimum severity to log (low, medium, high, critical)
SECURITY_MIN_SEVERITY=medium

# Webhook integration
SECURITY_WEBHOOK_URL=https://your-webhook-endpoint.com/security

# Optional: Sentry integration (requires @sentry/node package)
# SENTRY_DSN=your-sentry-dsn-here

# Optional: Datadog integration (requires @datadog/datadog-api-client package)
# DATADOG_API_KEY=your-datadog-api-key-here
```

### Enabling Security Monitoring

1. **Development Mode**: Set `SECURITY_MONITORING_ENABLED=false` (default)
   - Events are logged to console only
   - No external services called

2. **Production Mode**: Set `SECURITY_MONITORING_ENABLED=true`
   - Events sent to configured external services
   - Webhook notifications for critical/high severity events

## API Endpoints

### Get Security Statistics

Get aggregate statistics about security events.

**Endpoint:** `GET /api/security/stats`

**Authentication:** Required (admin/agent)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 42,
    "eventsByType": {
      "auth_failure": 5,
      "auth_success": 35,
      "rate_limit_exceeded": 2
    },
    "eventsBySeverity": {
      "low": 30,
      "medium": 10,
      "high": 2,
      "critical": 0
    },
    "recentEvents": 42,
    "config": {
      "enabled": true,
      "webhookUrl": "***configured***",
      "minSeverity": "medium"
    }
  },
  "timestamp": "2025-10-06T17:30:00.000Z"
}
```

### Get Recent Security Events

Retrieve recent security events.

**Endpoint:** `GET /api/security/events?limit=50`

**Authentication:** Required (admin/agent)

**Parameters:**
- `limit` (optional): Number of events to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "auth_success",
      "severity": "low",
      "message": "Successful login",
      "ipAddress": "192.168.1.1",
      "userId": "admin",
      "timestamp": "2025-10-06T17:30:00.000Z",
      "metadata": {
        "username": "adm***",
        "sessionId": "abc123"
      }
    }
  ],
  "count": 1,
  "timestamp": "2025-10-06T17:30:00.000Z"
}
```

### Test Event Logging (Development Only)

Test the security monitoring system by triggering a test event.

**Endpoint:** `POST /api/security/test-event`

**Authentication:** Required (admin/agent)

**Environment:** Development only (returns 403 in production)

**Response:**
```json
{
  "success": true,
  "message": "Test security event logged successfully"
}
```

## Security Event Types

The system tracks the following event types:

| Event Type | Description | Typical Severity |
|------------|-------------|------------------|
| `AUTH_FAILURE` | Failed authentication attempt | HIGH |
| `AUTH_SUCCESS` | Successful authentication | LOW |
| `UNAUTHORIZED_ACCESS` | Attempt to access protected resource | HIGH |
| `TOKEN_EXPIRED` | Access token has expired | MEDIUM |
| `TOKEN_REFRESH` | Token refresh operation | LOW |
| `SUSPICIOUS_ACTIVITY` | Unusual behavior detected | HIGH |
| `RATE_LIMIT_EXCEEDED` | Too many requests | MEDIUM |
| `CALENDAR_CONNECTION_FAILED` | Calendar API connection error | MEDIUM |
| `API_ERROR` | General API error | MEDIUM |
| `DATABASE_ERROR` | Database operation error | HIGH |

## Integration Examples

### Webhook Integration

Configure a webhook to receive security events:

```env
SECURITY_MONITORING_ENABLED=true
SECURITY_WEBHOOK_URL=https://your-webhook.com/security
```

The webhook will receive POST requests with this payload:

```json
{
  "event_type": "security_event",
  "severity": "high",
  "type": "auth_failure",
  "message": "Failed login attempt",
  "timestamp": "2025-10-06T17:30:00.000Z",
  "ip_address": "192.168.1.1",
  "user_id": "admin",
  "metadata": {
    "attempts": 3,
    "locked": false
  }
}
```

### Slack Integration

Use a Slack webhook URL to send security alerts to a Slack channel:

```env
SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Custom Monitoring Service

Implement your own monitoring service by creating an HTTP endpoint that accepts the security event payload format shown above.

## Monitoring Best Practices

### 1. Set Appropriate Severity Levels

- **Development**: `SECURITY_MIN_SEVERITY=low` (log everything)
- **Staging**: `SECURITY_MIN_SEVERITY=medium` (filter noise)
- **Production**: `SECURITY_MIN_SEVERITY=medium` or `high` (critical events only)

### 2. Regular Review

- Review security statistics weekly
- Investigate spikes in authentication failures
- Monitor for unusual patterns in event types

### 3. Alert Configuration

Set up alerts for:
- Multiple authentication failures from same IP
- Repeated rate limit violations
- Critical severity events

### 4. Retention and Compliance

- Security events are kept in memory (last 100 events)
- For long-term retention, use external monitoring service
- Consider compliance requirements (GDPR, HIPAA, etc.)

## Troubleshooting

### Events Not Being Logged

1. Check `SECURITY_MONITORING_ENABLED=true`
2. Verify severity level: `SECURITY_MIN_SEVERITY`
3. Review console logs for errors

### Webhook Not Receiving Events

1. Verify webhook URL is correct
2. Check network connectivity
3. Review webhook endpoint logs
4. Test with `/api/security/test-event` endpoint

### High Memory Usage

The service keeps last 100 events in memory:
- This is ~100KB of memory typically
- Events automatically roll over when limit reached
- Consider external service for high-volume scenarios

## Security Considerations

### Sensitive Data

The security monitoring service:
- ✅ Logs IP addresses for tracking
- ✅ Includes partial usernames (e.g., "adm***")
- ❌ Never logs passwords
- ❌ Never logs full authentication tokens
- ❌ Never logs sensitive personal data

### Access Control

Security monitoring endpoints require authentication:
- Only admin/agent users can access
- Events may contain sensitive operational data
- Follow principle of least privilege

## Future Enhancements

Planned improvements:

- [ ] Persistent event storage (database)
- [ ] Advanced analytics and pattern detection
- [ ] Automated threat response
- [ ] Geolocation tracking
- [ ] User behavior analysis
- [ ] Complete Sentry integration
- [ ] Complete Datadog integration
- [ ] Custom alert rules
- [ ] Email notifications for critical events
- [ ] Security dashboard in admin UI

## Related Documentation

- [TODO.md](TODO.md) - Feature roadmap
- [TIMING-METRICS.md](TIMING-METRICS.md) - Performance monitoring
- [FINAL-STATUS.md](FINAL-STATUS.md) - System status
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) - Architecture overview

## Support

For issues or questions about security monitoring:

1. Check console logs for error messages
2. Review this documentation
3. Test with `/api/security/test-event` endpoint
4. Verify environment variable configuration
