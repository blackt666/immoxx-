import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import type { Appointment, InsertCalendarSyncLog } from '@shared/schema';
import { appointments, calendarEvents, calendarSyncLogs } from '@shared/schema';
import { isAfter, differenceInMinutes } from 'date-fns';
import { log } from '../lib/logger.js';

// Type for external calendar event data (Google/Apple)
export interface CalendarEventData {
  id?: string;
  title?: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  location?: string;
  lastModified?: Date;
  [key: string]: unknown;
}

export interface SyncConflict {
  id: string;
  type: 'data_mismatch' | 'timing_conflict' | 'deletion_conflict' | 'duplicate_event';
  appointmentId?: string;
  calendarEventId?: string;
  crmData?: Partial<Appointment>;
  calendarData?: CalendarEventData;
  conflictDetails: {
    field?: string;
    crmValue?: unknown;
    calendarValue?: unknown;
    lastCrmUpdate?: Date;
    lastCalendarUpdate?: Date;
    timeDifference?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution: 'crm_wins' | 'calendar_wins' | 'newest_wins' | 'merge' | 'manual_review';
  createdAt: Date;
}

export interface ConflictResolutionStrategy {
  strategy: 'crm_wins' | 'calendar_wins' | 'newest_wins' | 'merge' | 'manual_review';
  autoResolve: boolean;
  requiredApproval?: string; // User ID who can approve
  resolutionRules?: {
    fieldPriority?: { [field: string]: 'crm' | 'calendar' | 'newest' };
    timeThreshold?: number; // Minutes - conflicts within this time are considered simultaneous
    criticalFields?: string[]; // Fields that require manual review if conflicted
  };
}

export class CalendarConflictResolver {
  private readonly DEFAULT_TIME_THRESHOLD = 5; // 5 minutes
  private readonly CRITICAL_FIELDS = ['startTime', 'customerId', 'propertyId'];

  constructor() {}

