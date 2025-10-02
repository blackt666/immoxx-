import { db } from '../db.js';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { Appointment, CalendarEvent, InsertCalendarSyncLog } from '@shared/schema';
import { appointments, calendarEvents, calendarSyncLogs } from '@shared/schema';
import { addMinutes, isAfter, isBefore, differenceInMinutes } from 'date-fns';

export interface SyncConflict {
  id: string;
  type: 'data_mismatch' | 'timing_conflict' | 'deletion_conflict' | 'duplicate_event';
  appointmentId?: string;
  calendarEventId?: string;
  crmData?: Partial<Appointment>;
  calendarData?: any;
  conflictDetails: {
    field?: string;
    crmValue?: any;
    calendarValue?: any;
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
  private readonly CRITICAL_FIELDS = ['scheduledDate', 'customerId', 'propertyId'];

  constructor() {}

  /**
   * Detect conflicts between CRM appointment and calendar event
   */
  async detectConflicts(
    appointment: Appointment,
    calendarEvent: any,
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
      console.error('Error detecting conflicts:', error);
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
        console.error(`Error resolving conflict ${conflict.id}:`, error);
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
          return await this.resolveDuplicateEvent(conflict, strategy);
        case 'deletion_conflict':
          return await this.resolveDeletionConflict(conflict, strategy);
        default:
          return { success: false, appliedStrategy: 'unknown' };
      }
    } catch (error) {
      console.error('Error applying resolution:', error);
      return { success: false, appliedStrategy: 'error' };
    }
  }

  /**
   * Detect timing conflicts between appointment and calendar event
   */
  private detectTimingConflict(appointment: Appointment, calendarEvent: any): SyncConflict | null {
    const appointmentStart = new Date(appointment.scheduledDate);
    const appointmentEnd = appointment.endDate 
      ? new Date(appointment.endDate)
      : addMinutes(appointmentStart, appointment.duration || 60);

    const eventStart = new Date(calendarEvent.startTime);
    const eventEnd = new Date(calendarEvent.endTime);

    // Check if there's a significant time difference
    const startDiff = Math.abs(differenceInMinutes(appointmentStart, eventStart));
    const endDiff = Math.abs(differenceInMinutes(appointmentEnd, eventEnd));

    if (startDiff > this.DEFAULT_TIME_THRESHOLD || endDiff > this.DEFAULT_TIME_THRESHOLD) {
      return {
        id: `timing_${appointment.id}_${Date.now()}`,
        type: 'timing_conflict',
        appointmentId: appointment.id,
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
  private detectDataMismatches(appointment: Appointment, calendarEvent: any): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    // Title/Summary mismatch
    if (appointment.title !== calendarEvent.title) {
      conflicts.push({
        id: `title_${appointment.id}_${Date.now()}`,
        type: 'data_mismatch',
        appointmentId: appointment.id,
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
    if (appointment.location !== calendarEvent.location && appointment.address !== calendarEvent.location) {
      conflicts.push({
        id: `location_${appointment.id}_${Date.now()}`,
        type: 'data_mismatch',
        appointmentId: appointment.id,
        crmData: appointment,
        calendarData: calendarEvent,
        conflictDetails: {
          field: 'location',
          crmValue: appointment.location || appointment.address,
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
        appointmentId: appointment.id,
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
  private async detectDuplicateEvents(appointment: Appointment, calendarEvent: any): Promise<SyncConflict | null> {
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
          appointmentId: appointment.id,
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
      console.error('Error detecting duplicate events:', error);
      return null;
    }
  }

  /**
   * Normalize calendar event data across providers
   */
  private normalizeCalendarEvent(calendarEvent: any, provider: 'google' | 'apple'): any {
    if (provider === 'google') {
      return {
        id: calendarEvent.id,
        title: calendarEvent.summary,
        description: calendarEvent.description,
        startTime: calendarEvent.start?.dateTime || calendarEvent.start?.date,
        endTime: calendarEvent.end?.dateTime || calendarEvent.end?.date,
        location: calendarEvent.location,
        status: calendarEvent.status,
      };
    } else if (provider === 'apple') {
      return {
        id: calendarEvent.uid,
        title: calendarEvent.summary,
        description: calendarEvent.description,
        startTime: calendarEvent.dtstart,
        endTime: calendarEvent.dtend,
        location: calendarEvent.location,
        status: calendarEvent.status,
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
          await db
            .update(appointments)
            .set({
              scheduledDate: new Date(calendarData.startTime),
              endDate: new Date(calendarData.endTime),
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, conflict.appointmentId));
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
      console.error('Error resolving timing conflict:', error);
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
          const updateData: any = {};
          if (field === 'title') updateData.title = calendarValue;
          if (field === 'location') updateData.location = calendarValue;
          if (field === 'description') updateData.notes = calendarValue;
          
          if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date();
            await db
              .update(appointments)
              .set(updateData)
              .where(eq(appointments.id, conflict.appointmentId));
          }
          
          return { success: true, appliedStrategy: 'calendar_wins' };
        
        case 'merge':
          // Merge values (for text fields)
          if (field === 'description' && crmValue && calendarValue) {
            const mergedValue = `${crmValue}\n\n[Calendar Note: ${calendarValue}]`;
            await db
              .update(appointments)
              .set({
                notes: mergedValue,
                updatedAt: new Date(),
              })
              .where(eq(appointments.id, conflict.appointmentId));
            return { success: true, appliedStrategy: 'merge' };
          }
          // Fall back to CRM wins for non-mergeable fields
          return { success: true, appliedStrategy: 'crm_wins' };
        
        default:
          return { success: false, appliedStrategy: 'unsupported_strategy' };
      }
    } catch (error) {
      console.error('Error resolving data mismatch:', error);
      return { success: false, appliedStrategy: 'error' };
    }
  }

  /**
   * Resolve duplicate events
   */
  private async resolveDuplicateEvent(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; appliedStrategy: string }> {
    // Duplicate events typically require manual review
    // For now, we'll just log and mark for manual resolution
    return { success: false, appliedStrategy: 'manual_review_required' };
  }

  /**
   * Resolve deletion conflicts
   */
  private async resolveDeletionConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; appliedStrategy: string }> {
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
        appointmentId: conflict.appointmentId,
        operation: 'sync',
        direction: 'crm_to_calendar',
        status: result === 'auto' ? 'success' : 'error',
        dataSnapshot: {
          conflict,
          strategy,
          result,
          resolvedBy,
        },
        errorMessage: result === 'pending' ? 'Conflict requires manual resolution' : undefined,
        completedAt: new Date(),
        duration: 0,
      };

      await db.insert(calendarSyncLogs).values(logData);
    } catch (error) {
      console.error('Failed to log conflict resolution:', error);
    }
  }

  /**
   * Get conflict resolution statistics
   */
  async getConflictStats(days = 30): Promise<any> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await db
        .select()
        .from(calendarSyncLogs)
        .where(
          and(
            eq(calendarSyncLogs.operation, 'sync'),
            eq(calendarSyncLogs.direction, 'bidirectional')
          )
        );

      const conflictLogs = logs.filter(log => 
        log.dataSnapshot && 
        typeof log.dataSnapshot === 'object' &&
        'conflict' in log.dataSnapshot
      );

      const stats = {
        totalConflicts: conflictLogs.length,
        autoResolved: conflictLogs.filter(log => (log.dataSnapshot as any)?.result === 'auto').length,
        manualResolution: conflictLogs.filter(log => (log.dataSnapshot as any)?.result === 'pending').length,
        byType: {
          timing_conflict: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.type === 'timing_conflict').length,
          data_mismatch: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.type === 'data_mismatch').length,
          duplicate_event: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.type === 'duplicate_event').length,
          deletion_conflict: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.type === 'deletion_conflict').length,
        },
        bySeverity: {
          low: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.severity === 'low').length,
          medium: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.severity === 'medium').length,
          high: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.severity === 'high').length,
          critical: conflictLogs.filter(log => (log.dataSnapshot as any)?.conflict?.severity === 'critical').length,
        },
        resolutionStrategies: {
          crm_wins: conflictLogs.filter(log => (log.dataSnapshot as any)?.strategy?.strategy === 'crm_wins').length,
          calendar_wins: conflictLogs.filter(log => (log.dataSnapshot as any)?.strategy?.strategy === 'calendar_wins').length,
          newest_wins: conflictLogs.filter(log => (log.dataSnapshot as any)?.strategy?.strategy === 'newest_wins').length,
          merge: conflictLogs.filter(log => (log.dataSnapshot as any)?.strategy?.strategy === 'merge').length,
          manual_review: conflictLogs.filter(log => (log.dataSnapshot as any)?.strategy?.strategy === 'manual_review').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error getting conflict stats:', error);
      return null;
    }
  }
}

export const calendarConflictResolver = new CalendarConflictResolver();