import { Router, Request, Response } from "express";
import { leadService } from "../../services/crm/leadService";
import { z } from "zod";

const router = Router();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().default("manual"),
  source_detail: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  property_type: z.string().optional(),
  preferred_location: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assigned_to: z.number().optional(),
});

const updateLeadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  pipeline_stage: z.string().optional(),
  assigned_to: z.number().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  property_type: z.string().optional(),
  preferred_location: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const moveStageSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  note: z.string().optional(),
});

// =====================================================
// GET /api/crm/leads - Get all leads with filters
// =====================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      status,
      temperature,
      assigned_to,
      pipeline_stage,
      source,
      search,
      limit,
      offset,
    } = req.query;

    const filters = {
      status: status as string | undefined,
      temperature: temperature as string | undefined,
      assigned_to: assigned_to ? parseInt(assigned_to as string) : undefined,
      pipeline_stage: pipeline_stage as string | undefined,
      source: source as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await leadService.getLeads(filters);

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get leads",
    });
  }
});

// =====================================================
// GET /api/crm/leads/kanban - Get leads grouped by stage
// =====================================================
router.get("/kanban", async (req: Request, res: Response) => {
  try {
    const leadsByStage = await leadService.getLeadsByStage();

    res.json({
      success: true,
      data: leadsByStage,
    });
  } catch (error) {
    console.error("Get kanban leads error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get kanban data",
    });
  }
});

// =====================================================
// GET /api/crm/leads/hot - Get hot leads (score >= 80)
// =====================================================
router.get("/hot", async (req: Request, res: Response) => {
  try {
    const leads = await leadService.getHotLeads();

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Get hot leads error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get hot leads",
    });
  }
});

// =====================================================
// GET /api/crm/leads/unassigned - Get unassigned leads
// =====================================================
router.get("/unassigned", async (req: Request, res: Response) => {
  try {
    const leads = await leadService.getUnassignedLeads();

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Get unassigned leads error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unassigned leads",
    });
  }
});

// =====================================================
// GET /api/crm/leads/search - Search leads
// =====================================================
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query 'q' is required",
      });
    }

    const leads = await leadService.searchLeads(
      q as string,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Search leads error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to search leads",
    });
  }
});

// =====================================================
// GET /api/crm/leads/:id - Get single lead with details
// =====================================================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await leadService.getLeadById(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get lead by ID error:", error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : "Lead not found",
    });
  }
});

// =====================================================
// POST /api/crm/leads - Create new lead
// =====================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = createLeadSchema.parse(req.body);

    // Add created_by from session user if available
    const userId = (req as any).user?.id;

    const lead = await leadService.createLead({
      ...validatedData,
      created_by: userId,
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: "Lead created successfully",
    });
  } catch (error) {
    console.error("Create lead error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lead",
    });
  }
});

// =====================================================
// PATCH /api/crm/leads/:id - Update lead
// =====================================================
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateLeadSchema.parse(req.body);

    const userId = (req as any).user?.id;

    const lead = await leadService.updateLead(id, validatedData, userId);

    res.json({
      success: true,
      data: lead,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Update lead error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lead",
    });
  }
});

// =====================================================
// POST /api/crm/leads/:id/move-stage - Move lead to new stage
// =====================================================
router.post("/:id/move-stage", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, note } = moveStageSchema.parse(req.body);

    const userId = (req as any).user?.id;

    const lead = await leadService.moveLeadStage(id, stage, userId, note);

    res.json({
      success: true,
      data: lead,
      message: `Lead moved to ${stage}`,
    });
  } catch (error) {
    console.error("Move lead stage error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to move lead stage",
    });
  }
});

// =====================================================
// POST /api/crm/leads/:id/assign - Assign lead to user
// =====================================================
router.post("/:id/assign", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "user_id is required",
      });
    }

    const lead = await leadService.assignLead(id, user_id);

    res.json({
      success: true,
      data: lead,
      message: "Lead assigned successfully",
    });
  } catch (error) {
    console.error("Assign lead error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign lead",
    });
  }
});

// =====================================================
// POST /api/crm/leads/:id/recalculate-score - Recalculate lead score
// =====================================================
router.post("/:id/recalculate-score", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await leadService.recalculateScore(id);

    res.json({
      success: true,
      data: lead,
      message: "Score recalculated successfully",
    });
  } catch (error) {
    console.error("Recalculate score error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to recalculate score",
    });
  }
});

// =====================================================
// DELETE /api/crm/leads/:id - Delete lead
// =====================================================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await leadService.deleteLead(id);

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete lead",
    });
  }
});

export default router;
