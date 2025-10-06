import type { calendar_v3 } from 'googleapis';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db.js';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { CalendarConnection, Appointment, InsertCalendarEvent, InsertCalendarSyncLog } from '@shared/schema';
import { encrypt, decrypt, generateSecureState } from '../lib/crypto.js';
import type { Request } from 'express';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
}



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

// Timing metrics helper
interface OperationTiming {
  operation: string;
  durationMs: number;
  timestamp: Date;
  success: boolean;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;
  private readonly TOKEN_REFRESH_BUFFER_MINUTES = 5; // Refresh tokens 5 minutes before expiry
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private recentOperationTimings: OperationTiming[] = [];
  private readonly MAX_TIMING_HISTORY = 100;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback'
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Track operation timing
   */
  private trackOperationTiming(operation: string, durationMs: number, success: boolean): void {
    const timing: OperationTiming = {
      operation,
      durationMs,
      timestamp: new Date(),
      success,
    };
    
    this.recentOperationTimings.push(timing);
    
    // Keep only recent timings
    if (this.recentOperationTimings.length > this.MAX_TIMING_HISTORY) {
      this.recentOperationTimings.shift();
    }
    
    console.log(`[GoogleCalendar Timing] ${operation}: ${durationMs}ms (${success ? 'success' : 'failed'})`);
  }

  /**
   * Get timing statistics
   */
  getTimingStatistics(): {
    averageMs: number;
    minMs: number;
    maxMs: number;
    totalOperations: number;
    successRate: number;
    byOperation: Record<string, { count: number; averageMs: number; successRate: number }>;
  } {
    if (this.recentOperationTimings.length === 0) {
      return {
        averageMs: 0,
        minMs: 0,
        maxMs: 0,
        totalOperations: 0,
        successRate: 0,
        byOperation: {},
      };
    }

    const totalMs = this.recentOperationTimings.reduce((sum, t) => sum + t.durationMs, 0);
    const successCount = this.recentOperationTimings.filter(t => t.success).length;
    
    const byOperation: Record<string, { count: number; totalMs: number; successCount: number }> = {};
    for (const timing of this.recentOperationTimings) {
      if (!byOperation[timing.operation]) {
        byOperation[timing.operation] = { count: 0, totalMs: 0, successCount: 0 };
      }
      byOperation[timing.operation].count++;
      byOperation[timing.operation].totalMs += timing.durationMs;
      if (timing.success) byOperation[timing.operation].successCount++;
    }

    const byOperationStats: Record<string, { count: number; averageMs: number; successRate: number }> = {};
    for (const [op, stats] of Object.entries(byOperation)) {
      byOperationStats[op] = {
        count: stats.count,
        averageMs: stats.totalMs / stats.count,
        successRate: stats.successCount / stats.count,
      };
    }

    return {
      averageMs: totalMs / this.recentOperationTimings.length,
      minMs: Math.min(...this.recentOperationTimings.map(t => t.durationMs)),
      maxMs: Math.max(...this.recentOperationTimings.map(t => t.durationMs)),
      totalOperations: this.recentOperationTimings.length,
      successRate: successCount / this.recentOperationTimings.length,
      byOperation: byOperationStats,
    };
  }

