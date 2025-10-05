import { db } from '../db.js';
import { eq, and, ne, lt, isNotNull } from 'drizzle-orm';
import type { CalendarConnection } from '@shared/schema';
import { calendarConnections } from '@shared/schema';
import { googleCalendarService } from './googleCalendarService.js';
import { NotificationService } from './notificationService.js';

interface TokenMaintenanceResult {
  checked: number;
  refreshed: number;
  expired: number;
  errors: number;
  summary: {
    healthy: number;
    expiring_soon: number;
    expired: number;
    invalid: number;
  };
}

interface MaintenanceError {
  connectionId: number;
  provider: string;
  agentId: string | null;
  error: string;
  requiresReauth: boolean;
}

/**
 * Service for maintaining calendar authentication tokens
 * Performs proactive token refresh and health monitoring
 */
export class TokenMaintenanceService {
  private readonly TOKEN_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes
  private readonly TOKEN_REFRESH_BUFFER_MINUTES = 10; // Refresh tokens 10 minutes before expiry
  private readonly BATCH_SIZE = 50; // Process connections in batches
  
  private maintenanceTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {}

  /**
   * Start the background token maintenance service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Token maintenance service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting token maintenance service...');
    
    // Run immediately on start
    this.runMaintenance().catch(() => {
      // console.error('Initial token maintenance failed:');
    });
    
    // Schedule periodic maintenance
    this.maintenanceTimer = setInterval(() => {
      this.runMaintenance().catch(() => {
        // console.error('Scheduled token maintenance failed:');
      });
    }, this.TOKEN_CHECK_INTERVAL_MS);
    
    console.log(`Token maintenance service started - checking every ${this.TOKEN_CHECK_INTERVAL_MS / 60000} minutes`);
  }

  /**
   * Stop the background token maintenance service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = null;
    }
    
    this.isRunning = false;
    console.log('Token maintenance service stopped');
  }

  /**
   * Run maintenance for a specific agent's connections
   * @param agentId - The ID of the agent
   * @returns A list of connections that were refreshed or expired
   */
  async runMaintenanceJobForAgent(agentId: string): Promise<CalendarConnection[]> {
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.agentId, agentId));

    const refreshedConnections: CalendarConnection[] = [];

    for (const connection of connections) {
      if (this.isTokenExpiring(connection)) {
        try {
          const refreshed = await googleCalendarService.refreshAccessToken(connection);
          refreshedConnections.push(refreshed);
        } catch (e) {
          console.error(`Failed to refresh token for connection ${connection.id} of agent ${agentId}:`, e);
        }
      }
    }
    return refreshedConnections;
  }

  /**
   * Run the full maintenance job for all connections
   * @returns A summary of the maintenance job
   */
  private async runMaintenance(): Promise<TokenMaintenanceResult> {
    const startTime = Date.now();
    console.log('Starting token maintenance cycle...');
    
    const result: TokenMaintenanceResult = {
      checked: 0,
      refreshed: 0,
      expired: 0,
      errors: 0,
      summary: {
        healthy: 0,
        expiring_soon: 0,
        expired: 0,
        invalid: 0
      }
    };

    try {
      // Get all active calendar connections
      const connections = await this.getActiveConnections();
      result.checked = connections.length;
      
      if (connections.length === 0) {
        console.log('No active calendar connections found');
        return result;
      }

      console.log(`Checking ${connections.length} calendar connections for token maintenance`);
      
      // Process connections in batches to avoid overwhelming the system
      const batches = this.createBatches(connections, this.BATCH_SIZE);
      const maintenanceErrors: MaintenanceError[] = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} connections)`);
        
        const batchPromises = batch.map(connection => 
          this.maintainConnection(connection).catch(error => ({
            connectionId: connection.id,
            provider: connection.provider,
            agentId: connection.agentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            requiresReauth: (error instanceof Error ? error.message : 'Unknown error').includes('re-authentication')
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Process batch results
        for (const batchResult of batchResults) {
          if (typeof batchResult === 'string') {
            // Success - batchResult is the action taken
            if (batchResult === 'refreshed') result.refreshed++;
            else if (batchResult === 'expired') result.expired++;
          } else {
            // Error - batchResult is MaintenanceError
            result.errors++;
            maintenanceErrors.push(batchResult);
          }
        }
        
        // Small delay between batches to be gentle on APIs
        if (i < batches.length - 1) {
          await this.delay(1000);
        }
      }

      // Get health summary
      result.summary = await this.getTokenHealthSummary();
      
      // Log maintenance errors
      if (maintenanceErrors.length > 0) {
        console.error(`Token maintenance completed with ${maintenanceErrors.length} errors:`);
        maintenanceErrors.forEach(error => {
          console.error(`  - Connection ${error.connectionId} (${error.provider}): ${error.error}`);
        });
        
        // Send notifications for connections requiring re-authentication
        const reauthRequired = maintenanceErrors.filter(e => e.requiresReauth);
        if (reauthRequired.length > 0) {
          await this.notifyReauthRequired(reauthRequired);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Token maintenance cycle completed in ${duration}ms:`, {
        checked: result.checked,
        refreshed: result.refreshed,
        expired: result.expired,
        errors: result.errors,
        summary: result.summary
      });

      return result;
    } catch (e) {
      console.error('Token maintenance cycle failed:', e);
      throw e;
    }
  }

  /**
   * Maintain a single calendar connection
   */
  private async maintainConnection(connection: CalendarConnection): Promise<string> {
    try {
      // Get token health status
      let healthStatus;
      if (connection.provider === 'google') {
        healthStatus = googleCalendarService.getTokenHealthStatus(connection);
      } else if (connection.provider === 'apple') {
        // TODO: Implement for Apple when available
        return 'skipped';
      } else {
        return 'skipped';
      }

      // Handle based on token status
      if (healthStatus.status === 'expired' || healthStatus.needsRefresh) {
        if (!healthStatus.canRefresh) {
          // Mark connection as requiring re-authentication
          await this.markConnectionExpired(connection, 'Refresh token not available - re-authentication required');
          throw new Error(`Connection ${connection.id} requires re-authentication: no refresh token available`);
        }
        
        // Attempt token refresh
        if (connection.provider === 'google') {
          await googleCalendarService.refreshAccessToken(connection);
          console.log(`Refreshed token for Google connection ${connection.id} (agent: ${connection.agentId})`);
          return 'refreshed';
        }
      } else if (healthStatus.status === 'healthy') {
        // Update last sync time to indicate connection was checked
        await db
          .update(calendarConnections)
          .set({
            lastSyncAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(calendarConnections.id, connection.id));
        
        return 'healthy';
      }

      return 'no_action';
    } catch (e) {
      console.error(`Token maintenance failed for connection ${connection.id}:`, e);
      
      // Update connection with error status
      const errorMessage = e instanceof Error ? e.message : String(e);
      await this.markConnectionError(connection, errorMessage);
      
      throw e;
    }
  }

  /**
   * Get all active calendar connections that need token maintenance
   */
  private async getActiveConnections(): Promise<CalendarConnection[]> {
    try {
      return await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.isActive, true),
            ne(calendarConnections.syncStatus, 'disconnected'),
            isNotNull(calendarConnections.accessToken)
          )
        );
    } catch (error) {
      console.log('No calendar connections table found, returning empty array');
      return [];
    }
  }

  /**
   * Get connections that need token refresh soon
   */
  async getConnectionsNeedingRefresh(bufferMinutes: number = 10): Promise<CalendarConnection[]> {
    const refreshThreshold = new Date(Date.now() + (bufferMinutes * 60 * 1000));
    
    return await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.isActive, true),
          ne(calendarConnections.syncStatus, 'disconnected'),
          ne(calendarConnections.syncStatus, 'expired'),
          isNotNull(calendarConnections.accessToken),
          isNotNull(calendarConnections.refreshToken),
          lt(calendarConnections.tokenExpiresAt, refreshThreshold)
        )
      );
  }

  /**
   * Get expired connections
   */
  async getExpiredConnections(): Promise<CalendarConnection[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.isActive, true),
          ne(calendarConnections.syncStatus, 'disconnected'),
          isNotNull(calendarConnections.accessToken),
          lt(calendarConnections.tokenExpiresAt, now)
        )
      );
  }

  /**
   * Get token health summary across all connections
   */
  async getTokenHealthSummary(): Promise<{
    healthy: number;
    expiring_soon: number;
    expired: number;
    invalid: number;
  }> {
    const connections = await this.getActiveConnections();
    const summary = {
      healthy: 0,
      expiring_soon: 0,
      expired: 0,
      invalid: 0
    };

    for (const connection of connections) {
      try {
        let healthStatus;
        if (connection.provider === 'google') {
          healthStatus = googleCalendarService.getTokenHealthStatus(connection);
        } else {
          continue; // Skip non-Google connections for now
        }

        summary[healthStatus.status]++;
      } catch (e) {
        console.error('Error validating token:', e);
        summary.invalid++;
      }
    }

    return summary;
  }

  /**
   * Mark connection as expired and requiring re-authentication
   */
  private async markConnectionExpired(connection: CalendarConnection, reason: string): Promise<void> {
    await db
      .update(calendarConnections)
      .set({
        syncStatus: 'expired',
        syncError: reason,
        updatedAt: new Date()
      })
      .where(eq(calendarConnections.id, connection.id));
  }

  /**
   * Mark connection with error status
   */
  private async markConnectionError(connection: CalendarConnection, error: string): Promise<void> {
    await db
      .update(calendarConnections)
      .set({
        syncStatus: 'error',
        syncError: `Token maintenance failed: ${error}`,
        updatedAt: new Date()
      })
      .where(eq(calendarConnections.id, connection.id));
  }

  /**
   * Notify administrators about connections requiring re-authentication
   */
  private async notifyReauthRequired(errors: MaintenanceError[]): Promise<void> {
    console.log(`Sending re-authentication notifications for ${errors.length} connections...`);
    
    for (const error of errors) {
      try {
        // Sende Notification über den NotificationService
        await NotificationService.send({
          type: 'token_expiration',
          title: `Kalender-Verbindung erfordert Re-Authentifizierung`,
          message: `Die ${error.provider}-Kalender-Verbindung (ID: ${error.connectionId}, Agent: ${error.agentId || 'N/A'}) erfordert eine erneute Authentifizierung. Fehler: ${error.error}`,
          severity: 'warning',
          metadata: {
            connectionId: error.connectionId,
            provider: error.provider,
            agentId: error.agentId,
            error: error.error,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.log(`✅ Notification sent for connection ${error.connectionId}`);
      } catch (notificationError) {
        console.error(`❌ Failed to send notification for connection ${error.connectionId}:`, notificationError);
      }
    }
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    checkIntervalMinutes: number;
    nextCheckIn?: number;
  } {
    return {
      isRunning: this.isRunning,
      checkIntervalMinutes: this.TOKEN_CHECK_INTERVAL_MS / 60000,
      nextCheckIn: this.maintenanceTimer ? this.TOKEN_CHECK_INTERVAL_MS : undefined
    };
  }

  /**
   * Force maintenance run (for testing/admin purposes)
   */
  async runMaintenanceNow(): Promise<TokenMaintenanceResult> {
    console.log('Running token maintenance on demand...');
    return await this.runMaintenance();
  }

  /**
   * Refresh token for a single connection
   * @param connectionId - The ID of the connection
   * @param agentId - The ID of the agent owning the connection
   * @returns The updated calendar connection
   */
  async refreshTokenForConnection(connectionId: number, agentId: string): Promise<CalendarConnection> {
    const connection = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.id, connectionId),
        eq(calendarConnections.agentId, agentId)
      ),
    });

    if (!connection) {
      throw new Error('Connection not found or does not belong to the agent');
    }

    if (connection.provider === 'google') {
      return googleCalendarService.refreshToken(connection);
    } else {
      // Apple Calendar (CalDAV) does not use refresh tokens
      console.log(`Skipping token refresh for Apple connection ${connection.id}`);
      return connection;
    }
  }

  /**
   * Check if a token is expiring soon
   * @param connection - The calendar connection
   * @returns True if the token is expiring soon
   */
  private isTokenExpiring(connection: CalendarConnection): boolean {
    if (connection.provider !== 'google' || !connection.tokenExpiresAt) {
      return false;
    }

    const expiryTime = new Date(connection.tokenExpiresAt).getTime();
    const bufferTime = this.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000;
    return expiryTime - Date.now() < bufferTime;
  }
}

export const tokenMaintenanceService = new TokenMaintenanceService();