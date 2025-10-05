import { db } from '../db.js';
import { 
  calendarConnections, 
  appointments, 
  calendarEvents, 
  calendarSyncLogs
} from '@shared/schema';
import { eq, and, isNull, ne, or, gte, lte } from 'drizzle-orm';
import type { 
  CalendarConnection, 
  Appointment
} from '@shared/schema';
import { googleCalendarService } from './googleCalendarService.js';
import { appleCalendarService } from './appleCalendarService.js';
import { addHours, subHours } from 'date-fns';

// Utility function for safe error message extraction
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}



// Type definitions
type SyncDirection = 'crm_to_calendar' | 'calendar_to_crm';

interface CalendarEventData {
  id?: string | null;
  uid?: string;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string } | null;
  end?: { dateTime?: string } | null;
  [key: string]: unknown;
}

interface SyncStats {
  totalOperations: number;
  successful: number;
  failed: number;
  skipped: number;
  byOperation: {
    create: number;
    update: number;
    delete: number;
    sync: number;
  };
  byDirection: {
    crmToCalendar: number;
    calendarToCrm: number;
  };
  lastSync: Date | null;
  recentErrors: Array<{
    date: Date;
    operation: string;
    status: string;
    message: string | null;
  }>;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  skipped: number;
}

interface SyncOptions {
  direction?: 'crm_to_calendar' | 'calendar_to_crm' | 'bidirectional';
  timeRange?: {
    start: Date;
    end: Date;
  };
  forceSync?: boolean; // Skip change detection
  dryRun?: boolean; // Only log what would be done
}

export class CalendarSyncService {
  private readonly DEFAULT_SYNC_WINDOW_DAYS = 90; // Sync 90 days forward and backward
  private readonly CONFLICT_THRESHOLD_MINUTES = 5; // Changes within 5 minutes are considered conflicts

  constructor() {}

