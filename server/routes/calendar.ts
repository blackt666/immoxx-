
import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import * as schema from '@shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { CalendarConnection } from '@shared/schema';
import { googleCalendarService } from '../services/googleCalendarService.js';
import { appleCalendarService } from '../services/appleCalendarService.js';
import { calendarSyncService } from '../services/calendarSyncService.js';
import { tokenMaintenanceService } from '../services/tokenMaintenanceService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const syncOptionsSchema = z.object({
  direction: z.enum(['crm_to_calendar', 'calendar_to_crm', 'bidirectional']).optional(),
  forceSync: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  timeRangeStart: z.string().optional(),
  timeRangeEnd: z.string().optional(),
});

const appleCredentialsSchema = z.object({
  username: z.string().email('Apple ID must be a valid email'),
  password: z.string().min(1, 'App-specific password is required'),
  serverUrl: z.string().url().optional(),
});

// Secure authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  // Check if user is authenticated via session
  if (!req.session?.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access calendar features'
    });
  }
  
  // Use authenticated user's ID as agent ID
  req.agentId = req.session.user.id;
  next();
};

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      agentId?: string;
    }
  }
}

/**
 * GOOGLE CALENDAR ROUTES
 */

// Get Google Calendar authorization URL
router.get('/google/auth-url', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log(`Generating Google Calendar auth URL for agent: ${req.agentId}`);
    const authUrl = googleCalendarService.generateAuthUrl(req.agentId!, req);
    
    res.json({ 
      authUrl,
      message: 'Authorization URL generated successfully. Please complete OAuth flow to connect your calendar.' 
    });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Handle Google Calendar OAuth2 callback (no auth middleware - OAuth flow)
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    console.log(`Received Google Calendar OAuth callback - code: ${!!code}, state: ${!!state}, error: ${error}`);

    if (error) {
      console.error(`OAuth error from Google: ${error}`);
      return res.status(400).json({ 
        error: `OAuth authorization failed: ${error}`,
        message: 'Please try connecting your calendar again.' 
      });
    }

    if (!code || !state) {
      console.error('Missing OAuth parameters:', { code: !!code, state: !!state });
      return res.status(400).json({ 
        error: 'Missing authorization code or state parameter',
        message: 'Invalid OAuth callback. Please try connecting your calendar again.' 
      });
    }

    const connection = await googleCalendarService.handleAuthCallback(
      code as string, 
      state as string,
      req
    );
    
    console.log(`Successfully connected Google Calendar for agent ${connection.agentId} - Connection ID: ${connection.id}`);
    
    // Verify the connection has refresh token for long-term use
    if (!connection.refreshToken) {
      console.warn(`Warning: No refresh token received for connection ${connection.id} - this may require re-consent`);
    }

    // Return success with token health status
    const tokenHealth = googleCalendarService.getTokenHealthStatus(connection);
    
    res.json({
      success: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        calendarName: connection.calendarName,
        syncStatus: connection.syncStatus,
        tokenHealth: {
          status: tokenHealth.status,
          expiresAt: tokenHealth.expiresAt,
          minutesToExpiry: tokenHealth.minutesToExpiry,
          canRefresh: tokenHealth.canRefresh
        }
      },
      message: 'Google Calendar successfully connected! Calendar sync is now active.',
    });
  } catch (error) {
    console.error('Google Calendar callback error:', error);
    res.status(500).json({ 
      error: `Failed to connect Google Calendar: ${error instanceof Error ? error.message : String(error)}`,
      message: 'Connection failed. Please try again or contact support if the problem persists.' 
    });
  }
});

/**
 * APPLE CALENDAR ROUTES
 */

