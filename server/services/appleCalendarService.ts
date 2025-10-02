// import * as dav from 'dav';
// import * as ical from 'node-ical';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { CalendarConnection, Appointment, InsertCalendarEvent, InsertCalendarSyncLog } from '@shared/schema';
import { encrypt, decrypt } from '../lib/crypto.js';

interface AppleCalendarCredentials {
  username: string; // Apple ID
  password: string; // App-specific password
  serverUrl?: string; // iCloud CalDAV server URL
}

interface CalDAVEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend: Date;
  location?: string;
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  rrule?: string; // Recurring rule
}

export class AppleCalendarService {
  private readonly DEFAULT_CALDAV_URL = 'https://caldav.icloud.com';
  private davClient: any | null = null;

  constructor() {}

  // Stub methods to prevent errors - Apple Calendar disabled temporarily
  async createConnection(credentials: AppleCalendarCredentials): Promise<any> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }

  async authenticateAndSave(agentId: string, credentials: AppleCalendarCredentials): Promise<CalendarConnection> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }

  async testConnection(connection: CalendarConnection): Promise<boolean> {
    return false; // Always return false since service is disabled
  }

  async createEvent(connection: CalendarConnection, appointment: Appointment): Promise<string> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }

  async updateEvent(connection: CalendarConnection, eventId: string, appointment: Appointment): Promise<void> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }

  async deleteEvent(connection: CalendarConnection, eventId: string, appointmentId: number): Promise<void> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }

  async getEvents(connection: CalendarConnection, startDate: Date, endDate: Date): Promise<any[]> {
    return []; // Return empty array since service is disabled
  }

  async syncEvents(connection: CalendarConnection): Promise<void> {
    throw new Error('Apple Calendar service is temporarily disabled');
  }
}

// Create and export the singleton instance
export const appleCalendarService = new AppleCalendarService();