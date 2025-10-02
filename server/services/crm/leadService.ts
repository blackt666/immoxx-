import { db } from "../../db";
import { eq, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { crmLeads, crmActivities, crmTasks } from "../../database/schema/crm";

export interface LeadFilters {
  status?: string;
  temperature?: string;
  assigned_to?: number;
  pipeline_stage?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateLeadInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  source_detail?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  preferred_location?: string;
  timeline?: string;
  notes?: string;
  tags?: string[];
  assigned_to?: number;
  created_by?: number;
}

export interface UpdateLeadInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  pipeline_stage?: string;
  assigned_to?: number;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  preferred_location?: string;
  timeline?: string;
  notes?: string;
  tags?: string[];
}

export class LeadService {
  /**
   * Get all leads with filters and pagination
   */
  async getLeads(filters: LeadFilters = {}) {
    const {
      status,
      temperature,
      assigned_to,
      pipeline_stage,
      source,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    let query = db.select().from(crmLeads);

    // Apply filters
    const conditions = [];

    if (status) {
      conditions.push(eq(crmLeads.status, status));
    }

    if (temperature) {
      conditions.push(eq(crmLeads.temperature, temperature));
    }

    if (assigned_to) {
      conditions.push(eq(crmLeads.assigned_to, assigned_to));
    }

    if (pipeline_stage) {
      conditions.push(eq(crmLeads.pipeline_stage, pipeline_stage));
    }

    if (source) {
      conditions.push(eq(crmLeads.source, source));
    }

    if (search) {
      // Search in name, email, phone
      conditions.push(
        sql`(
          LOWER(${crmLeads.first_name}) LIKE LOWER('%${search}%') OR
          LOWER(${crmLeads.last_name}) LIKE LOWER('%${search}%') OR
          LOWER(${crmLeads.email}) LIKE LOWER('%${search}%') OR
          ${crmLeads.phone} LIKE '%${search}%'
        )`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by score (hot leads first), then by created_at
    const leads = await query
      .orderBy(desc(crmLeads.score), desc(crmLeads.created_at))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmLeads)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      leads,
      total: count,
      limit,
      offset,
      hasMore: offset + leads.length < count,
    };
  }

  /**
   * Get single lead by ID with related data
   */
  async getLeadById(leadId: string) {
    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, leadId));

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Get activities
    const activities = await db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.lead_id, leadId))
      .orderBy(desc(crmActivities.created_at));

    // Get tasks
    const tasks = await db
      .select()
      .from(crmTasks)
      .where(eq(crmTasks.lead_id, leadId))
      .orderBy(asc(crmTasks.due_date));

    return {
      lead,
      activities,
      tasks,
    };
  }

  /**
   * Create a new lead
   */
  async createLead(data: CreateLeadInput) {
    const [lead] = await db
      .insert(crmLeads)
      .values({
        ...data,
        score: 0, // Initial score
        temperature: "cold",
        status: "new",
        pipeline_stage: "inbox",
        created_at: new Date(),
      })
      .returning();

    // Auto-assign if rules exist (can be enhanced later)
    if (!data.assigned_to) {
      // Implement auto-assignment logic here
      // For now, leave unassigned
    }

    // Calculate initial score
    await this.recalculateScore(lead.id);

    // Create initial activity (Lead Created)
    await db.insert(crmActivities).values({
      lead_id: lead.id,
      activity_type: "note",
      subject: "Lead Created",
      description: `Lead captured from ${data.source}`,
      created_by: data.created_by,
    });

    return lead;
  }

  /**
   * Update lead
   */
  async updateLead(leadId: string, data: UpdateLeadInput, userId?: number) {
    // Track stage change
    const [oldLead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, leadId));

    if (!oldLead) {
      throw new Error("Lead not found");
    }

    const updateData: any = {
      ...data,
      updated_at: new Date(),
    };

    // If pipeline stage changed, log it
    if (data.pipeline_stage && data.pipeline_stage !== oldLead.pipeline_stage) {
      updateData.stage_changed_at = new Date();

      // Create activity for stage change
      await db.insert(crmActivities).values({
        lead_id: leadId,
        activity_type: "note",
        subject: "Pipeline Stage Changed",
        description: `Moved from "${oldLead.pipeline_stage}" to "${data.pipeline_stage}"`,
        created_by: userId,
      });
    }

    const [lead] = await db
      .update(crmLeads)
      .set(updateData)
      .where(eq(crmLeads.id, leadId))
      .returning();

    return lead;
  }

  /**
   * Move lead to new pipeline stage
   */
  async moveLeadStage(leadId: string, newStage: string, userId?: number, note?: string) {
    const [oldLead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, leadId));

    if (!oldLead) {
      throw new Error("Lead not found");
    }

    // Determine new status based on stage
    let newStatus = oldLead.status;
    switch (newStage) {
      case "contacted":
        newStatus = "contacted";
        break;
      case "qualified":
      case "viewing_scheduled":
        newStatus = "qualified";
        break;
      case "offer_made":
      case "negotiation":
        newStatus = "negotiation";
        break;
      case "won":
        newStatus = "won";
        break;
      case "lost":
        newStatus = "lost";
        break;
    }

    const [lead] = await db
      .update(crmLeads)
      .set({
        pipeline_stage: newStage,
        status: newStatus,
        stage_changed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(crmLeads.id, leadId))
      .returning();

    // Log activity
    await db.insert(crmActivities).values({
      lead_id: leadId,
      activity_type: "note",
      subject: "Pipeline Stage Changed",
      description: note || `Moved to "${newStage}"`,
      created_by: userId,
    });

    return lead;
  }

  /**
   * Recalculate lead score
   */
  async recalculateScore(leadId: string) {
    // Use PostgreSQL function to calculate score
    const result = await db.execute(sql`
      SELECT calculate_lead_score(${leadId}::uuid) as score
    `);

    const score = result.rows[0]?.score || 0;

    // Update lead with new score (trigger will update temperature)
    const [lead] = await db
      .update(crmLeads)
      .set({ score })
      .where(eq(crmLeads.id, leadId))
      .returning();

    return lead;
  }

  /**
   * Assign lead to user
   */
  async assignLead(leadId: string, userId: number) {
    const [lead] = await db
      .update(crmLeads)
      .set({
        assigned_to: userId,
        assigned_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(crmLeads.id, leadId))
      .returning();

    // Log activity
    await db.insert(crmActivities).values({
      lead_id: leadId,
      activity_type: "note",
      subject: "Lead Assigned",
      description: `Lead assigned to user ${userId}`,
      assigned_to: userId,
    });

    return lead;
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId: string) {
    // Cascade delete will handle activities and tasks
    await db.delete(crmLeads).where(eq(crmLeads.id, leadId));

    return { success: true };
  }

  /**
   * Get leads by pipeline stage (for Kanban board)
   */
  async getLeadsByStage() {
    const stages = [
      "inbox",
      "contacted",
      "qualified",
      "viewing_scheduled",
      "offer_made",
      "negotiation",
      "won",
      "lost",
    ];

    const leadsByStage: Record<string, any[]> = {};

    for (const stage of stages) {
      const leads = await db
        .select()
        .from(crmLeads)
        .where(eq(crmLeads.pipeline_stage, stage))
        .orderBy(desc(crmLeads.score), desc(crmLeads.created_at));

      leadsByStage[stage] = leads;
    }

    return leadsByStage;
  }

  /**
   * Get hot leads (score >= 80)
   */
  async getHotLeads() {
    const leads = await db
      .select()
      .from(crmLeads)
      .where(gte(crmLeads.score, 80))
      .orderBy(desc(crmLeads.score));

    return leads;
  }

  /**
   * Get unassigned leads
   */
  async getUnassignedLeads() {
    const leads = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.assigned_to, null))
      .orderBy(desc(crmLeads.created_at));

    return leads;
  }

  /**
   * Get leads by assigned user
   */
  async getLeadsByUser(userId: number) {
    const leads = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.assigned_to, userId))
      .orderBy(desc(crmLeads.score), desc(crmLeads.created_at));

    return leads;
  }

  /**
   * Search leads
   */
  async searchLeads(searchTerm: string, limit: number = 20) {
    const leads = await db
      .select()
      .from(crmLeads)
      .where(
        sql`(
          LOWER(${crmLeads.first_name}) LIKE LOWER('%${searchTerm}%') OR
          LOWER(${crmLeads.last_name}) LIKE LOWER('%${searchTerm}%') OR
          LOWER(${crmLeads.email}) LIKE LOWER('%${searchTerm}%') OR
          ${crmLeads.phone} LIKE '%${searchTerm}%'
        )`
      )
      .limit(limit);

    return leads;
  }
}

export const leadService = new LeadService();
