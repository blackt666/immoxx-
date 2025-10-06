import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { crmLeads, crmActivities, crmTasks } from '../../database/schema/crm';
import { eq, desc, and, gte } from 'drizzle-orm';
import { log } from '../../lib/logger.js';

const router = Router();

interface Notification {
  id: string;
  type: 'lead_created' | 'lead_assigned' | 'activity_added' | 'task_overdue' | 'stage_changed';
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, any>;
}

// In-memory notification store (in production, use database table)
const notifications = new Map<string, Notification[]>();

/**
 * GET /api/crm/notifications - Get user notifications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'system';
    const { since, unread_only = 'false' } = req.query;

    // Get recent activities for notifications
    const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get recent leads
    const recentLeads = await db
      .select()
      .from(crmLeads)
      .where(gte(crmLeads.created_at, sinceDate))
      .orderBy(desc(crmLeads.created_at))
      .limit(10);

    // Get recent activities
    const recentActivities = await db
      .select()
      .from(crmActivities)
      .where(gte(crmActivities.created_at, sinceDate))
      .orderBy(desc(crmActivities.created_at))
      .limit(10);

    // Get overdue tasks
    const overdueTasks = await db
      .select()
      .from(crmTasks)
      .where(
        and(
          eq(crmTasks.status, 'todo'),
          gte(new Date(), crmTasks.due_date)
        )
      )
      .limit(5);

    // Build notification array
    const userNotifications: Notification[] = [];

    // Add lead notifications
    recentLeads.forEach((lead) => {
      userNotifications.push({
        id: `lead-${lead.id}`,
        type: 'lead_created',
        title: 'Neuer Lead',
        message: `${lead.first_name} ${lead.last_name} wurde erstellt`,
        link: `/crm?leadId=${lead.id}`,
        timestamp: new Date(lead.created_at),
        read: false,
        metadata: { leadId: lead.id },
      });
    });

    // Add activity notifications
    recentActivities.forEach((activity) => {
      userNotifications.push({
        id: `activity-${activity.id}`,
        type: 'activity_added',
        title: getActivityTitle(activity.activity_type),
        message: activity.subject || activity.description || 'Neue Aktivität',
        link: `/crm?leadId=${activity.lead_id}`,
        timestamp: new Date(activity.created_at),
        read: false,
        metadata: { activityId: activity.id, leadId: activity.lead_id },
      });
    });

    // Add overdue task notifications
    overdueTasks.forEach((task) => {
      userNotifications.push({
        id: `task-overdue-${task.id}`,
        type: 'task_overdue',
        title: 'Aufgabe überfällig',
        message: task.title,
        link: `/crm?leadId=${task.lead_id}`,
        timestamp: new Date(task.due_date),
        read: false,
        metadata: { taskId: task.id, leadId: task.lead_id },
      });
    });

    // Sort by timestamp (newest first)
    userNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Filter unread if requested
    const filteredNotifications = unread_only === 'true'
      ? userNotifications.filter(n => !n.read)
      : userNotifications;

    res.json({
      success: true,
      data: {
        notifications: filteredNotifications.slice(0, 20), // Limit to 20
        unread_count: userNotifications.filter(n => !n.read).length,
        total: userNotifications.length,
      },
    });
  } catch (error) {
    log.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
    });
  }
});

/**
 * POST /api/crm/notifications/:id/read - Mark notification as read
 */
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id || 'system';

    // In a real implementation, update database record
    // For now, just acknowledge
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    log.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
    });
  }
});

/**
 * POST /api/crm/notifications/read-all - Mark all notifications as read
 */
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'system';

    // In a real implementation, update all user's notifications
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    log.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
    });
  }
});

// Helper functions
function getActivityTitle(activityType: string): string {
  const titles: Record<string, string> = {
    call: 'Anruf getätigt',
    email: 'E-Mail gesendet',
    meeting: 'Meeting durchgeführt',
    note: 'Notiz hinzugefügt',
    property_view: 'Immobilie angesehen',
    viewing_scheduled: 'Besichtigung geplant',
    offer_sent: 'Angebot gesendet',
    document_sent: 'Dokument gesendet',
    sms: 'SMS gesendet',
  };
  return titles[activityType] || 'Neue Aktivität';
}

export default router;