// Connect Apple Calendar using CalDAV
router.post('/apple/connect', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = appleCredentialsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid credentials', 
        details: validationResult.error.issues 
      });
    }

    const credentials = validationResult.data;
    const connection = await appleCalendarService.authenticateAndSave(req.agentId!, {
      username: credentials.username,
      password: credentials.password,
      serverUrl: credentials.serverUrl
    });

    res.json({
      success: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        calendarName: connection.calendarName,
        syncStatus: connection.syncStatus,
      },
      message: 'Apple Calendar successfully connected!',
    });
  } catch (error) {
    console.error('Apple Calendar connection error:', error);
    res.status(500).json({ error: `Failed to connect Apple Calendar: ${error instanceof Error ? error.message : String(error)}` });
  }
});

/**
 * CONNECTION MANAGEMENT ROUTES
 */

// Get all calendar connections for an agent
router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  try {
    const connections = await db
      .select({
        id: schema.calendarConnections.id,
        provider: schema.calendarConnections.provider,
        calendarName: schema.calendarConnections.calendarName,
        isActive: schema.calendarConnections.isActive,
        syncDirection: schema.calendarConnections.syncDirection,
        autoSync: schema.calendarConnections.autoSync,
        syncStatus: schema.calendarConnections.syncStatus,
        syncError: schema.calendarConnections.syncError,
        lastSyncAt: schema.calendarConnections.lastSyncAt,
        createdAt: schema.calendarConnections.createdAt,
        updatedAt: schema.calendarConnections.updatedAt,
      })
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.agentId, req.agentId!))
      .orderBy(desc(schema.calendarConnections.createdAt));

    res.json({ connections });
  } catch (error) {
    console.error('Error fetching calendar connections:', error);
    res.status(500).json({ error: 'Failed to fetch calendar connections' });
  }
});

// Update calendar connection settings
router.patch('/connections/:connectionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const updateData = req.body;

    // Validate connection belongs to agent
    const connection = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.id, connectionId),
          eq(schema.calendarConnections.agentId, req.agentId!)
        )
      );

    if (connection.length === 0) {
      return res.status(404).json({ error: 'Calendar connection not found' });
    }

    // Update connection
    const [updatedConnection] = await db
      .update(schema.calendarConnections)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.calendarConnections.id, connectionId))
      .returning();

    res.json({ 
      success: true, 
      connection: updatedConnection,
      message: 'Calendar connection updated successfully' 
    });
  } catch (error) {
    console.error('Error updating calendar connection:', error);
    res.status(500).json({ error: 'Failed to update calendar connection' });
  }
});

// Delete calendar connection
router.delete('/connections/:connectionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    // Validate connection belongs to agent
    const connection = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.id, connectionId),
          eq(schema.calendarConnections.agentId, req.agentId!)
        )
      );

    if (connection.length === 0) {
      return res.status(404).json({ error: 'Calendar connection not found' });
    }

    // Delete connection
    await db
      .delete(schema.calendarConnections)
      .where(eq(schema.calendarConnections.id, connectionId));

    res.json({ 
      success: true,
      message: 'Calendar connection deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting calendar connection:', error);
    res.status(500).json({ error: 'Failed to delete calendar connection' });
  }
});

// Test calendar connection
router.post('/connections/:connectionId/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    // Get connection
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.id, connectionId),
          eq(schema.calendarConnections.agentId, req.agentId!)
        )
      );

    if (connections.length === 0) {
      return res.status(404).json({ error: 'Calendar connection not found' });
    }

    const connection = connections[0];
    let isConnected = false;

    // Test connection based on provider
    if (connection.provider === 'google') {
      isConnected = await googleCalendarService.testConnection(connection);
    } else if (connection.provider === 'apple') {
      isConnected = await appleCalendarService.testConnection(connection);
    }

    res.json({ 
      success: true,
      connected: isConnected,
      message: isConnected ? 'Connection test successful' : 'Connection test failed' 
    });
  } catch (error) {
    console.error('Error testing calendar connection:', error);
    res.status(500).json({ 
      error: 'Connection test failed',
      connected: false 
    });
  }
});

/**
 * SYNC MANAGEMENT ROUTES
 */