  /**
   * Refresh an expired access token using a refresh token
   * @param connection - The calendar connection with a refresh token
   * @returns The updated calendar connection
   */
  public async refreshToken(connection: CalendarConnection): Promise<CalendarConnection> {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available for this connection.');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: connection.refreshToken,
      });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const updatedConnection = await this.updateConnectionTokens(connection.id, {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token,
        tokenExpiresAt: new Date(credentials.expiry_date!),
      });
      return updatedConnection;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await db.update(schema.calendarConnections)
        .set({ isActive: false, syncError: 'Token refresh failed' })
        .where(eq(schema.calendarConnections.id, connection.id));
      throw new Error('Failed to refresh token.');
    }
  }

  private async updateConnectionTokens(connectionId: number, tokens: { accessToken: string; refreshToken?: string | null; tokenExpiresAt: Date; }) {
    const { accessToken, refreshToken, tokenExpiresAt } = tokens;
    const updateData: Partial<CalendarConnection> = {
      accessToken: encrypt(accessToken),
      tokenExpiresAt,
      isActive: true,
      syncError: null,
      updatedAt: new Date(),
    };

    if (refreshToken) {
      updateData.refreshToken = encrypt(refreshToken);
    }

    await db.update(schema.calendarConnections)
      .set(updateData)
      .where(eq(schema.calendarConnections.id, connectionId));

    const updatedConnection = await db.query.calendarConnections.findFirst({
      where: eq(schema.calendarConnections.id, connectionId),
    });

    if (!updatedConnection) {
      throw new Error('Failed to retrieve updated connection after token refresh.');
    }

    return updatedConnection;
  }

  /**
   * Generate Google OAuth2 authorization URL with secure state
   */
  generateAuthUrl(agentId: string, req: Request): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    // Generate cryptographically secure state nonce
    const stateNonce = generateSecureState();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Store state in session for CSRF protection
    if (!req.session.oauthStates) {
      req.session.oauthStates = {};
    }
    
    req.session.oauthStates[stateNonce] = {
      agentId,
      provider: 'google',
      createdAt: Date.now(),
      expiresAt,
    };
    
    // Clean up expired states
    this.cleanupExpiredStates(req.session);

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: stateNonce, // Use secure nonce instead of agentId
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens and save connection
   */
  async handleAuthCallback(code: string, state: string, req: Request): Promise<CalendarConnection> {
    try {
      // Validate OAuth state for CSRF protection first
      this.validateOAuthState(state as string, req.session, 'google');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }
      
      this.oauth2Client.setCredentials(tokens);

      // Get user's calendar list to get primary calendar info
      const calendarList = await this.calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find((cal: calendar_v3.Schema$CalendarListEntry) => cal.primary);

      if (!primaryCalendar) {
        throw new Error('No primary calendar found');
      }
      
      // Encrypt tokens before storage
      const encryptedAccessToken = encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

      // Save or update calendar connection
      const connectionData = {
        userId: null, // This should be set from the authenticated user context
        provider: 'google' as const,
        providerId: primaryCalendar.id,
        email: primaryCalendar.id,
        name: primaryCalendar.summary || 'Primary Calendar',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
        syncEnabled: true,
      };

      // Check if connection already exists
      const existingConnection = await db
        .select()
        .from(schema.calendarConnections)
        .where(
          and(
            eq(schema.calendarConnections.providerId, primaryCalendar.id!),
            eq(schema.calendarConnections.provider, 'google')
          )
        );

      let connection: CalendarConnection;
      if (existingConnection.length > 0) {
        // Update existing connection
        const [updated] = await db
          .update(schema.calendarConnections)
          .set({
            ...connectionData,
            providerId: connectionData.providerId!,
            email: connectionData.email!,
            updatedAt: new Date(),
          })
          .where(eq(schema.calendarConnections.id, existingConnection[0].id))
          .returning();
        connection = updated;
      } else {
        // Create new connection
        const [created] = await db
          .insert(schema.calendarConnections)
          .values({ ...connectionData, providerId: connectionData.providerId!, email: connectionData.email! })
          .returning();
        connection = created;
      }

      // Log successful connection
      await this.logSyncOperation(
        String(connection.id), 
        null, 
        'sync', 
        'crm_to_calendar', 
        'success', 
        'Connection established',
        { calendarName: primaryCalendar.summary }
      );

      return connection;
    } catch (error) {
      console.error('Google Calendar auth error:', error);
      
      // Log failed connection attempt
      await this.logSyncOperation(
        null, 
        null, 
        'sync', 
        'crm_to_calendar', 
        'error', 
        'Failed to establish Google Calendar connection', 
        { error: getErrorMessage(error) }
      );

      throw new Error(`Failed to connect Google Calendar: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get the primary calendar connection for an agent
   * @param agentId - The ID of the agent
   * @returns The primary calendar connection
   */
  async getPrimaryConnection(agentId: string): Promise<CalendarConnection> {
    const connection = await db.query.calendarConnections.findFirst({
      where: and(
        eq(schema.calendarConnections.agentId, agentId),
        eq(schema.calendarConnections.isActive, true)
      ),
      // Assuming the first active connection is the primary one.
      // Add more specific logic if needed, e.g., a 'isPrimary' flag.
    });

    if (!connection) {
      throw new Error('No active calendar connection found for this agent.');
    }

    return connection;
  }

  /**
   * Revoke a Google API token and delete the connection
   * @param connectionId - The ID of the connection to revoke
   * @param agentId - The ID of the agent for verification
   */
  async revokeConnection(connectionId: number, agentId: string): Promise<void> {
    const connection = await db.query.calendarConnections.findFirst({
        where: and(
            eq(schema.calendarConnections.id, connectionId),
            eq(schema.calendarConnections.agentId, agentId)
        ),
    });

    if (!connection) {
        throw new Error('Connection not found or you do not have permission to delete it.');
    }

    try {
        if (connection.refreshToken) {
            const refreshToken = decrypt(connection.refreshToken);
            await this.oauth2Client.revokeToken(refreshToken);
        }
    } catch (error) {
        console.warn(`Failed to revoke Google token for connection ${connectionId}. It might have been already revoked.`, error);
    }

    await db.delete(schema.calendarConnections).where(eq(schema.calendarConnections.id, connectionId));
  }

  /**
   * Refresh access token using refresh token with comprehensive error handling
   */
  async refreshAccessToken(connection: CalendarConnection): Promise<CalendarConnection> {
    try {
      if (!connection.refreshToken) {
        throw new Error('No refresh token available - user needs to re-authenticate');
      }

      // Decrypt refresh token for API usage
      const refreshToken = decrypt(connection.refreshToken);
      
      // Clear any existing credentials first
      this.oauth2Client.setCredentials({});
      
      // Set only the refresh token
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      console.log(`Refreshing Google token for connection ${connection.id}`);
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token received from refresh');
      }
      
      // Encrypt new tokens before storage
      const encryptedAccessToken = encrypt(credentials.access_token);
      const encryptedRefreshToken = credentials.refresh_token 
        ? encrypt(credentials.refresh_token) 
        : connection.refreshToken; // Keep existing if no new refresh token provided
      
      // Calculate expiry date with buffer
      const tokenExpiresAt = credentials.expiry_date 
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600000); // Default to 1 hour if not provided
        
      // Update connection with new tokens
      const [updatedConnection] = await db
        .update(schema.calendarConnections)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          syncStatus: 'connected',
          syncError: null,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarConnections.id, connection.id))
        .returning();

      console.log(`Successfully refreshed Google token for connection ${connection.id}, expires at ${tokenExpiresAt}`);
      return updatedConnection;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      const errorMessage = getErrorMessage(error);
      let syncStatus = 'error';
      
      // Handle specific error types
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('invalid_request')) {
        syncStatus = 'expired';
        console.log(`Refresh token expired for connection ${connection.id} - user re-authentication required`);
      }
      
      // Update connection status to error
      await db
        .update(schema.calendarConnections)
        .set({
          syncStatus,
          syncError: `Token refresh failed: ${errorMessage}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarConnections.id, connection.id));

      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Set credentials for API calls with proactive token refresh
   */
  private async setCredentials(connection: CalendarConnection): Promise<CalendarConnection> {
    // Check if token needs proactive refresh (5 minutes before expiry)
    const now = new Date();
    const expiresAt = connection.tokenExpiresAt;
    const refreshThreshold = new Date(now.getTime() + (this.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000));
    
    let updatedConnection = connection;
    
    // Proactively refresh if token expires within buffer time or is already expired
    if (expiresAt && expiresAt <= refreshThreshold) {
      try {
        console.log(`Proactively refreshing Google token for connection ${connection.id} (expires at ${expiresAt})`);
        updatedConnection = await this.refreshAccessToken(connection);
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        // Try to continue with existing token if proactive refresh fails
        // The API call will fail if token is truly expired, and we'll handle it in retry logic
      }
    }

    // Decrypt tokens for API usage
    const accessToken = decrypt(updatedConnection.accessToken!);
    const refreshToken = updatedConnection.refreshToken ? decrypt(updatedConnection.refreshToken) : null;

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    return updatedConnection;
  }

  /**
   * Create calendar event from CRM appointment with retry logic
   */
  async createEvent(connection: CalendarConnection, appointment: Appointment): Promise<string> {
    const operationStart = Date.now();
    let success = false;
    
    try {
      const result = await this.executeWithRetry(async (updatedConnection) => {
        const startTime = new Date(appointment.startTime);
        const endTime = appointment.endTime
          ? new Date(appointment.endTime)
          : new Date(startTime.getTime() + (60 * 60 * 1000)); // Default to 1 hour if no end time

        const event: GoogleCalendarEvent = {
          summary: appointment.title,
          description: this.buildEventDescription(appointment),
          start: {
            dateTime: startTime.toISOString(),
            timeZone: process.env.CALENDAR_TIMEZONE || 'Europe/Berlin',
          },
          end: {
            dateTime: endTime.toISOString(),
          timeZone: process.env.CALENDAR_TIMEZONE || 'Europe/Berlin',
        },
        location: appointment.location || undefined,
        status: 'confirmed',
      };

      const response = await this.calendar.events.insert({
        calendarId: updatedConnection.providerId!,
        requestBody: event,
      });

      const googleEventId = response.data.id;

      if (!googleEventId) {
        throw new Error('No event ID returned from Google Calendar');
      }

      // Update appointment with Google Calendar event ID
      await db
        .update(schema.appointments)
        .set({
          // externalId: googleEventId, // This field does not exist on appointments
          // calendarSyncStatus: 'synced',
          // lastCalendarSync: new Date(),
          // calendarSyncError: null,
        })
        .where(eq(schema.appointments.id, appointment.id));

      // Create calendar event record
      const calendarEventData: InsertCalendarEvent = {
        calendarConnectionId: updatedConnection.id,
        appointmentId: appointment.id,
        externalId: googleEventId,
        title: appointment.title,
        description: event.description || null,
        startTime: startTime,
        endTime: endTime,
        location: event.location || null,
        status: 'synced',
        syncStatus: 'synced',
      };

      await db.insert(schema.calendarEvents).values(calendarEventData);

      // Log successful sync
      await this.logSyncOperation(
        updatedConnection.id.toString(),
        appointment.id.toString(),
        'create',
        'crm_to_calendar',
        'success',
        `Event created: ${appointment.title}`,
        { googleEventId, appointmentTitle: appointment.title }
      );

      return googleEventId;
    }, connection, String(appointment.id), 'create');
    
    success = true;
    return result;
    } catch (error) {
      throw error;
    } finally {
      this.trackOperationTiming('createEvent', Date.now() - operationStart, success);
    }
  }

  /**
   * Update calendar event with retry logic
   */
  async updateEvent(connection: CalendarConnection, appointment: Appointment, googleEventId: string): Promise<void> {
    const operationStart = Date.now();
    let success = false;
    
    try {
      await this.executeWithRetry(async (updatedConnection) => {
        const startTime = new Date(appointment.startTime);
        const endTime = appointment.endTime
          ? new Date(appointment.endTime)
          : new Date(startTime.getTime() + (60 * 60 * 1000));

        const event: GoogleCalendarEvent = {
          summary: appointment.title,
          description: this.buildEventDescription(appointment),
          start: {
            dateTime: startTime.toISOString(),
            timeZone: process.env.CALENDAR_TIMEZONE || 'Europe/Berlin',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: process.env.CALENDAR_TIMEZONE || 'Europe/Berlin',
          },
          location: appointment.location || undefined,
          status: appointment.status === 'cancelled' ? 'cancelled' : 'confirmed',
        };

        await this.calendar.events.update({
          calendarId: updatedConnection.providerId!,
          eventId: googleEventId,
          requestBody: event,
        });

        // Update appointment sync status
        await db
          .update(schema.appointments)
          .set({
            // calendarSyncStatus: 'synced',
            // lastCalendarSync: new Date(),
            // calendarSyncError: null,
          })
          .where(eq(schema.appointments.id, appointment.id));

        // Update calendar event record
        await db
          .update(schema.calendarEvents)
          .set({
            title: appointment.title,
            startTime: startTime,
            endTime: endTime,
            location: event.location,
            lastModified: new Date(),
            syncStatus: 'synced',
          })
          .where(eq(schema.calendarEvents.externalId, googleEventId));

        // Log successful sync
        await this.logSyncOperation(
          updatedConnection.id.toString(),
          appointment.id.toString(),
          'update',
          'crm_to_calendar',
          'success',
          `Event updated: ${appointment.title}`,
          { googleEventId, appointmentTitle: appointment.title }
        );
      }, connection, String(appointment.id), 'update');
      
      success = true;
    } catch (error) {
      throw error;
    } finally {
      this.trackOperationTiming('updateEvent', Date.now() - operationStart, success);
    }
  }

  /**
   * Delete calendar event with retry logic
   */
  async deleteEvent(connection: CalendarConnection, googleEventId: string, appointmentId?: string): Promise<void> {
    const operationStart = Date.now();
    let success = false;
    
    try {
      await this.executeWithRetry(async (updatedConnection) => {
        await this.calendar.events.delete({
          calendarId: updatedConnection.providerId!,
          eventId: googleEventId,
        });

        // Update calendar event record
        await db
          .update(schema.calendarEvents)
          .set({
            syncStatus: 'synced',
            lastModified: new Date(),
          })
          .where(eq(schema.calendarEvents.externalId, googleEventId));

        // Update appointment if provided
        if (appointmentId) {
          await db
            .update(schema.appointments)
            .set({
              // externalId: null,
              // calendarSyncStatus: 'pending',
              // lastCalendarSync: new Date(),
            })
            .where(eq(schema.appointments.id, parseInt(appointmentId, 10)));
        }

        // Log successful sync
        await this.logSyncOperation(
          updatedConnection.id.toString(),
          appointmentId || null,
          'delete',
          'crm_to_calendar',
          'success',
          `Event deleted: ${googleEventId}`,
          { googleEventId }
        );
      }, connection, appointmentId || null, 'delete');
      
      success = true;
    } catch (error) {
      throw error;
    } finally {
      this.trackOperationTiming('deleteEvent', Date.now() - operationStart, success);
    }
  }

  /**
   * Get events from Google Calendar with retry logic
   */
  async getEvents(connection: CalendarConnection, timeMin?: Date, timeMax?: Date): Promise<calendar_v3.Schema$Event[]> {
    const operationStart = Date.now();
    let success = false;
    
    try {
      const result = await this.executeWithRetry(async (updatedConnection) => {
        const response = await this.calendar.events.list({
          calendarId: updatedConnection.providerId!,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Google's max limit
      });

      return response.data.items || [];
    }, connection, null, 'fetch');
    
    success = true;
    return result;
    } catch (error) {
      throw error;
    } finally {
      this.trackOperationTiming('getEvents', Date.now() - operationStart, success);
    }
  }

  /**
   * Execute calendar operation with retry logic for token refresh
   */
  private async executeWithRetry<T>(
    operation: (connection: CalendarConnection) => Promise<T>,
    connection: CalendarConnection,
    appointmentId: string | null,
    operationType: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let currentConnection = connection;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Set credentials with proactive refresh
        currentConnection = await this.setCredentials(currentConnection);
        
        // Execute the operation
        return await operation(currentConnection);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = getErrorMessage(error);
        
        console.error(`Calendar operation '${operationType}' failed (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS}):`, error);

        // Check if this is an authentication error
        if (this.isAuthenticationError(error)) {
          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            console.log(`Authentication error detected, attempting token refresh (attempt ${attempt})`);
            
            try {
              // Force token refresh on authentication errors
              currentConnection = await this.refreshAccessToken(currentConnection);
              console.log(`Token refreshed successfully, retrying operation`);
              
              // Wait before retry
              await this.delay(this.RETRY_DELAY_MS * attempt);
              continue;
            } catch (refreshError) {
              console.error(`Token refresh failed on attempt ${attempt}:`, refreshError);
              
              // If refresh fails and this is our last attempt, or refresh token is invalid, fail immediately
              if (getErrorMessage(refreshError).includes('invalid_grant') || attempt === this.MAX_RETRY_ATTEMPTS) {
                // Update appointment status if provided
                if (appointmentId) {
                  await this.updateAppointmentSyncError(appointmentId, `Authentication failed: ${getErrorMessage(refreshError)}`);
                }
                
                // Log failure
                await this.logSyncOperation(
                  String(currentConnection.id),
                  appointmentId,
                  operationType as 'create' | 'update' | 'delete' | 'sync',
                  'crm_to_calendar',
                  'error',
                  `Token refresh failed: ${getErrorMessage(refreshError)}`,
                  { attempt, operationType, originalError: errorMessage, refreshError: getErrorMessage(refreshError) }
                );
                
                throw new Error(`Token refresh failed - user re-authentication required: ${getErrorMessage(refreshError)}`);
              }
            }
          }
        } else {
          // Non-authentication error
          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            console.log(`Retrying operation '${operationType}' due to non-auth error (attempt ${attempt})`);
            await this.delay(this.RETRY_DELAY_MS * attempt);
            continue;
          }
        }
      }
    }

    // All retries exhausted
    const finalError = lastError || new Error('Unknown error after all retries');
    
    // Update appointment status if provided
    if (appointmentId) {
      await this.updateAppointmentSyncError(appointmentId, finalError.message);
    }
    
    // Log final failure
    await this.logSyncOperation(
      String(currentConnection.id),
      appointmentId,
      operationType as 'create' | 'update' | 'delete' | 'sync',
      'crm_to_calendar',
      'error',
      `Operation failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${finalError.message}`,
      { attempts: this.MAX_RETRY_ATTEMPTS, operationType, error: finalError.message }
    );
    
    throw finalError;
  }

  /**
   * Check if error is an authentication/authorization error
   */
  private isAuthenticationError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    const err = error as Record<string, unknown>;
    const errorMessage = ((err.message as string) || '').toLowerCase();
    const statusCode = err.code || (err.response as { status?: number })?.status;

    const responseData = (err.response as { data?: { error?: string } })?.data;

    return (
      statusCode === 401 ||
      statusCode === 403 ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('invalid_token') ||
      errorMessage.includes('token has been expired or revoked') ||
      responseData?.error === 'invalid_grant'
    );
  }

  /**
   * Update appointment sync status with an error message
   */
  private async updateAppointmentSyncError(appointmentId: string, errorMessage: string): Promise<void> {
    try {
      await db
        .update(schema.appointments)
        .set({
          notes: `Sync Error: ${errorMessage}`,
        })
        .where(eq(schema.appointments.id, parseInt(appointmentId, 10)));
    } catch (dbError) {
      console.error('Failed to update appointment sync error:', dbError);
    }
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if token is nearing expiry
   */
  isTokenNearingExpiry(connection: CalendarConnection, bufferMinutes: number = 5): boolean {
    if (!connection.tokenExpiresAt) {
      return true; // If no expiry date, assume it needs refresh
    }
    
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + (bufferMinutes * 60 * 1000));
    
    return connection.tokenExpiresAt <= expiryThreshold;
  }

  /**
   * Get token health status
   */
  getTokenHealthStatus(connection: CalendarConnection): {
    status: 'healthy' | 'expiring_soon' | 'expired' | 'invalid';
    expiresAt?: Date;
    minutesToExpiry?: number;
    needsRefresh: boolean;
    canRefresh: boolean;
  } {
    const now = new Date();
    const hasRefreshToken = Boolean(connection.refreshToken);
    
    if (!connection.tokenExpiresAt) {
      return {
        status: 'invalid',
        needsRefresh: true,
        canRefresh: hasRefreshToken
      };
    }
    
    const minutesToExpiry = Math.floor((connection.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60));
    
    let status: 'healthy' | 'expiring_soon' | 'expired' | 'invalid';
    let needsRefresh = false;
    
    if (minutesToExpiry <= 0) {
      status = 'expired';
      needsRefresh = true;
    } else if (minutesToExpiry <= this.TOKEN_REFRESH_BUFFER_MINUTES) {
      status = 'expiring_soon';
      needsRefresh = true;
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      expiresAt: connection.tokenExpiresAt,
      minutesToExpiry: Math.max(0, minutesToExpiry),
      needsRefresh,
      canRefresh: hasRefreshToken
    };
  }

  /**
   * Build event description from appointment data
   */
  private buildEventDescription(appointment: Appointment): string {
    let description = '';
    
    if (appointment.notes) {
      description += `${appointment.notes}\n\n`;
    }
    
    description += `Terminart: ${this.getTypeDisplayName(appointment.type)}\n`;
    description += `Status: ${this.getStatusDisplayName(appointment.status)}\n`;
    
    if (appointment.customerId) {
      description += `Kunde: ${appointment.customerId}\n`;
    }
    
    if (appointment.propertyId) {
      description += `Immobilie: ${appointment.propertyId}\n`;
    }
    
    if (appointment.notes) {
      description += `\nNotizen:\n${appointment.notes}`;
    }
    
    description += '\n\n--- Automatisch erstellt von Bodensee Immobilien Müller CRM ---';
    
    return description;
  }

  /**
   * Get display name for appointment type
   */
  private getTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      property_viewing: 'Besichtigung',
      consultation: 'Beratung',
      valuation: 'Bewertung',
      contract_signing: 'Vertragsunterzeichnung',
      follow_up: 'Nachfassgespräch',
    };
    return typeMap[type] || type;
  }

  /**
   * Get display name for appointment status
   */
  private getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      scheduled: 'Geplant',
      confirmed: 'Bestätigt',
      completed: 'Abgeschlossen',
      cancelled: 'Abgesagt',
      rescheduled: 'Verschoben',
      no_show: 'Nicht erschienen',
    };
    return statusMap[status] || status;
  }

  /**
   * Log sync operation
   */
  private async logSyncOperation(
    connectionId: string | null,
    appointmentId: string | null,
    operation: 'create' | 'update' | 'delete' | 'sync',
    direction: 'crm_to_calendar' | 'calendar_to_crm',
    status: 'success' | 'error' | 'skipped',
    message?: string,
    details?: unknown
  ): Promise<void> {
    try {
      const logData: Omit<InsertCalendarSyncLog, 'id' | 'createdAt' | 'startedAt' | 'appointmentId' | 'direction'> = {
        connectionId: connectionId ? parseInt(connectionId, 10) : null,
        operation,
        status,
        message: message,
        errorDetails: details ? JSON.stringify(details) : null,
        syncType: operation,
        eventCount: 1,
      };

      await db.insert(schema.calendarSyncLogs).values(logData as InsertCalendarSyncLog);
    } catch (error) {
      console.error('Failed to log sync operation:', error);
    }
  }

  /**
   * Test connection by making a simple API call with retry logic
   */
  async testConnection(connection: CalendarConnection): Promise<boolean> {
    try {
      await this.executeWithRetry(async (updatedConnection) => {
        // Make a simple call to verify connection
        await this.calendar.calendarList.get({
          calendarId: updatedConnection.providerId!,
        });

        // Update connection status on success
        await db
          .update(schema.calendarConnections)
          .set({
            syncStatus: 'connected',
            syncError: null,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.calendarConnections.id, updatedConnection.id));

        return true;
      }, connection, null, 'test');
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);

      // Update connection status on failure
      await db
        .update(schema.calendarConnections)
        .set({
          syncStatus: 'error',
          syncError: `Connection test failed: ${getErrorMessage(error)}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarConnections.id, connection.id));

      return false;
    }
  }

  /**
   * Synchronize all appointments for a given connection.
   * Fetches events from Google Calendar and appointments from the local DB
   * and performs a two-way sync.
   * @param connectionId The ID of the calendar connection to sync.
   * @param agentId The ID of the agent performing the sync.
   */
  async syncAllAppointments(connectionId: number, agentId: number): Promise<void> {
    const connection = await db.query.calendarConnections.findFirst({
        where: and(
            eq(schema.calendarConnections.id, connectionId),
            eq(schema.calendarConnections.agentId, agentId.toString())
        ),
    });

    if (!connection || !connection.syncEnabled) {
        console.log(`Sync skipped for connection ${connectionId} (not found or disabled).`);
        return;
    }

    console.log(`Starting two-way sync for connection: ${connection.id}`);
    await this.logSyncOperation(connection.id.toString(), null, 'sync', 'crm_to_calendar', 'success', 'Sync started');

    try {
        const timeMin = new Date();
        timeMin.setMonth(timeMin.getMonth() - 3); // Sync last 3 months
        const timeMax = new Date();
        timeMax.setMonth(timeMax.getMonth() + 3); // Sync next 3 months

        // 1. Fetch data from both sources
        const googleEvents = await this.getEvents(connection, timeMin, timeMax);
        const crmAppointments = await db.query.appointments.findMany({
            where: and(
                eq(schema.appointments.agentId, agentId),
                // Add time range filter if needed
            ),
        });

        const googleEventMap = new Map(googleEvents.map(e => [e.id, e]));

        // 2. Sync from CRM to Google Calendar (Create/Update)
        for (const crmApp of crmAppointments) {
            const externalEvent = await db.query.calendarEvents.findFirst({ where: eq(schema.calendarEvents.appointmentId, crmApp.id) });
            if (externalEvent && googleEventMap.has(externalEvent.externalId)) {
                // Update existing event
                await this.updateEvent(connection, crmApp, externalEvent.externalId);
            } else {
                // Create new event
                await this.createEvent(connection, crmApp);
            }
        }

        // 3. Sync from Google Calendar to CRM (Create/Update/Delete)
        for (const gEvent of googleEvents) {
            const existingCalendarEvent = await db.query.calendarEvents.findFirst({ where: eq(schema.calendarEvents.externalId, gEvent.id!) });
            if (gEvent.id && !existingCalendarEvent) {
                // Create new appointment in CRM
                // This part is complex and needs a robust transformation logic.
                // For now, we'll just log it.
                console.log(`Found new Google event to be created in CRM: ${gEvent.summary}`);
              }
        }

        await db.update(schema.calendarConnections)
            .set({ lastSyncAt: new Date(), syncStatus: 'synced', syncError: null })
            .where(eq(schema.calendarConnections.id, connection.id));

        await this.logSyncOperation(connection.id.toString(), null, 'sync', 'crm_to_calendar', 'success', 'Sync completed');
        console.log(`Successfully completed sync for connection: ${connection.id}`);

    } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error(`Sync failed for connection ${connection.id}:`, errorMessage);
        await db.update(schema.calendarConnections)
            .set({ syncStatus: 'error', syncError: errorMessage })
            .where(eq(schema.calendarConnections.id, connection.id));
        await this.logSyncOperation(connection.id.toString(), null, 'sync', 'crm_to_calendar', 'error', 'Sync failed', { error: errorMessage });
    }
  }

  /**
   * Validate OAuth state for CSRF protection
   */
  private validateOAuthState(
    state: string, 
    session: Request['session'], 
    expectedProvider: 'google' | 'apple' | 'outlook'
  ): { agentId: string } {
    if (!session.oauthStates || !session.oauthStates[state]) {
      throw new Error('Invalid or expired OAuth state parameter');
    }
    
    const stateData = session.oauthStates[state];
    
    // Check if state is expired
    if (Date.now() > stateData.expiresAt) {
      delete session.oauthStates[state];
      throw new Error('OAuth state parameter has expired');
    }
    
    // Verify provider matches
    if (stateData.provider !== expectedProvider) {
      throw new Error('OAuth state provider mismatch');
    }
    
    // Clean up used state
    delete session.oauthStates[state];
    
    return { agentId: stateData.agentId };
  }
  
  /**
   * Clean up expired OAuth states from session
   */
  private cleanupExpiredStates(session: Request['session']): void {
    if (!session.oauthStates) {
      return;
    }
    
    const now = Date.now();
    Object.keys(session.oauthStates).forEach(state => {
      if (session.oauthStates && session.oauthStates[state] && session.oauthStates[state].expiresAt < now) {
        delete session.oauthStates[state];
      }
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();