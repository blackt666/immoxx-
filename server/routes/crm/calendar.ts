import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { crmTasks, crmActivities } from '../../database/schema/crm';
import { calendarService } from '../../services/calendarService';
import { eq, gte } from 'drizzle-orm';

const router = Router();

// =====================================================
// GET /api/crm/v2/calendar/task/:id - Export single task as .ics
// =====================================================
router.get('/task/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [task] = await db
      .select()
      .from(crmTasks)
      .where(eq(crmTasks.id, id))
      .limit(1);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const event = calendarService.taskToEvent(task);
    const icsContent = calendarService.generateICS(event);
    const filename = calendarService.generateFilename(`task-${task.id}`);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('❌ Calendar export task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export task to calendar',
    });
  }
});

// =====================================================
// GET /api/crm/v2/calendar/activity/:id - Export single activity as .ics
// =====================================================
router.get('/activity/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [activity] = await db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.id, id))
      .limit(1);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    const event = calendarService.activityToEvent(activity);
    const icsContent = calendarService.generateICS(event);
    const filename = calendarService.generateFilename(`activity-${activity.id}`);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('❌ Calendar export activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export activity to calendar',
    });
  }
});

// =====================================================
// GET /api/crm/v2/calendar/tasks - Export all tasks as .ics
// =====================================================
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    // Get all tasks (no date filter since due_date can be null)
    const tasks = await db
      .select()
      .from(crmTasks)
      .limit(100);

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tasks found',
      });
    }

    const events = tasks.map(task => calendarService.taskToEvent(task));
    const icsContent = calendarService.generateICSMultiple(events);
    const filename = calendarService.generateFilename('crm-tasks');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('❌ Calendar export tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export tasks to calendar',
    });
  }
});

// =====================================================
// GET /api/crm/v2/calendar/activities - Export all upcoming activities as .ics
// =====================================================
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Get all future activities
    const activities = await db
      .select()
      .from(crmActivities)
      .where(
        gte(crmActivities.scheduled_at, now.toISOString())
      )
      .limit(100);

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No upcoming activities found',
      });
    }

    const events = activities.map(activity => calendarService.activityToEvent(activity));
    const icsContent = calendarService.generateICSMultiple(events);
    const filename = calendarService.generateFilename('crm-activities');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('❌ Calendar export activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export activities to calendar',
    });
  }
});

// =====================================================
// GET /api/crm/v2/calendar/all - Export all upcoming events (tasks + activities)
// =====================================================
router.get('/all', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Get all future tasks and activities
    const [tasks, activities] = await Promise.all([
      db
        .select()
        .from(crmTasks)
        .where(gte(crmTasks.due_date, now.toISOString()))
        .limit(50),
      db
        .select()
        .from(crmActivities)
        .where(gte(crmActivities.scheduled_at, now.toISOString()))
        .limit(50),
    ]);

    if (tasks.length === 0 && activities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No upcoming events found',
      });
    }

    const taskEvents = tasks.map(task => calendarService.taskToEvent(task));
    const activityEvents = activities.map(activity => calendarService.activityToEvent(activity));
    const allEvents = [...taskEvents, ...activityEvents];

    const icsContent = calendarService.generateICSMultiple(allEvents);
    const filename = calendarService.generateFilename('crm-all-events');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('❌ Calendar export all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export events to calendar',
    });
  }
});

// =====================================================
// GET /api/crm/v2/calendar/subscribe - Subscribe URL (webcal://)
// =====================================================
router.get('/subscribe', async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const webcalUrl = baseUrl.replace('http://', 'webcal://').replace('https://', 'webcal://');

    res.json({
      success: true,
      data: {
        webcalUrl: `${webcalUrl}/api/crm/v2/calendar/all`,
        httpUrl: `${baseUrl}/api/crm/v2/calendar/all`,
        instructions: {
          apple: 'Open Apple Calendar → File → New Calendar Subscription → Paste URL',
          google: 'Open Google Calendar → Other Calendars → From URL → Paste URL',
          outlook: 'Open Outlook Calendar → Add Calendar → From Internet → Paste URL',
        },
      },
    });
  } catch (error) {
    console.error('❌ Calendar subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription URL',
    });
  }
});

export default router;
