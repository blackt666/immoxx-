import { Router, Request, Response } from "express";
import { db } from "../../db";
import { crmActivities } from "../../database/schema/crm";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createActivitySchema = z.object({
  activity_type: z.enum([
    "call",
    "email",
    "meeting",
    "note",
    "property_view",
    "viewing_scheduled",
    "offer_sent",
    "document_sent",
    "sms",
  ]),
  lead_id: z.string().optional(),
  contact_id: z.string().optional(),
  property_id: z.number().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  outcome: z.string().optional(),
  scheduled_at: z.string().optional(),
  completed_at: z.string().optional(),
  duration_minutes: z.number().optional(),
  assigned_to: z.number().optional(),
  email_from: z.string().optional(),
  email_to: z.string().optional(),
  email_subject: z.string().optional(),
});

// =====================================================
// GET /api/crm/activities - Get all activities
// =====================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const { lead_id, contact_id, activity_type, limit = "50" } = req.query;

    let query = db.select().from(crmActivities);

    const conditions = [];
    if (lead_id) {
      conditions.push(eq(crmActivities.lead_id, lead_id as string));
    }
    if (contact_id) {
      conditions.push(eq(crmActivities.contact_id, contact_id as string));
    }
    if (activity_type) {
      conditions.push(eq(crmActivities.activity_type, activity_type as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const activities = await query
      .orderBy(desc(crmActivities.created_at))
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get activities",
    });
  }
});

// =====================================================
// GET /api/crm/activities/:id - Get single activity
// =====================================================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [activity] = await db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.id, id));

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found",
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Get activity error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get activity",
    });
  }
});

// =====================================================
// POST /api/crm/activities - Create new activity
// =====================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = createActivitySchema.parse(req.body);

    const userId = (req as any).user?.id;

    const [activity] = await db
      .insert(crmActivities)
      .values({
        ...validatedData,
        created_by: userId,
        created_at: new Date(),
      })
      .returning();

    // If this is a scored activity, recalculate lead score
    if (activity.lead_id && ["call", "email", "meeting", "property_view"].includes(activity.activity_type)) {
      // Trigger score recalculation (can be done via leadService)
      // For now, just log it
      console.log(`Activity created for lead ${activity.lead_id}, score recalculation needed`);
    }

    res.status(201).json({
      success: true,
      data: activity,
      message: "Activity logged successfully",
    });
  } catch (error) {
    console.error("Create activity error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create activity",
    });
  }
});

// =====================================================
// PATCH /api/crm/activities/:id - Update activity
// =====================================================
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [activity] = await db
      .update(crmActivities)
      .set({
        ...req.body,
        updated_at: new Date(),
      })
      .where(eq(crmActivities.id, id))
      .returning();

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found",
      });
    }

    res.json({
      success: true,
      data: activity,
      message: "Activity updated successfully",
    });
  } catch (error) {
    console.error("Update activity error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update activity",
    });
  }
});

// =====================================================
// DELETE /api/crm/activities/:id - Delete activity
// =====================================================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(crmActivities).where(eq(crmActivities.id, id));

    res.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Delete activity error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete activity",
    });
  }
});

// =====================================================
// POST /api/crm/activities/email-opened - Track email open
// =====================================================
router.post("/email-opened", async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.body;

    if (!activity_id) {
      return res.status(400).json({
        success: false,
        error: "activity_id is required",
      });
    }

    const [activity] = await db
      .update(crmActivities)
      .set({
        email_opened: 1, // SQLite uses 1 for true
        email_opened_at: new Date(),
      })
      .where(eq(crmActivities.id, activity_id))
      .returning();

    res.json({
      success: true,
      data: activity,
      message: "Email open tracked",
    });
  } catch (error) {
    console.error("Track email open error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to track email open",
    });
  }
});

// =====================================================
// POST /api/crm/activities/email-clicked - Track email click
// =====================================================
router.post("/email-clicked", async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.body;

    if (!activity_id) {
      return res.status(400).json({
        success: false,
        error: "activity_id is required",
      });
    }

    const [activity] = await db
      .update(crmActivities)
      .set({
        email_clicked: 1,
      })
      .where(eq(crmActivities.id, activity_id))
      .returning();

    res.json({
      success: true,
      data: activity,
      message: "Email click tracked",
    });
  } catch (error) {
    console.error("Track email click error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to track email click",
    });
  }
});

export default router;
