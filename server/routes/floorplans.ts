import express from 'express';
import { db } from '../db';
import { floorPlans } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { log } from '../lib/logger';

const router = express.Router();

// Get all floor plans
router.get('/', async (req, res) => {
  try {
    const { propertyId } = req.query;
    
    let allFloorPlans;
    if (propertyId) {
      allFloorPlans = await db.select().from(floorPlans)
        .where(eq(floorPlans.propertyId, parseInt(propertyId as string)))
        .orderBy(desc(floorPlans.createdAt));
    } else {
      allFloorPlans = await db.select().from(floorPlans).orderBy(desc(floorPlans.createdAt));
    }
    
    res.json(allFloorPlans);
  } catch (error) {
    log.error('Error fetching floor plans:', error);
    res.status(500).json({ error: 'Failed to fetch floor plans' });
  }
});

// Get floor plan by ID
router.get('/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const [plan] = await db.select().from(floorPlans).where(eq(floorPlans.id, planId)).limit(1);
    
    if (!plan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    log.error('Error fetching floor plan:', error);
    res.status(500).json({ error: 'Failed to fetch floor plan' });
  }
});

// Create new floor plan
router.post('/', async (req, res) => {
  try {
    const planData = req.body;
    
    const [newPlan] = await db.insert(floorPlans).values({
      propertyId: planData.propertyId ? parseInt(planData.propertyId) : null,
      name: planData.name,
      description: planData.description,
      floorLevel: planData.floorLevel || 'ground',
      planData: JSON.stringify(planData.planData || {}),
      thumbnail: planData.thumbnail,
      totalArea: planData.totalArea ? parseFloat(planData.totalArea) : null,
      dimensions: JSON.stringify(planData.dimensions || {}),
      status: planData.status || 'draft',
      isPublic: Boolean(planData.isPublic),
      createdBy: req.session?.user?.id || 1,
    }).returning();
    
    log.info('Floor plan created:', { id: newPlan.id, name: newPlan.name });
    res.status(201).json(newPlan);
  } catch (error) {
    log.error('Error creating floor plan:', error);
    res.status(500).json({ error: 'Failed to create floor plan' });
  }
});

// Update floor plan
router.put('/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const updates = req.body;
    
    // Convert planData to JSON string if it's an object
    if (updates.planData && typeof updates.planData === 'object') {
      updates.planData = JSON.stringify(updates.planData);
    }
    
    // Convert dimensions to JSON string if it's an object
    if (updates.dimensions && typeof updates.dimensions === 'object') {
      updates.dimensions = JSON.stringify(updates.dimensions);
    }
    
    const [updatedPlan] = await db.update(floorPlans)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(floorPlans.id, planId))
      .returning();
    
    if (!updatedPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    log.info('Floor plan updated:', { id: planId });
    res.json(updatedPlan);
  } catch (error) {
    log.error('Error updating floor plan:', error);
    res.status(500).json({ error: 'Failed to update floor plan' });
  }
});

// Delete floor plan
router.delete('/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    await db.delete(floorPlans).where(eq(floorPlans.id, planId));
    
    log.info('Floor plan deleted:', { id: planId });
    res.json({ success: true });
  } catch (error) {
    log.error('Error deleting floor plan:', error);
    res.status(500).json({ error: 'Failed to delete floor plan' });
  }
});

// Publish floor plan
router.post('/:id/publish', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    const [published] = await db.update(floorPlans)
      .set({
        status: 'published',
        isPublic: true,
        updatedAt: new Date(),
      })
      .where(eq(floorPlans.id, planId))
      .returning();
    
    if (!published) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    log.info('Floor plan published:', { id: planId });
    res.json(published);
  } catch (error) {
    log.error('Error publishing floor plan:', error);
    res.status(500).json({ error: 'Failed to publish floor plan' });
  }
});

export default router;
