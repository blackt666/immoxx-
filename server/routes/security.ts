import { Router, Request, Response } from 'express';
import { securityMonitoringService, SecurityEventType, SecurityEventSeverity } from '../services/securityMonitoringService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * Get security monitoring statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = securityMonitoringService.getStatistics();
    const config = securityMonitoringService.getConfig();
    
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        config,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security statistics',
      error: err.message,
    });
  }
});

/**
 * Get recent security events
 */
router.get('/events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const events = securityMonitoringService.getRecentEvents(limit);
    
    res.status(200).json({
      success: true,
      data: events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security events',
      error: err.message,
    });
  }
});

/**
 * Test security event logging (development only)
 */
router.post('/test-event', authMiddleware, async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'Test events can only be triggered in development mode',
    });
  }

  try {
    await securityMonitoringService.logEvent({
      type: SecurityEventType.API_ERROR,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Test security event from API',
      agentId: req.agentId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        endpoint: '/api/security/test-event',
        method: req.method,
        test: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Test security event logged successfully',
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Failed to log test event',
      error: err.message,
    });
  }
});

export default router;
