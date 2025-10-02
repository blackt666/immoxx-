
import { google } from 'googleapis';
import ical from 'ical-generator';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
}

export class CalendarSyncService {
  private googleAuth: any;

  constructor() {
    this.googleAuth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
  }

  async syncToGoogleCalendar(event: CalendarEvent): Promise<string> {
    try {
      const auth = await this.googleAuth.getClient();
      const calendar = google.calendar({ version: 'v3', auth });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'Europe/Berlin'
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'Europe/Berlin'
        },
        location: event.location,
        attendees: event.attendees?.map(email => ({ email }))
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent
      });

      return response.data.id!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Google Calendar sync error:', errorMessage);
      throw new Error(`Google Calendar sync failed: ${errorMessage}`);
    }
  }

  generateAppleCalendar(events: CalendarEvent[]): string {
    const cal = ical({
      prodId: '//Bodensee Immobilien Müller//Calendar//DE',
      name: 'Bodensee Immobilien Termine',
      timezone: 'Europe/Berlin'
    });

    events.forEach(event => {
      const calEvent = cal.createEvent({
        start: event.start,
        end: event.end,
        summary: event.title,
        description: event.description,
        location: event.location
      });
      calEvent.uid(event.id + '@bodensee-immobilien.de');
    });

    return cal.toString();
  }

  async createAppointment(appointmentData: any): Promise<CalendarEvent> {
    // Convert string dates to Date objects if needed
    const startDate = typeof appointmentData.date === 'string' 
      ? new Date(appointmentData.date) 
      : appointmentData.date;
    
    // Use appointment duration if provided, otherwise default to 60 minutes
    const durationMinutes = appointmentData.duration && appointmentData.duration > 0 
      ? appointmentData.duration 
      : 60;
    
    const event: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: `Besichtigung: ${appointmentData.propertyTitle}`,
      description: `Immobilienbesichtigung mit ${appointmentData.customerName}\nTelefon: ${appointmentData.phone}`,
      start: startDate,
      end: new Date(startDate.getTime() + durationMinutes * 60 * 1000),
      location: appointmentData.address,
      attendees: [appointmentData.email]
    };

    // Sync to both calendars
    try {
      await this.syncToGoogleCalendar(event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('Google Calendar sync failed:', errorMessage);
    }

    return event;
  }
}