// Trigger manual sync for all agent's calendars
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = syncOptionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid sync options', 
        details: validationResult.error.issues 
      });
    }

    const options = validationResult.data;
    
    // Convert string dates to Date objects if provided
    const syncOptions = {
      ...options,
      timeRange: options.timeRangeStart && options.timeRangeEnd ? {
        start: new Date(options.timeRangeStart),
        end: new Date(options.timeRangeEnd),
      } : undefined
    };

    const results = await calendarSyncService.syncAgentCalendars(req.agentId!, syncOptions);

    res.json({
      success: true,
      results,
      message: 'Calendar sync completed'
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({ error: `Sync failed: ${error instanceof Error ? error.message : String(error)}` });
  }
});

// Trigger sync for specific connection
router.post('/connections/:connectionId/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    
    const validationResult = syncOptionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid sync options', 
        details: validationResult.error.issues 
      });
    }

    // Get connection
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.id, connectionId),
          eq(schema.calendarConnections.agentId, req.agentId!)
        )
      );

    if (connections.length === 0) {
      return res.status(404).json({ error: 'Calendar connection not found' });
    }

    const options = validationResult.data;
    
    // Convert string dates to Date objects if provided
    const syncOptions = {
      ...options,
      timeRange: options.timeRangeStart && options.timeRangeEnd ? {
        start: new Date(options.timeRangeStart),
        end: new Date(options.timeRangeEnd),
      } : undefined
    };

    const result = await calendarSyncService.syncConnection(connections[0], syncOptions);

    res.json({
      success: true,
      result,
      message: 'Connection sync completed'
    });
  } catch (error) {
    console.error('Error during connection sync:', error);
    res.status(500).json({ error: `Sync failed: ${error instanceof Error ? error.message : String(error)}` });
  }
});

// Sync specific appointment
router.post('/schema.appointments/:appointmentId/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    // Get appointment and verify it belongs to the agent
    const appointmentQuery = await db
      .select()
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.id, appointmentId),
          eq(schema.appointments.agentId, req.agentId!)
        )
      );

    if (appointmentQuery.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await calendarSyncService.syncAppointment(appointmentQuery[0]);

    res.json({
      success: true,
      message: 'Appointment synced successfully'
    });
  } catch (error) {
    console.error('Error syncing appointment:', error);
    res.status(500).json({ error: `Failed to sync appointment: ${error instanceof Error ? error.message : String(error)}` });
  }
});

/**
 * STATUS AND REPORTING ROUTES
 */

// Get sync statistics for agent
router.get('/sync/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    
    // Get all connections for the agent
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.agentId, req.agentId!));

    const stats = await Promise.all(
      connections.map(async (connection) => {
        const connectionStats = await calendarSyncService.getSyncStats(
          connection.id, 
          parseInt(days as string)
        );
        
        return {
          connectionId: connection.id,
          provider: connection.provider,
          calendarName: connection.calendarName,
          stats: connectionStats,
        };
      })
    );

    // Aggregate stats
    const totalStats = stats.reduce((acc, connectionStat) => {
      const stat = connectionStat.stats;
      acc.totalOperations += stat.totalOperations;
      acc.successful += stat.successful;
      acc.failed += stat.failed;
      acc.skipped += stat.skipped;
      acc.byOperation.create += stat.byOperation.create;
      acc.byOperation.update += stat.byOperation.update;
      acc.byOperation.delete += stat.byOperation.delete;
      acc.byOperation.sync += stat.byOperation.sync;
      acc.byDirection.crmToCalendar += stat.byDirection.crmToCalendar;
      acc.byDirection.calendarToCrm += stat.byDirection.calendarToCrm;
      
      if (!acc.lastSync || (stat.lastSync && new Date(stat.lastSync) > new Date(acc.lastSync))) {
        acc.lastSync = stat.lastSync;
      }
      
      acc.recentErrors.push(...stat.recentErrors);
      return acc;
    }, {
      totalOperations: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      byOperation: { create: 0, update: 0, delete: 0, sync: 0 },
      byDirection: { crmToCalendar: 0, calendarToCrm: 0 },
      lastSync: null,
      recentErrors: [] as any[],
    });

    // Keep only the 10 most recent errors
    totalStats.recentErrors = totalStats.recentErrors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.json({
      success: true,
      totalStats,
      connectionStats: stats,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error fetching sync stats:', error);
    res.status(500).json({ error: 'Failed to fetch sync statistics' });
  }
});