  /**
   * Detect conflicts between CRM appointment and calendar event
   */
  async detectConflicts(
    appointment: Appointment,
    calendarEvent: CalendarEventData,
    provider: 'google' | 'apple'
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    try {
      // Normalize calendar event data based on provider
      const normalizedEvent = this.normalizeCalendarEvent(calendarEvent, provider);

      // Check for timing conflicts
      const timingConflict = this.detectTimingConflict(appointment, normalizedEvent);
      if (timingConflict) {
        conflicts.push(timingConflict);
      }

      // Check for data mismatches
      const dataMismatches = this.detectDataMismatches(appointment, normalizedEvent);
      conflicts.push(...dataMismatches);

      // Check for duplicate events
      const duplicateConflict = await this.detectDuplicateEvents(appointment, normalizedEvent);
      if (duplicateConflict) {
        conflicts.push(duplicateConflict);
      }

      return conflicts;
    } catch (error) {
      log.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve conflicts based on strategy
   */
  async resolveConflicts(
    conflicts: SyncConflict[],
    strategy: ConflictResolutionStrategy,
    resolvedBy?: string
  ): Promise<{ resolved: SyncConflict[]; pending: SyncConflict[] }> {
    const resolved: SyncConflict[] = [];
    const pending: SyncConflict[] = [];

    for (const conflict of conflicts) {
      try {
        const canAutoResolve = this.canAutoResolve(conflict, strategy);

        if (canAutoResolve && strategy.autoResolve) {
          const resolutionResult = await this.applyResolution(conflict, strategy);
          if (resolutionResult.success) {
            resolved.push({ ...conflict, suggestedResolution: resolutionResult.appliedStrategy as SyncConflict['suggestedResolution'] });

            // Log resolution
            await this.logConflictResolution(conflict, strategy, 'auto', resolvedBy);
          } else {
            pending.push(conflict);
          }
        } else {
          // Requires manual review
          pending.push({ ...conflict, suggestedResolution: 'manual_review' });

          // Log pending review
          await this.logConflictResolution(conflict, strategy, 'pending', resolvedBy);
        }
      } catch (error) {
        log.error(`Error resolving conflict ${conflict.id}:`, error);
        pending.push(conflict);
      }
    }

    return { resolved, pending };
  }

  /**
   * Apply resolution strategy to a specific conflict
   */
  private async applyResolution(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; appliedStrategy: string }> {
    try {
      switch (conflict.type) {
        case 'timing_conflict':
          return await this.resolveTimingConflict(conflict, strategy);
        case 'data_mismatch':
          return await this.resolveDataMismatch(conflict, strategy);
        case 'duplicate_event':
          return await this.resolveDuplicateEvent();
        case 'deletion_conflict':
          return await this.resolveDeletionConflict();
        default:
          return { success: false, appliedStrategy: 'unknown' };
      }
    } catch (error) {
      log.error('Error applying resolution:', error);
      return { success: false, appliedStrategy: 'error' };
    }
  }

  /**
   * Detect timing conflicts between appointment and calendar event
   */
  private detectTimingConflict(appointment: Appointment, calendarEvent: CalendarEventData): SyncConflict | null {
    if (!calendarEvent.startTime || !calendarEvent.endTime) return null;
    
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);

    const eventStart = new Date(calendarEvent.startTime);
    const eventEnd = new Date(calendarEvent.endTime);

    // Check if there's a significant time difference
    const startDiff = Math.abs(differenceInMinutes(appointmentStart, eventStart));
    const endDiff = Math.abs(differenceInMinutes(appointmentEnd, eventEnd));

    if (startDiff > this.DEFAULT_TIME_THRESHOLD || endDiff > this.DEFAULT_TIME_THRESHOLD) {
      return {
        id: `timing_${appointment.id}_${Date.now()}`,
        type: 'timing_conflict',
        appointmentId: String(appointment.id),
        crmData: appointment,
        calendarData: calendarEvent,
        conflictDetails: {
          field: 'timing',
          crmValue: { start: appointmentStart, end: appointmentEnd },
          calendarValue: { start: eventStart, end: eventEnd },
          timeDifference: Math.max(startDiff, endDiff),
        },
        severity: startDiff > 60 || endDiff > 60 ? 'high' : 'medium',
        suggestedResolution: 'newest_wins',
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Detect data mismatches between appointment and calendar event
   */
  private detectDataMismatches(appointment: Appointment, calendarEvent: CalendarEventData): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    // Title/Summary mismatch
    if (appointment.title !== calendarEvent.title) {
      conflicts.push({
        id: `title_${appointment.id}_${Date.now()}`,
        type: 'data_mismatch',
        appointmentId: String(appointment.id),
        crmData: appointment,
        calendarData: calendarEvent,
        conflictDetails: {
          field: 'title',
          crmValue: appointment.title,
          calendarValue: calendarEvent.title,
        },
        severity: 'low',
        suggestedResolution: 'crm_wins',
        createdAt: new Date(),
      });
    }

    // Location mismatch
    if (appointment.location !== calendarEvent.location) {
      conflicts.push({
        id: `location_${appointment.id}_${Date.now()}`,
        type: 'data_mismatch',
        appointmentId: String(appointment.id),
        crmData: appointment,
        calendarData: calendarEvent,
        conflictDetails: {
          field: 'location',
          crmValue: appointment.location,
          calendarValue: calendarEvent.location,
        },
        severity: 'medium',
        suggestedResolution: 'crm_wins',
        createdAt: new Date(),
      });
    }

    // Description/Notes mismatch
    if (appointment.notes !== calendarEvent.description) {
      conflicts.push({
        id: `description_${appointment.id}_${Date.now()}`,
        type: 'data_mismatch',
        appointmentId: String(appointment.id),
        crmData: appointment,
        calendarData: calendarEvent,
        conflictDetails: {
          field: 'description',
          crmValue: appointment.notes,
          calendarValue: calendarEvent.description,
        },
        severity: 'low',
        suggestedResolution: 'merge',
        createdAt: new Date(),
      });
    }

    return conflicts;
  }

  /**
   * Detect duplicate events in calendar
   */
  private async detectDuplicateEvents(appointment: Appointment, calendarEvent: CalendarEventData): Promise<SyncConflict | null> {
    try {
      // Check if there are existing calendar events for the same appointment
      const existingEvents = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.appointmentId, appointment.id));

      if (existingEvents.length > 1) {
        return {
          id: `duplicate_${appointment.id}_${Date.now()}`,
          type: 'duplicate_event',
          appointmentId: String(appointment.id),
          crmData: appointment,
          calendarData: calendarEvent,
          conflictDetails: {
            field: 'duplicate_events',
            crmValue: 1,
            calendarValue: existingEvents.length,
          },
          severity: 'medium',
          suggestedResolution: 'manual_review',
          createdAt: new Date(),
        };
      }

      return null;
    } catch (error) {
      log.error('Error detecting duplicate events:', error);
      return null;
    }
  }

  /**
   * Normalize calendar event data across providers
   */
  private normalizeCalendarEvent(calendarEvent: CalendarEventData, provider: 'google' | 'apple'): CalendarEventData {
    if (provider === 'google') {
      const start = calendarEvent.start as { dateTime?: string; date?: string } | undefined;
      const end = calendarEvent.end as { dateTime?: string; date?: string } | undefined;
      return {
        id: calendarEvent.id,
        title: calendarEvent.summary as string | undefined,
        description: calendarEvent.description as string | undefined,
        startTime: start?.dateTime || start?.date,
        endTime: end?.dateTime || end?.date,
        location: calendarEvent.location as string | undefined,
        status: calendarEvent.status as string | undefined,
      };
    } else if (provider === 'apple') {
      return {
        id: calendarEvent.uid as string | undefined,
        title: calendarEvent.summary as string | undefined,
        description: calendarEvent.description as string | undefined,
        startTime: calendarEvent.dtstart as string | Date | undefined,
        endTime: calendarEvent.dtend as string | Date | undefined,
        location: calendarEvent.location as string | undefined,
        status: calendarEvent.status as string | undefined,
      };
    }

    return calendarEvent;
  }

  /**
   * Check if conflict can be auto-resolved
   */
  private canAutoResolve(conflict: SyncConflict, strategy: ConflictResolutionStrategy): boolean {
    // Critical conflicts always require manual review
    if (conflict.severity === 'critical') {
      return false;
    }

    // Check if conflict involves critical fields
    if (strategy.resolutionRules?.criticalFields?.includes(conflict.conflictDetails.field || '')) {
      return false;
    }

    // Duplicate events typically require manual review
    if (conflict.type === 'duplicate_event') {
      return false;
    }

    return true;
  }

  /**
   * Resolve timing conflicts
   */
  private async resolveTimingConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; appliedStrategy: string }> {
    const resolution = strategy.strategy;
    
    if (!conflict.appointmentId) {
      return { success: false, appliedStrategy: 'missing_data' };
    }

    try {
      switch (resolution) {
        case 'crm_wins':
          // Keep CRM timing, update calendar
          return { success: true, appliedStrategy: 'crm_wins' };
        
        case 'calendar_wins':
          // Update CRM with calendar timing
          const calendarData = conflict.calendarData;
          if (conflict.appointmentId && calendarData?.startTime && calendarData?.endTime) {
            await db
              .update(appointments)
              .set({
                startTime: new Date(calendarData.startTime),
                endTime: new Date(calendarData.endTime),
                updatedAt: new Date(),
              })
              .where(eq(appointments.id, parseInt(conflict.appointmentId)));
          }
          return { success: true, appliedStrategy: 'calendar_wins' };
        
        case 'newest_wins':
          // Compare timestamps and use newest
          const appointmentUpdate = conflict.crmData?.updatedAt || conflict.crmData?.createdAt;
          const calendarUpdate = conflict.calendarData?.lastModified || new Date();
          
          if (appointmentUpdate && isAfter(appointmentUpdate, calendarUpdate)) {
            return { success: true, appliedStrategy: 'crm_wins' };
          } else {
            return await this.resolveTimingConflict(conflict, { ...strategy, strategy: 'calendar_wins' });
          }
        
        default:
          return { success: false, appliedStrategy: 'unsupported_strategy' };
      }
    } catch (error) {
      log.error('Error resolving timing conflict:', error);
      return { success: false, appliedStrategy: 'error' };
    }
  }