  /**
   * Sync all active calendar connections for an agent
   */
  async syncAgentCalendars(
    agentId: string, 
    options: SyncOptions = {}
  ): Promise<{ [connectionId: string]: SyncResult }> {
    const results: { [connectionId: string]: SyncResult } = {};

    try {
      // Get all active calendar connections for the agent
      const connections = await db
        .select()
        .from(calendarConnections)
        .where(
          eq(calendarConnections.agentId, agentId.toString())
        );
      
      if (connections.length === 0) {
        console.log(`No active calendar connections found for agent: ${agentId}`);
        return results;
      }

      // Sync each connection
      for (const connection of connections) {
        try {
          const result = await this.syncConnection(connection, options);
          results[connection.id] = result;
        } catch (error) {
          console.error(`Failed to sync connection ${connection.id}:`, error);
          results[connection.id] = {
            success: false,
            created: 0,
            updated: 0,
            deleted: 0,
            errors: [getErrorMessage(error)],
            skipped: 0,
          };
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to sync calendars for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Sync a specific calendar connection with enhanced error handling
   */
  async syncConnection(
    connection: CalendarConnection, 
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      skipped: 0,
    };

    try {
      // Update connection sync status
      await this.updateConnectionSyncStatus(connection.id, 'syncing');

      // Check if connection is in expired state
      if (connection.syncStatus === 'expired') {
        throw new Error('Calendar connection has expired and requires re-authentication. Please reconnect your calendar.');
      }

      // Test connection first
      const isConnected = await this.testConnection(connection);
      if (!isConnected) {
        throw new Error('Calendar connection test failed');
      }

      // Determine sync direction
      const direction = options.direction || connection.syncDirection || 'bidirectional';

      // Set default time range if not provided
      const timeRange = options.timeRange || {
        start: subHours(new Date(), 24 * this.DEFAULT_SYNC_WINDOW_DAYS),
        end: addHours(new Date(), 24 * this.DEFAULT_SYNC_WINDOW_DAYS),
      };

      console.log(`Starting sync for connection ${connection.id} (${connection.provider}) - direction: ${direction}`);

      // Perform sync based on direction with enhanced error handling
      if (direction === 'crm_to_calendar' || direction === 'bidirectional') {
        try {
          const crmToCalendarResult = await this.syncCRMToCalendar(connection, timeRange, options);
          result.created += crmToCalendarResult.created;
          result.updated += crmToCalendarResult.updated;
          result.deleted += crmToCalendarResult.deleted;
          result.errors.push(...crmToCalendarResult.errors);
          result.skipped += crmToCalendarResult.skipped;
        } catch (error) {
          console.error('CRM to Calendar sync failed:', error);
          result.errors.push(`CRM to Calendar: ${getErrorMessage(error)}`);
          
          // If it's a token error, don't proceed with calendar to CRM sync
          if (this.isTokenError(error)) {
            throw error;
          }
        }
      }

      if (direction === 'calendar_to_crm' || direction === 'bidirectional') {
        try {
          const calendarToCRMResult = await this.syncCalendarToCRM(connection, timeRange, options);
          result.created += calendarToCRMResult.created;
          result.updated += calendarToCRMResult.updated;
          result.deleted += calendarToCRMResult.deleted;
          result.errors.push(...calendarToCRMResult.errors);
          result.skipped += calendarToCRMResult.skipped;
        } catch (error) {
          console.error('Calendar to CRM sync failed:', error);
          result.errors.push(`Calendar to CRM: ${getErrorMessage(error)}`);
        }
      }

      result.success = result.errors.length === 0;
      const hasTokenErrors = result.errors.some(error => 
        error.toLowerCase().includes('token') || 
        error.toLowerCase().includes('authentication') ||
        error.toLowerCase().includes('re-authentication')
      );

      // Update connection sync status
      let finalStatus = result.success ? 'connected' : 'error';
      if (hasTokenErrors) {
        if (result.errors.some(e => e.includes('re-authentication'))) {
          finalStatus = 'expired';
        }
      }
      
      await this.updateConnectionSyncStatus(
        connection.id, 
        finalStatus,
        result.errors.join('; ') || null
      );

      // Log sync completion
      await this.logSyncOperation(
        connection.id,
        null,
        'sync',
        direction as SyncDirection,
        result.success ? 'success' : 'error',
        result.errors.join('; ') || undefined
      );

      console.log(`Sync completed for connection ${connection.id}: ${result.success ? 'SUCCESS' : 'ERROR'} (${result.created} created, ${result.updated} updated, ${result.deleted} deleted, ${result.skipped} skipped, ${result.errors.length} errors)`);

      return result;
    } catch (error) {
      console.error(`Connection sync failed for ${connection.id}:`, error);
      
      result.success = false;
      result.errors.push(getErrorMessage(error));

      // Determine final status based on error type
      let finalStatus = 'error';
      if (this.isTokenError(error)) {
        if (getErrorMessage(error).includes('re-authentication')) {
          finalStatus = 'expired';
        }
      }
      
      // Update connection error status
      await this.updateConnectionSyncStatus(connection.id, finalStatus, getErrorMessage(error));

      // Log sync failure
      await this.logSyncOperation(
        connection.id,
        null,
        'sync',
        'crm_to_calendar',
        'error',
        getErrorMessage(error),
        getErrorMessage(error)
      );

      return result;
    }
  }

  /**
   * Sync CRM appointments to calendar
   */
  private async syncCRMToCalendar(
    connection: CalendarConnection,
    timeRange: { start: Date; end: Date },
    options: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      skipped: 0,
    };

    try {
      // Get appointments that need sync
      const appointmentsToSync = await this.getAppointmentsForSync(
        connection.agentId || '',
        timeRange,
        connection.provider,
        options.forceSync
      );

      console.log(`Found ${appointmentsToSync.length} appointments to sync for ${connection.provider}`);

      for (const appointment of appointmentsToSync) {
        try {
          const syncAction = await this.determineSyncAction(appointment, connection.provider);

          if (!options.dryRun) {
            switch (syncAction) {
              case 'create':
                await this.createCalendarEvent(connection, appointment);
                result.created++;
                break;
              case 'update':
                await this.updateCalendarEvent(connection, appointment);
                result.updated++;
                break;
              case 'delete':
                await this.deleteCalendarEvent(connection, appointment);
                result.deleted++;
                break;
              case 'skip':
                result.skipped++;
                break;
            }
          } else {
            console.log(`[DRY RUN] Would ${syncAction} appointment: ${appointment.title}`);
            result.skipped++;
          }
        } catch (error) {
          console.error(`Failed to sync appointment ${appointment.id}:`, error);
          result.errors.push(`Appointment ${appointment.title}: ${getErrorMessage(error)}`);
        }
      }

      return result;
    } catch (error) {
      console.error('CRM to Calendar sync failed:', error);
      result.success = false;
      result.errors.push(getErrorMessage(error));
      return result;
    }
  }

  /**
   * Sync calendar events to CRM
   */
  private async syncCalendarToCRM(
    connection: CalendarConnection,
    timeRange: { start: Date; end: Date },
    options: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      skipped: 0,
    };

    try {
      // Get calendar events
      const externalCalendarEvents = await this.getCalendarEvents(connection, timeRange);
      
      console.log(`Found ${externalCalendarEvents.length} calendar events to process`);

      for (const calendarEvent of externalCalendarEvents) {
        try {
          // Skip events that are already synced from CRM
          const eventId = calendarEvent.id || calendarEvent.uid;
          if (!eventId) {
            result.skipped++;
            continue;
          }
          
          const existingCalendarEvent = await db
            .select()
            .from(calendarEvents)
            .where(
              and(
                eq(calendarEvents.calendarConnectionId, connection.id),
                eq(calendarEvents.externalId, eventId)
              )
            );

          if (existingCalendarEvent.length > 0 && existingCalendarEvent[0].appointmentId) {
            // This event originated from CRM, skip to avoid sync loops
            result.skipped++;
            continue;
          }

          // Check if this looks like a CRM-originated event
          if (this.isAppointmentRelatedEvent(calendarEvent)) {
            result.skipped++;
            continue;
          }

          // For calendar-to-CRM sync, we typically only create inquiries or notifications
          // rather than full appointments, to avoid cluttering the CRM
          if (!options.dryRun) {
            // This could create an inquiry or notification for the agent
            // For now, we'll just log it
            console.log(`External calendar event: ${calendarEvent.summary || calendarEvent.title}`);
            result.skipped++;
          } else {
            console.log(`[DRY RUN] Would process external event: ${calendarEvent.summary || calendarEvent.title}`);
            result.skipped++;
          }
        } catch (error) {
          console.error(`Failed to process calendar event:`, error);
          result.errors.push(`Calendar event: ${getErrorMessage(error)}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Calendar to CRM sync failed:', error);
      result.success = false;
      result.errors.push(getErrorMessage(error));
      return result;
    }
  }

  /**
   * Get appointments that need syncing to calendar
   */
  private async getAppointmentsForSync(
    agentId: number | string,
    timeRange: { start: Date; end: Date },
    provider: string,
    forceSync = false
  ): Promise<Appointment[]> {
    const agentIdNum = typeof agentId === 'string' ? parseInt(agentId) : agentId;
    const conditions = [
      eq(appointments.agentId, agentIdNum),
      gte(appointments.startTime, timeRange.start),
      lte(appointments.startTime, timeRange.end),
    ];

    if (!forceSync) {
      // Only sync appointments that haven't been synced or have sync errors
      if (provider === 'google') {
        conditions.push(
          or(
            isNull(appointments.googleCalendarEventId),
            eq(appointments.calendarSyncStatus, 'error'),
            eq(appointments.calendarSyncStatus, 'pending')
          )!
        );
      } else if (provider === 'apple') {
        conditions.push(
          or(
            isNull(appointments.appleCalendarEventId),
            eq(appointments.calendarSyncStatus, 'error'),
            eq(appointments.calendarSyncStatus, 'pending')
          )!
        );
      }
    }

    return await db
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(appointments.startTime);
  }

  /**
   * Determine what sync action is needed for an appointment
   */
  private async determineSyncAction(
    appointment: Appointment,
    provider: string
  ): Promise<'create' | 'update' | 'delete' | 'skip'> {
    const eventId = provider === 'google' ? appointment.googleCalendarEventId : appointment.appleCalendarEventId;

    // If appointment is cancelled or completed and we have an event ID, delete the event
    if ((appointment.status === 'cancelled' || appointment.status === 'completed') && eventId) {
      return 'delete';
    }

    // If no event ID exists, create new event
    if (!eventId) {
      return 'create';
    }

    // If event ID exists and appointment is not cancelled/completed, update
    if (eventId && appointment.status !== 'cancelled' && appointment.status !== 'completed') {
      return 'update';
    }

    return 'skip';
  }

  /**
   * Create calendar event for appointment
   */
  private async createCalendarEvent(connection: CalendarConnection, appointment: Appointment): Promise<void> {
    if (connection.provider === 'google') {
      await googleCalendarService.createEvent(connection, appointment);
    } else if (connection.provider === 'apple') {
      await appleCalendarService.createEvent(connection, appointment);
    } else {
      throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }
  }

  /**
   * Update calendar event for appointment
   */
  private async updateCalendarEvent(connection: CalendarConnection, appointment: Appointment): Promise<void> {
    const eventId = connection.provider === 'google' 
      ? appointment.googleCalendarEventId 
      : appointment.appleCalendarEventId;

    if (!eventId) {
      throw new Error('No event ID found for update');
    }

    if (connection.provider === 'google') {
      await googleCalendarService.updateEvent(connection, appointment, eventId);
    } else if (connection.provider === 'apple') {
      await appleCalendarService.updateEvent(connection, eventId, appointment);
    } else {
      throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }
  }

  /**
   * Delete calendar event for appointment
   */
  private async deleteCalendarEvent(connection: CalendarConnection, appointment: Appointment): Promise<void> {
    const eventId = connection.provider === 'google' 
      ? appointment.googleCalendarEventId 
      : appointment.appleCalendarEventId;

    if (!eventId) {
      console.log('No event ID found for deletion, skipping');
      return;
    }

    if (connection.provider === 'google') {
      await googleCalendarService.deleteEvent(connection, eventId, appointment.id.toString());
    } else if (connection.provider === 'apple') {
      await appleCalendarService.deleteEvent(connection, eventId, appointment.id);
    } else {
      throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }
  }

  /**
   * Get calendar events from external calendar
   */
  private async getCalendarEvents(
    connection: CalendarConnection,
    timeRange: { start: Date; end: Date }
  ): Promise<CalendarEventData[]> {
    if (connection.provider === 'google') {
      const events = await googleCalendarService.getEvents(connection, timeRange.start, timeRange.end);
      return events as CalendarEventData[];
    } else if (connection.provider === 'apple') {
      return await appleCalendarService.getEvents(connection, timeRange.start, timeRange.end);
    } else {
      throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }
  }

  /**
   * Check if a calendar event is related to CRM appointments
   */
  private isAppointmentRelatedEvent(event: CalendarEventData): boolean {
    const description = typeof event.description === 'string' ? event.description : '';
    const summary = typeof event.summary === 'string' ? event.summary : (typeof event.title === 'string' ? event.title : '');
    
    // Check for CRM signature in description
    if (description.includes('Bodensee Immobilien Müller CRM')) {
      return true;
    }

    // Check for appointment-related keywords
    const appointmentKeywords = [
      'besichtigung', 'beratung', 'bewertung', 'vertragsunterzeichnung',
      'property viewing', 'consultation', 'valuation', 'contract signing'
    ];

    return appointmentKeywords.some(keyword => {
      const summaryMatch = summary.toLowerCase().includes(keyword);
      const descriptionMatch = description.toLowerCase().includes(keyword);
      return summaryMatch || descriptionMatch;
    });
  }

  /**
   * Test calendar connection with enhanced error handling
   */
  private async testConnection(connection: CalendarConnection): Promise<boolean> {
    try {
      if (connection.provider === 'google') {
        return await googleCalendarService.testConnection(connection);
      } else if (connection.provider === 'apple') {
        return await appleCalendarService.testConnection(connection);
      } else {
        await this.updateConnectionSyncStatus(connection.id, 'error', `Unsupported provider: ${connection.provider}`);
        return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${connection.id}:`, error);
      
      const errorMessage = getErrorMessage(error);
      
      // Check if this is a token-related error
      if (this.isTokenError(error)) {
        if (errorMessage.includes('re-authentication')) {
          await this.updateConnectionSyncStatus(connection.id, 'expired', errorMessage);
        } else {
          await this.updateConnectionSyncStatus(connection.id, 'error', `Token error: ${errorMessage}`);
        }
      } else {
        await this.updateConnectionSyncStatus(connection.id, 'error', `Connection test failed: ${errorMessage}`);
      }
      
      return false;
    }
  }

  /**
   * Check if error is token-related
   */
  private isTokenError(error: unknown): boolean {
    const errorMessage = getErrorMessage(error).toLowerCase();
    const hasStatusCode = error && typeof error === 'object' && 'status' in error;
    const status = hasStatusCode ? (error as { status: number }).status : null;
    
    return (
      errorMessage.includes('token') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('authorization') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('invalid_grant') ||
      status === 401 ||
      status === 403
    );
  }

  /**
   * Update connection sync status
   */
  private async updateConnectionSyncStatus(
    connectionId: number,
    status: string,
    error?: string | null
  ): Promise<void> {
    await db
      .update(calendarConnections)
      .set({
        syncStatus: status,
        syncError: error,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connectionId));
  }

  /**
   * Sync specific appointment immediately
   */
  async syncAppointment(appointment: Appointment): Promise<void> {
    try {
      // Get all active connections for the agent
      const connections = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.agentId, appointment.agentId?.toString() || ''),
            eq(calendarConnections.isActive, true),
            ne(calendarConnections.syncStatus, 'disconnected')
          )
        );

      for (const connection of connections) {
        try {
          const syncAction = await this.determineSyncAction(appointment, connection.provider);

          switch (syncAction) {
            case 'create':
              await this.createCalendarEvent(connection, appointment);
              break;
            case 'update':
              await this.updateCalendarEvent(connection, appointment);
              break;
            case 'delete':
              await this.deleteCalendarEvent(connection, appointment);
              break;
          }
        } catch (error) {
          console.error(`Failed to sync appointment ${appointment.id} to ${connection.provider}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to sync appointment ${appointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule automatic sync for all active connections
   */
  async scheduleAutoSync(): Promise<void> {
    try {
      // Get all connections with auto-sync enabled
      const autoSyncConnections = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.isActive, true),
            eq(calendarConnections.autoSync, true),
            ne(calendarConnections.syncStatus, 'disconnected')
          )
        );

      console.log(`Starting auto-sync for ${autoSyncConnections.length} connections`);

      // Group connections by agent for more efficient syncing
      const connectionsByAgent = autoSyncConnections.reduce((acc, connection) => {
        const agentId = connection.agentId || 'unknown';
        if (!acc[agentId]) {
          acc[agentId] = [];
        }
        acc[agentId].push(connection);
        return acc;
      }, {} as { [agentId: string]: CalendarConnection[] });

      // Sync each agent's calendars
      for (const agentId of Object.keys(connectionsByAgent)) {
        try {
          await this.syncAgentCalendars(agentId, {
            direction: 'bidirectional',
            forceSync: false,
          });
        } catch (error) {
          console.error(`Auto-sync failed for agent ${agentId}:`, error);
        }
      }

      console.log('Auto-sync completed');
    } catch (error) {
      console.error('Auto-sync scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Log sync operation
   */
  private async logSyncOperation(
    connectionId: number | null,
    appointmentId: number | null,
    operation: 'create' | 'update' | 'delete' | 'sync',
    direction: 'crm_to_calendar' | 'calendar_to_crm',
    status: 'success' | 'error' | 'skipped',
    errorMessage?: string,
    errorDetails?: unknown
  ): Promise<void> {
    try {
      const logData = {
        calendarConnectionId: connectionId,
        syncType: operation,
        status,
        message: errorMessage || null,
        errorDetails: errorDetails ? String(errorDetails) : null,
        operation,
      };

      await db.insert(calendarSyncLogs).values(logData);
    } catch (error) {
      console.error('Failed to log sync operation:', error);
    }
  }

  /**
   * Get sync statistics for a connection
   */
  async getSyncStats(connectionId: number, days = 30): Promise<SyncStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await db
      .select()
      .from(calendarSyncLogs)
      .where(
        and(
          eq(calendarSyncLogs.connectionId, connectionId),
          gte(calendarSyncLogs.startedAt, since)
        )
      );

    const stats = {
      totalOperations: logs.length,
      successful: logs.filter(log => log.status === 'success').length,
      failed: logs.filter(log => log.status === 'error').length,
      skipped: logs.filter(log => log.status === 'skipped').length,
      byOperation: {
        create: logs.filter(log => log.operation === 'create').length,
        update: logs.filter(log => log.operation === 'update').length,
        delete: logs.filter(log => log.operation === 'delete').length,
        sync: logs.filter(log => log.operation === 'sync').length,
      },
      byDirection: {
        crmToCalendar: logs.filter(log => log.syncType === 'export').length,
        calendarToCrm: logs.filter(log => log.syncType === 'import').length,
      },
      lastSync: logs.length > 0 ? logs[logs.length - 1].startedAt : null,
      recentErrors: logs
        .filter(log => log.status === 'error')
        .slice(-5)
        .map(log => ({
          date: log.createdAt,
          operation: log.operation || 'unknown',
          status: log.status,
          message: log.errorDetails,
        })),
    };

    return stats;
  }
}

export const calendarSyncService = new CalendarSyncService();