// Get sync logs for agent
router.get('/sync/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', connectionId, status, operation } = req.query;

    // Get connection IDs for the agent
    const connections = await db
      .select({ id: schema.calendarConnections.id })
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.agentId, req.agentId!));

    const connectionIds = connections.map(c => c.id);

    if (connectionIds.length === 0) {
      return res.json({ logs: [], total: 0 });
    }

    // Build query conditions
    const conditions = [
      connectionId 
        ? eq(schema.calendarSyncLogs.connectionId, connectionId as string)
        : schema.calendarSyncLogs.connectionId ? eq(schema.calendarSyncLogs.connectionId, schema.calendarSyncLogs.connectionId) : undefined
    ].filter(Boolean);

    if (status) {
      conditions.push(eq(schema.calendarSyncLogs.status, status as string));
    }

    if (operation) {
      conditions.push(eq(schema.calendarSyncLogs.operation, operation as string));
    }

    // Add connection ID filter
    conditions.push(inArray(schema.calendarSyncLogs.connectionId!, connectionIds));

    const logs = await db
      .select()
      .from(schema.calendarSyncLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.calendarSyncLogs.startedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get total count
    const totalQuery = await db
      .select({ count: schema.calendarSyncLogs.id })
      .from(schema.calendarSyncLogs)
      .where(and(...conditions));

    res.json({
      logs,
      total: totalQuery.length,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)),
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

// Get calendar sync health status with token monitoring
router.get('/health', requireAuth, async (req: Request, res: Response) => {
  try {
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.agentId, req.agentId!));

    // Get token health for each connection
    const connectionsWithTokenHealth = connections.map(connection => {
      let tokenHealth = null;
      if (connection.provider === 'google') {
        tokenHealth = googleCalendarService.getTokenHealthStatus(connection);
      }
      
      return {
        id: connection.id,
        provider: connection.provider,
        calendarName: connection.calendarName,
        syncStatus: connection.syncStatus,
        syncError: connection.syncError,
        lastSyncAt: connection.lastSyncAt,
        isActive: connection.isActive,
        autoSync: connection.autoSync,
        tokenHealth
      };
    });

    // Calculate token health summary
    const tokenHealthSummary = await tokenMaintenanceService.getTokenHealthSummary();

    const health = {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.isActive).length,
      connectedCount: connections.filter(c => c.syncStatus === 'connected').length,
      errorCount: connections.filter(c => c.syncStatus === 'error').length,
      expiredCount: connections.filter(c => c.syncStatus === 'expired').length,
      disconnectedCount: connections.filter(c => c.syncStatus === 'disconnected').length,
      autoSyncEnabled: connections.filter(c => c.autoSync).length,
      tokenHealth: tokenHealthSummary,
      providers: {
        google: connections.filter(c => c.provider === 'google').length,
        apple: connections.filter(c => c.provider === 'apple').length,
        outlook: connections.filter(c => c.provider === 'outlook').length,
      },
      lastSyncAt: connections
        .filter(c => c.lastSyncAt)
        .map(c => c.lastSyncAt!)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null,
      connections: connectionsWithTokenHealth,
    };

    const overallHealth = health.errorCount === 0 && health.connectedCount > 0 && health.expiredCount === 0 ? 'healthy' : 
                         health.connectedCount > 0 && health.expiredCount === 0 ? 'degraded' : 'error';

    res.json({
      success: true,
      health: overallHealth,
      maintenanceService: tokenMaintenanceService.getStatus(),
      ...health,
    });
  } catch (error) {
    console.error('Error fetching calendar health:', error);
    res.status(500).json({ error: 'Failed to fetch calendar health status' });
  }
});