  /**
   * Resolve data mismatches
   */
  private async resolveDataMismatch(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; appliedStrategy: string }> {
    if (!conflict.appointmentId) {
      return { success: false, appliedStrategy: 'missing_data' };
    }

    try {
      const field = conflict.conflictDetails.field;
      const crmValue = conflict.conflictDetails.crmValue;
      const calendarValue = conflict.conflictDetails.calendarValue;

      // Check field-specific priority rules
      const fieldPriority = strategy.resolutionRules?.fieldPriority?.[field!];
      let resolution = strategy.strategy;

      if (fieldPriority) {
        resolution = fieldPriority === 'crm' ? 'crm_wins' : 
                    fieldPriority === 'calendar' ? 'calendar_wins' : 'newest_wins';
      }

      switch (resolution) {
        case 'crm_wins':
          // Keep CRM value, update calendar
          return { success: true, appliedStrategy: 'crm_wins' };
        
        case 'calendar_wins':
          // Update CRM with calendar value
          const updateData: Record<string, unknown> = {};
          if (field === 'title') updateData.title = calendarValue;
          if (field === 'location') updateData.location = calendarValue;
          if (field === 'description') updateData.notes = calendarValue;
          
          if (Object.keys(updateData).length > 0 && conflict.appointmentId) {
            updateData.updatedAt = new Date();
            await db
              .update(appointments)
              .set(updateData as Partial<Appointment>)
              .where(eq(appointments.id, parseInt(conflict.appointmentId)));
          }
          
          return { success: true, appliedStrategy: 'calendar_wins' };
        
        case 'merge':
          // Merge values (for text fields)
          if (field === 'description' && crmValue && calendarValue && conflict.appointmentId) {
            const mergedValue = `${crmValue}\n\n[Calendar Note: ${calendarValue}]`;
            await db
              .update(appointments)
              .set({
                notes: mergedValue,
                updatedAt: new Date(),
              })
              .where(eq(appointments.id, parseInt(conflict.appointmentId)));
            return { success: true, appliedStrategy: 'merge' };
          }
          // Fall back to CRM wins for non-mergeable fields
          return { success: true, appliedStrategy: 'crm_wins' };
        
        default:
          return { success: false, appliedStrategy: 'unsupported_strategy' };
      }
    } catch (error) {
      log.error('Error resolving data mismatch:', error);
      return { success: false, appliedStrategy: 'error' };
    }
  }

