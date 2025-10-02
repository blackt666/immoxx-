import { Router } from 'express';
import { db } from '../db';
import { leads, customers, leadSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CRM_STAGES, DEAL_TYPES, validateProbability } from '@shared/constants';
import { z } from 'zod';

const router = Router();

// Helper: Validate customer exists
async function validateCustomerExists(customerId: number): Promise<boolean> {
  const customer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return customer.length > 0;
}

// GET leads with filters
router.get('/api/crm/leads', async (req, res) => {
  try {
    const { stage, dealType, limit = 10, offset = 0 } = req.query;
    
    const conditions = [];
    
    // Validate stage filter
    if (stage && stage !== 'all') {
      if (!Object.values(CRM_STAGES).includes(stage as string)) {
        return res.status(400).json({ 
          error: 'Invalid stage filter',
          validStages: Object.values(CRM_STAGES)
        });
      }
      conditions.push(eq(leads.stage, stage as string));
    }
    
    // Validate dealType filter  
    if (dealType && dealType !== 'all') {
      if (!Object.values(DEAL_TYPES).includes(dealType as string)) {
        return res.status(400).json({
          error: 'Invalid deal type filter',
          validTypes: Object.values(DEAL_TYPES)
        });
      }
      conditions.push(eq(leads.dealType, dealType as string));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get leads with customer info
    const leadsData = await db
      .select({
        lead: leads,
        customer: customers
      })
      .from(leads)
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause);
    
    res.json({
      data: leadsData.map(({ lead, customer }) => ({
        ...lead,
        customer
      })),
      total: countResult[0]?.count || 0,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST create new lead
router.post('/api/crm/leads', async (req, res) => {
  try {
    // Validate request body
    const validationResult = leadSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten()
      });
    }
    
    const data = validationResult.data;
    
    // Check if customer exists
    const customerExists = await validateCustomerExists(data.customerId);
    if (!customerExists) {
      return res.status(400).json({
        error: `Customer with ID ${data.customerId} does not exist`
      });
    }
    
    // Normalize probability
    data.probability = validateProbability(data.probability);
    
    // Insert lead
    const [newLead] = await db.insert(leads).values(data).returning();
    
    // Fetch with customer info
    const [leadWithCustomer] = await db
      .select({
        lead: leads,
        customer: customers
      })
      .from(leads)
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .where(eq(leads.id, newLead.id));
    
    res.status(201).json({
      ...leadWithCustomer.lead,
      customer: leadWithCustomer.customer
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT update lead
router.put('/api/crm/leads/:id', async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    
    // Check if lead exists
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Validate update data
    const updateSchema = leadSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten()
      });
    }
    
    const updateData = validationResult.data;
    
    // Validate customer if being updated
    if (updateData.customerId) {
      const customerExists = await validateCustomerExists(updateData.customerId);
      if (!customerExists) {
        return res.status(400).json({
          error: `Customer with ID ${updateData.customerId} does not exist`
        });
      }
    }
    
    // Normalize probability if provided
    if (updateData.probability !== undefined) {
      updateData.probability = validateProbability(updateData.probability);
    }
    
    // Update lead
    const [updatedLead] = await db
      .update(leads)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(leads.id, leadId))
      .returning();
    
    // Fetch with customer info
    const [leadWithCustomer] = await db
      .select({
        lead: leads,
        customer: customers
      })
      .from(leads)
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .where(eq(leads.id, leadId));
    
    res.json({
      ...leadWithCustomer.lead,
      customer: leadWithCustomer.customer
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// GET analytics endpoint
router.get('/api/crm/analytics', async (req, res) => {
  try {
    // Pipeline value by stage
    const pipelineByStage = await db
      .select({
        stage: leads.stage,
        totalValue: sql<number>`sum(${leads.value})`,
        weightedValue: sql<number>`sum(${leads.value} * ${leads.probability} / 100.0)`,
        count: sql<number>`count(*)`
      })
      .from(leads)
      .groupBy(leads.stage);
    
    // Overall metrics
    const overallMetrics = await db
      .select({
        totalLeads: sql<number>`count(*)`,
        totalValue: sql<number>`sum(${leads.value})`,
        weightedValue: sql<number>`sum(${leads.value} * ${leads.probability} / 100.0)`,
        avgProbability: sql<number>`avg(${leads.probability})`,
        wonDeals: sql<number>`count(case when ${leads.stage} = ${CRM_STAGES.WON} then 1 end)`,
        lostDeals: sql<number>`count(case when ${leads.stage} = ${CRM_STAGES.LOST} then 1 end)`
      })
      .from(leads);
    
    res.json({
      pipelineByStage,
      overall: overallMetrics[0] || {}
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
