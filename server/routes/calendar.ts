import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import * as schema from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { GoogleCalendarService } from '../services/googleCalendarService.js';
import { TokenMaintenanceService } from '../services/tokenMaintenanceService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const googleCalendarService = new GoogleCalendarService();
const tokenMaintenanceService = new TokenMaintenanceService();

// Extends the Express Request interface to include a custom 'agentId' property.
declare global {
    namespace Express {
        interface Request {
            agentId?: string;
        }
    }
}

// Route to get the Google authentication URL
router.get('/auth/url', authMiddleware, (req: Request, res: Response) => {
    const agentId = req.agentId;
    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const authUrl = googleCalendarService.generateAuthUrl(agentId, req);
        res.status(200).json({ authUrl });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to generate auth URL', error: err.message });
    }
});

// Route to handle the OAuth2 callback from Google
router.get('/auth/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!state || typeof state !== 'string') {
        return res.status(400).json({ message: 'State parameter is missing or invalid.' });
    }
    
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: 'Authorization code is missing or invalid.' });
    }

    try {
        await googleCalendarService.handleAuthCallback(code, state, req);
        res.redirect('/admin/settings?status=success');
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error handling Google Calendar callback:', err);
        res.redirect(`/admin/settings?status=error&message=${encodeURIComponent(err.message)}`);
    }
});

// Route to get all calendar connections for the authenticated agent
router.get('/connections', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const connections = await db.query.calendarConnections.findMany({
            where: eq(schema.calendarConnections.agentId, agentId)
        });
        res.json(connections);
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to get connections', error: err.message });
    }
});

// Route to delete a calendar connection
router.delete('/connections/:connectionId', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    const connectionId = parseInt(req.params.connectionId, 10);

    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (isNaN(connectionId)) {
        return res.status(400).json({ message: 'Invalid connection ID' });
    }

    try {
        await googleCalendarService.revokeConnection(connectionId, agentId);
        res.status(200).json({ message: 'Connection deleted successfully.' });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to delete connection', error: err.message });
    }
});

// Route to trigger a manual synchronization for a connection
router.post('/connections/:connectionId/sync', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    const connectionId = parseInt(req.params.connectionId, 10);

    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (isNaN(connectionId)) {
        return res.status(400).json({ message: 'Invalid connection ID' });
    }

    try {
        await googleCalendarService.syncAllAppointments(connectionId, parseInt(agentId));
        res.status(200).json({ message: 'Sync started successfully.' });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to start sync', error: err.message });
    }
});

// Route to get all appointments for the authenticated agent
router.get('/appointments', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const appointments = await db.query.appointments.findMany({
            where: eq(schema.appointments.agentId, parseInt(agentId)),
            limit: 100,
            orderBy: [desc(schema.appointments.startTime)]
        });
        res.json(appointments);
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
    }
});

// Route to create a new appointment
router.post('/appointments', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const connection = await googleCalendarService.getPrimaryConnection(agentId);
        const newAppointment = await googleCalendarService.createEvent(connection, req.body);
        res.status(201).json(newAppointment);
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to create appointment', error: err.message });
    }
});

// Route to update an existing appointment
router.put('/appointments/:appointmentId', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    const appointmentId = req.params.appointmentId;

    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const connection = await googleCalendarService.getPrimaryConnection(agentId);
        await googleCalendarService.updateEvent(connection, req.body, appointmentId);
        res.status(200).json({ message: 'Appointment updated successfully' });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to update appointment', error: err.message });
    }
});

// Route to delete an appointment
router.delete('/appointments/:appointmentId', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    const appointmentId = req.params.appointmentId;

    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const connection = await googleCalendarService.getPrimaryConnection(agentId);
        await googleCalendarService.deleteEvent(connection, appointmentId);
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Failed to delete appointment', error: err.message });
    }
});

// Route to run the token maintenance job for the agent
router.post('/maintenance/run', authMiddleware, async (req: Request, res: Response) => {
    const agentId = req.agentId;
    if (!agentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        await tokenMaintenanceService.runMaintenanceJobForAgent(agentId);
        res.status(200).json({ message: 'Token maintenance job completed successfully.' });
    } catch (error: unknown) {
        const err = error as Error;
        res.status(500).json({ message: 'Token maintenance job failed', error: err.message });
    }
});

export default router;