  /**
   * Resolve duplicate events
   */
  private async resolveDuplicateEvent(): Promise<{ success: boolean; appliedStrategy: string }> {
    // Duplicate events typically require manual review
    // For now, we'll just log and mark for manual resolution
    return { success: false, appliedStrategy: 'manual_review_required' };
  }

  /**
   * Resolve deletion conflicts
   */
  private async resolveDeletionConflict(): Promise<{ success: boolean; appliedStrategy: string }> {
    // Deletion conflicts are complex and usually require manual review
    return { success: false, appliedStrategy: 'manual_review_required' };
  }

  /**
   * Log conflict resolution
   */
  private async logConflictResolution(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy,
    result: 'auto' | 'pending' | 'manual',
    resolvedBy?: string
  ): Promise<void> {
    try {
      const logData: InsertCalendarSyncLog = {
        connectionId: null, // Conflict resolution is cross-connection
        syncType: 'export',
        operation: 'sync',
        status: result === 'auto' ? 'success' : 'error',
        message: result === 'pending' ? 'Conflict requires manual resolution' : 'Conflict resolved',
        dataSnapshot: JSON.stringify({
          conflict,
          strategy,
          result,
          resolvedBy,
          appointmentId: conflict.appointmentId,
        }),
      };

      await db.insert(calendarSyncLogs).values(logData);
    } catch (error) {
      log.error('Failed to log conflict resolution:', error);
    }
  }

  /**
   * Get statistics about conflicts over the last 30 days
   */
  async getConflictStats(): Promise<{
    totalConflicts: number;
    autoResolved: number;
    manualResolution: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolutionStrategies: Record<string, number>;
  } | null> {
    try {
      const logs = await db
        .select()
        .from(calendarSyncLogs)
        .where(eq(calendarSyncLogs.operation, 'sync'));

      const conflictLogs = logs.filter(log => {
        if (!log.dataSnapshot) return false;
        try {
          const snapshot = JSON.parse(log.dataSnapshot);
          return snapshot && typeof snapshot === 'object' && 'conflict' in snapshot;
        } catch {
          return false;
        }
      });

      const getDataSnapshot = (log: typeof logs[0]): Record<string, unknown> | null => {
        if (!log.dataSnapshot) return null;
        try {
          return JSON.parse(log.dataSnapshot) as Record<string, unknown>;
        } catch {
          return null;
        }
      };

      const stats = {
        totalConflicts: conflictLogs.length,
        autoResolved: conflictLogs.filter(log => getDataSnapshot(log)?.result === 'auto').length,
        manualResolution: conflictLogs.filter(log => getDataSnapshot(log)?.result === 'pending').length,
        byType: {
          timing_conflict: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.type === 'timing_conflict';
          }).length,
          data_mismatch: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.type === 'data_mismatch';
          }).length,
          duplicate_event: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.type === 'duplicate_event';
          }).length,
          deletion_conflict: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.type === 'deletion_conflict';
          }).length,
        },
        bySeverity: {
          low: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.severity === 'low';
          }).length,
          medium: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.severity === 'medium';
          }).length,
          high: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.severity === 'high';
          }).length,
          critical: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const conflict = snapshot?.conflict as Record<string, unknown> | undefined;
            return conflict?.severity === 'critical';
          }).length,
        },
        resolutionStrategies: {
          crm_wins: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const strategy = snapshot?.strategy as Record<string, unknown> | undefined;
            return strategy?.strategy === 'crm_wins';
          }).length,
          calendar_wins: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const strategy = snapshot?.strategy as Record<string, unknown> | undefined;
            return strategy?.strategy === 'calendar_wins';
          }).length,
          newest_wins: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const strategy = snapshot?.strategy as Record<string, unknown> | undefined;
            return strategy?.strategy === 'newest_wins';
          }).length,
          merge: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const strategy = snapshot?.strategy as Record<string, unknown> | undefined;
            return strategy?.strategy === 'merge';
          }).length,
          manual_review: conflictLogs.filter(log => {
            const snapshot = getDataSnapshot(log);
            const strategy = snapshot?.strategy as Record<string, unknown> | undefined;
            return strategy?.strategy === 'manual_review';
          }).length,
        },
      };

      return stats;
    } catch (error) {
      log.error('Error getting conflict stats:', error);
      return null;
    }
  }
}

export const calendarConflictResolver = new CalendarConflictResolver();