/**
 * TOKEN MAINTENANCE AND MONITORING ROUTES
 */

// Get token health summary for all connections
router.get('/tokens/health', requireAuth, async (req: Request, res: Response) => {
  try {
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.agentId, req.agentId!));

    const tokenHealth = connections.map(connection => {
      let health = null;
      if (connection.provider === 'google') {
        health = googleCalendarService.getTokenHealthStatus(connection);
      }
      
      return {
        connectionId: connection.id,
        provider: connection.provider,
        calendarName: connection.calendarName,
        syncStatus: connection.syncStatus,
        tokenHealth: health
      };
    });
    
    const summary = await tokenMaintenanceService.getTokenHealthSummary();
    
    res.json({
      success: true,
      summary,
      connections: tokenHealth,
      maintenanceServiceStatus: tokenMaintenanceService.getStatus()
    });
  } catch (error) {
    console.error('Error fetching token health:', error);
    res.status(500).json({ error: 'Failed to fetch token health' });
  }
});

// Force token maintenance run (admin/debug endpoint)
router.post('/tokens/maintenance/run', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log(`Manual token maintenance triggered by agent: ${req.agentId}`);
    const result = await tokenMaintenanceService.runMaintenanceNow();
    
    res.json({
      success: true,
      result,
      message: 'Token maintenance completed successfully'
    });
  } catch (error) {
    console.error('Error running token maintenance:', error);
    res.status(500).json({ error: 'Token maintenance failed' });
  }
});

// Get connections needing token refresh
router.get('/tokens/expiring', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bufferMinutes = '10' } = req.query;
    const expiringConnections = await tokenMaintenanceService.getConnectionsNeedingRefresh(
      parseInt(bufferMinutes as string)
    );
    
    // Filter to current agent's connections
    const agentConnections = expiringConnections.filter(c => c.agentId === req.agentId);
    
    res.json({
      success: true,
      connections: agentConnections.map(c => ({
        id: c.id,
        provider: c.provider,
        calendarName: c.calendarName,
        tokenExpiresAt: c.tokenExpiresAt,
        syncStatus: c.syncStatus
      })),
      count: agentConnections.length,
      bufferMinutes: parseInt(bufferMinutes as string)
    });
  } catch (error) {
    console.error('Error fetching expiring tokens:', error);
    res.status(500).json({ error: 'Failed to fetch expiring tokens' });
  }
});

// Force refresh token for specific connection
router.post('/connections/:connectionId/refresh-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    
    // Get connection and verify ownership
    const connections = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.id, connectionId),
          eq(schema.calendarConnections.agentId, req.agentId!)
        )
      );

    if (connections.length === 0) {
      return res.status(404).json({ error: 'Calendar connection not found' });
    }

    const connection = connections[0];
    
    if (connection.provider === 'google') {
      const updatedConnection = await googleCalendarService.refreshAccessToken(connection);
      const tokenHealth = googleCalendarService.getTokenHealthStatus(updatedConnection);
      
      res.json({
        success: true,
        connection: {
          id: updatedConnection.id,
          provider: updatedConnection.provider,
          syncStatus: updatedConnection.syncStatus,
          tokenHealth
        },
        message: 'Token refreshed successfully'
      });
    } else {
      res.status(400).json({ error: 'Token refresh not supported for this provider' });
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * WEBHOOK ROUTES (for future real-time sync)
 */

// Google Calendar webhook (for push notifications)
router.post('/webhooks/google', async (req: Request, res: Response) => {
  try {
    // TODO: Implement Google Calendar push notification handling
    // This would be called when calendar events change on Google's side
    console.log('Google Calendar webhook received:', req.headers, req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Google webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
