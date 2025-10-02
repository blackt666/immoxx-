import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { db } from '../db.js';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { CalendarConnection, Appointment, InsertCalendarEvent, InsertCalendarSyncLog } from '@shared/schema';
import { encrypt, decrypt, generateSecureState, safeTimeComparison } from '../lib/crypto.js';
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

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
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

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;
  private readonly TOKEN_REFRESH_BUFFER_MINUTES = 5; // Refresh tokens 5 minutes before expiry
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback'
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
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
      const { agentId } = this.validateOAuthState(state, req.session, 'google');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }
      
      this.oauth2Client.setCredentials(tokens);

      // Get user's calendar list to get primary calendar info
      const calendarList = await this.calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find((cal: any) => cal.primary);

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
            eq(schema.calendarConnections.providerId, primaryCalendar.id),
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
            updatedAt: new Date(),
          })
          .where(eq(schema.calendarConnections.id, existingConnection[0].id))
          .returning();
        connection = updated;
      } else {
        // Create new connection
        const [created] = await db
          .insert(schema.calendarConnections)
          .values(connectionData)
          .returning();
        connection = created;
      }

      // Log successful connection
      await this.logSyncOperation(connection.id, null, 'sync', 'crm_to_calendar', 'success', {
        operation: 'connection_established',
        calendarName: primaryCalendar.summary,
      });

      return connection;
    } catch (error) {
      console.error('Google Calendar auth error:', error);
      
      // Log failed connection attempt
      await this.logSyncOperation(null, null, 'sync', 'crm_to_calendar', 'error', null, 
        'Failed to establish Google Calendar connection', { error: getErrorMessage(error) });

      throw new Error(`Failed to connect Google Calendar: ${getErrorMessage(error)}`);
    }
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
    return await this.executeWithRetry(async (updatedConnection) => {
      const startTime = new Date(appointment.scheduledDate);
      const endTime = appointment.endDate 
        ? new Date(appointment.endDate) 
        : new Date(startTime.getTime() + ((appointment.duration || 60) * 60 * 1000));

      const event: GoogleCalendarEvent = {
        summary: appointment.title,
        description: this.buildEventDescription(appointment),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Berlin', // TODO: Make configurable
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Berlin',
        },
        location: appointment.address || appointment.location || undefined,
        status: 'confirmed',
      };

      const response = await this.calendar.events.insert({
        calendarId: updatedConnection.calendarId!,
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
          googleCalendarEventId: googleEventId,
          calendarSyncStatus: 'synced',
          lastCalendarSync: new Date(),
          calendarSyncError: null,
        })
        .where(eq(schema.appointments.id, appointment.id));

      // Create calendar event record
      const calendarEventData: InsertCalendarEvent = {
        connectionId: updatedConnection.id,
        appointmentId: appointment.id,
        externalEventId: googleEventId,
        provider: 'google',
        title: appointment.title,
        description: event.description || null,
        startDate: startTime instanceof Date ? startTime : new Date(startTime),
        endDate: endTime instanceof Date ? endTime : new Date(endTime),
        location: event.location || null,
        syncStatus: 'synced',
      };

      await db.insert(schema.calendarEvents).values(calendarEventData as any);

      // Log successful sync
      await this.logSyncOperation(
        updatedConnection.id,
        appointment.id,
        'create',
        'crm_to_calendar',
        'success',
        { googleEventId, appointmentTitle: appointment.title }
      );

      return googleEventId;
    }, connection, appointment.id, 'create');
  }

  /**
   * Update calendar event with retry logic
   */
  async updateEvent(connection: CalendarConnection, appointment: Appointment, googleEventId: string): Promise<void> {
    await this.executeWithRetry(async (updatedConnection) => {
      const startTime = new Date(appointment.scheduledDate);
      const endTime = appointment.endDate 
        ? new Date(appointment.endDate) 
        : new Date(startTime.getTime() + ((appointment.duration || 60) * 60 * 1000));

      const event: GoogleCalendarEvent = {
        summary: appointment.title,
        description: this.buildEventDescription(appointment),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Berlin',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Berlin',
        },
        location: appointment.address || appointment.location || undefined,
        status: appointment.status === 'cancelled' ? 'cancelled' : 'confirmed',
      };

      await this.calendar.events.update({
        calendarId: updatedConnection.calendarId!,
        eventId: googleEventId,
        requestBody: event,
      });

      // Update appointment sync status
      await db
        .update(schema.appointments)
        .set({
          calendarSyncStatus: 'synced',
          lastCalendarSync: new Date(),
          calendarSyncError: null,
        })
        .where(eq(schema.appointments.id, appointment.id));

      // Update calendar event record
      await db
        .update(schema.calendarEvents)
        .set({
          title: appointment.title,
          startDate: startTime,
          endDate: endTime,
          location: event.location,
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
        })
        .where(eq(schema.calendarEvents.externalEventId, googleEventId));

      // Log successful sync
      await this.logSyncOperation(
        updatedConnection.id,
        appointment.id,
        'update',
        'crm_to_calendar',
        'success',
        { googleEventId, appointmentTitle: appointment.title }
      );
    }, connection, appointment.id, 'update');
  }

  /**
   * Delete calendar event with retry logic
   */
  async deleteEvent(connection: CalendarConnection, googleEventId: string, appointmentId?: string): Promise<void> {
    await this.executeWithRetry(async (updatedConnection) => {
      await this.calendar.events.delete({
        calendarId: updatedConnection.calendarId!,
        eventId: googleEventId,
      });

      // Update calendar event record
      await db
        .update(schema.calendarEvents)
        .set({
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
        })
        .where(eq(schema.calendarEvents.externalEventId, googleEventId));

      // Update appointment if provided
      if (appointmentId) {
        await db
          .update(schema.appointments)
          .set({
            googleCalendarEventId: null,
            calendarSyncStatus: 'pending',
            lastCalendarSync: new Date(),
          })
          .where(eq(schema.appointments.id, appointmentId));
      }

      // Log successful sync
      await this.logSyncOperation(
        updatedConnection.id,
        appointmentId || null,
        'delete',
        'crm_to_calendar',
        'success',
        { googleEventId }
      );
    }, connection, appointmentId || null, 'delete');
  }

  /**
   * Get events from Google Calendar with retry logic
   */
  async getEvents(connection: CalendarConnection, timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    return await this.executeWithRetry(async (updatedConnection) => {
      const response = await this.calendar.events.list({
        calendarId: updatedConnection.calendarId!,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Google's max limit
      });

      return response.data.items || [];
    }, connection, null, 'fetch');
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
                  currentConnection.id,
                  appointmentId,
                  operationType as any,
                  'crm_to_calendar',
                  'error',
                  { attempt, operationType },
                  `Token refresh failed: ${getErrorMessage(refreshError)}`,
                  { originalError: errorMessage, refreshError: getErrorMessage(refreshError) }
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
      currentConnection.id,
      appointmentId,
      operationType as any,
      'crm_to_calendar',
      'error',
      { attempts: this.MAX_RETRY_ATTEMPTS, operationType },
      `Operation failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${finalError.message}`,
      { error: finalError.message }
    );
    
    throw finalError;
  }

  /**
   * Check if error is an authentication/authorization error
   */
  private isAuthenticationError(error: any): boolean {
    const errorMessage = (error.message || '').toLowerCase();
    const statusCode = error.status || error.statusCode || error.code;
    
    return (
      statusCode === 401 ||
      statusCode === 403 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('token') ||
      errorMessage.includes('invalid_token') ||
      errorMessage.includes('token_expired')
    );
  }

  /**
   * Update appointment sync error status
   */
  private async updateAppointmentSyncError(appointmentId: string, error: string): Promise<void> {
    try {
      await db
        .update(schema.appointments)
        .set({
          calendarSyncStatus: 'error',
          calendarSyncError: error,
          lastCalendarSync: new Date(),
        })
        .where(eq(schema.appointments.id, appointmentId));
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
    
    if (appointment.preparation) {
      description += `\nVorbereitung:\n${appointment.preparation}`;
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
    dataSnapshot: any = null,
    errorMessage?: string,
    errorDetails?: any
  ): Promise<void> {
    try {
      const logData: InsertCalendarSyncLog = {
        connectionId,
        appointmentId,
        operation,
        direction,
        status,
        dataSnapshot,
        errorMessage,
        errorDetails,
        completedAt: new Date(),
        duration: 0, // TODO: Add actual timing
      };

      await db.insert(schema.calendarSyncLogs).values(logData);
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
          calendarId: updatedConnection.calendarId!,
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
   * Validate OAuth state for CSRF protection
   */
  private validateOAuthState(
    state: string, 
    session: any, 
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
  private cleanupExpiredStates(session: any): void {
    if (!session.oauthStates) {
      return;
    }
    
    const now = Date.now();
    Object.keys(session.oauthStates).forEach(state => {
      if (session.oauthStates[state].expiresAt < now) {
        delete session.oauthStates[state];
      }
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();