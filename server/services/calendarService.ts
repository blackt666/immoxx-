/**
 * Apple Calendar Integration Service
 * Generates .ics files for CRM tasks and activities
 */

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  reminder?: number; // minutes before event
  url?: string;
}

export class CalendarService {
  /**
   * Generate iCalendar (.ics) format for a single event
   */
  generateICS(event: CalendarEvent): string {
    const now = new Date();

    // Parse and validate start date
    let startDate = new Date(event.startDate);
    if (isNaN(startDate.getTime())) {
      startDate = new Date(); // Fallback to now
    }

    // Parse and validate end date
    let endDate: Date;
    if (event.endDate) {
      endDate = new Date(event.endDate);
      if (isNaN(endDate.getTime())) {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
      }
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
    }

    // Format dates to iCal format (YYYYMMDDTHHmmssZ)
    const formatDate = (date: Date): string => {
      if (isNaN(date.getTime())) {
        date = new Date(); // Fallback to now if invalid
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bodensee Immobilien//CRM System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Bodensee Immobilien CRM',
      'X-WR-TIMEZONE:Europe/Berlin',
      'X-WR-CALDESC:CRM Events und Aufgaben',
      'BEGIN:VEVENT',
      `UID:${event.id}@bodensee-immobilien.de`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${this.escapeText(event.title)}`,
    ];

    if (event.description) {
      icsContent.push(`DESCRIPTION:${this.escapeText(event.description)}`);
    }

    if (event.location) {
      icsContent.push(`LOCATION:${this.escapeText(event.location)}`);
    }

    if (event.url) {
      icsContent.push(`URL:${event.url}`);
    }

    // Add reminder/alarm
    if (event.reminder) {
      icsContent.push(
        'BEGIN:VALARM',
        'TRIGGER:-PT' + event.reminder + 'M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Erinnerung: ${this.escapeText(event.title)}`,
        'END:VALARM'
      );
    }

    icsContent.push('END:VEVENT', 'END:VCALENDAR');

    return icsContent.join('\r\n');
  }

  /**
   * Generate iCalendar for multiple events
   */
  generateICSMultiple(events: CalendarEvent[]): string {
    const now = new Date();
    const formatDate = (date: Date): string => {
      if (isNaN(date.getTime())) {
        date = new Date(); // Fallback to now if invalid
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bodensee Immobilien//CRM System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Bodensee Immobilien CRM',
      'X-WR-TIMEZONE:Europe/Berlin',
      'X-WR-CALDESC:CRM Events und Aufgaben',
    ];

    for (const event of events) {
      // Parse and validate start date
      let startDate = new Date(event.startDate);
      if (isNaN(startDate.getTime())) {
        startDate = new Date(); // Fallback to now
      }

      // Parse and validate end date
      let endDate: Date;
      if (event.endDate) {
        endDate = new Date(event.endDate);
        if (isNaN(endDate.getTime())) {
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
        }
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
      }

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@bodensee-immobilien.de`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${this.escapeText(event.title)}`
      );

      if (event.description) {
        icsContent.push(`DESCRIPTION:${this.escapeText(event.description)}`);
      }

      if (event.location) {
        icsContent.push(`LOCATION:${this.escapeText(event.location)}`);
      }

      if (event.url) {
        icsContent.push(`URL:${event.url}`);
      }

      if (event.reminder) {
        icsContent.push(
          'BEGIN:VALARM',
          'TRIGGER:-PT' + event.reminder + 'M',
          'ACTION:DISPLAY',
          `DESCRIPTION:Erinnerung: ${this.escapeText(event.title)}`,
          'END:VALARM'
        );
      }

      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
  }

  /**
   * Convert CRM task to calendar event
   */
  taskToEvent(task: any): CalendarEvent {
    // Parse due_date safely
    let dueDate = new Date();
    if (task.due_date) {
      const parsed = new Date(task.due_date);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed;
      }
    }

    return {
      id: task.id,
      title: `[Aufgabe] ${task.title}`,
      description: task.description || undefined,
      location: undefined,
      startDate: dueDate,
      endDate: new Date(dueDate.getTime() + 30 * 60 * 1000), // 30 min default
      reminder: 30, // 30 minutes before
      url: `${process.env.BASE_URL || 'http://localhost:5001'}/admin/crm/tasks/${task.id}`,
    };
  }

  /**
   * Convert CRM activity to calendar event
   */
  activityToEvent(activity: any): CalendarEvent {
    const activityTypeMap: Record<string, string> = {
      call: 'Anruf',
      email: 'E-Mail',
      meeting: 'Termin',
      viewing_scheduled: 'Besichtigung',
      property_view: 'Objektansicht',
      note: 'Notiz',
    };

    const activityType = activityTypeMap[activity.activity_type] || activity.activity_type;

    return {
      id: activity.id,
      title: `[${activityType}] ${activity.subject || 'CRM Aktivität'}`,
      description: activity.description || activity.notes || undefined,
      location: activity.location || undefined,
      startDate: activity.scheduled_at ? new Date(activity.scheduled_at) : new Date(activity.created_at),
      endDate: activity.duration_minutes
        ? new Date(new Date(activity.scheduled_at || activity.created_at).getTime() + activity.duration_minutes * 60 * 1000)
        : undefined,
      reminder: 15, // 15 minutes before
      url: `${process.env.BASE_URL || 'http://localhost:5001'}/admin/crm/activities/${activity.id}`,
    };
  }

  /**
   * Escape special characters for iCalendar format
   */
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Generate filename for download
   */
  generateFilename(prefix: string = 'bodensee-immobilien'): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}-${date}.ics`;
  }
}

export const calendarService = new CalendarService();
