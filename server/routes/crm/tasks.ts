import { Router, Request, Response } from "express";
import { db } from "../../db";
import { crmTasks } from "../../database/schema/crm";
import { eq, and, asc, lte, gte } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const router = Router();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).default("todo"),
  due_date: z.string().optional(),
  reminder_at: z.string().optional(),
  lead_id: z.string().optional(),
  contact_id: z.string().optional(),
  assigned_to: z.number().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
  due_date: z.string().optional(),
  reminder_at: z.string().optional(),
  assigned_to: z.number().optional(),
});

// =====================================================
// GET /api/crm/tasks - Get all tasks
// =====================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const { lead_id, assigned_to, status, priority, limit = "50" } = req.query;

    let query = db.select().from(crmTasks);

    const conditions = [];
    if (lead_id) {
      conditions.push(eq(crmTasks.lead_id, lead_id as string));
    }
    if (assigned_to) {
      conditions.push(eq(crmTasks.assigned_to, parseInt(assigned_to as string)));
    }
    if (status) {
      conditions.push(eq(crmTasks.status, status as string));
    }
    if (priority) {
      conditions.push(eq(crmTasks.priority, priority as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const tasks = await query
      .orderBy(asc(crmTasks.due_date))
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tasks",
    });
  }
});

// =====================================================
// GET /api/crm/tasks/overdue - Get overdue tasks
// =====================================================
router.get("/overdue", async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const tasks = await db
      .select()
      .from(crmTasks)
      .where(
        and(
          lte(crmTasks.due_date, now),
          eq(crmTasks.status, "todo")
        )
      )
      .orderBy(asc(crmTasks.due_date));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get overdue tasks error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get overdue tasks",
    });
  }
});

// =====================================================
// GET /api/crm/tasks/upcoming - Get upcoming tasks (next 7 days)
// =====================================================
router.get("/upcoming", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await db
      .select()
      .from(crmTasks)
      .where(
        and(
          gte(crmTasks.due_date, now),
          lte(crmTasks.due_date, nextWeek),
          eq(crmTasks.status, "todo")
        )
      )
      .orderBy(asc(crmTasks.due_date));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get upcoming tasks error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get upcoming tasks",
    });
  }
});

// =====================================================
// GET /api/crm/tasks/:id - Get single task
// =====================================================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [task] = await db
      .select()
      .from(crmTasks)
      .where(eq(crmTasks.id, id));

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get task",
    });
  }
});

// =====================================================
// POST /api/crm/tasks - Create new task
// =====================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);

    const userId = (req as { user?: { id: number } }).user?.id;

    const [task] = await db
      .insert(crmTasks)
      .values({
        id: randomUUID(),
        title: validatedData.title,
        description: validatedData.description ?? null,
        priority: validatedData.priority,
        status: validatedData.status,
        due_date: validatedData.due_date ? new Date(validatedData.due_date) : null,
        reminder_at: validatedData.reminder_at ? new Date(validatedData.reminder_at) : null,
        lead_id: validatedData.lead_id ?? null,
        contact_id: validatedData.contact_id ?? null,
        assigned_to: validatedData.assigned_to ?? null,
        created_by: userId ?? null,
        created_at: new Date(),
      })
      .returning();

    res.status(201).json({
      success: true,
      data: task,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    });
  }
});

// =====================================================
// PATCH /api/crm/tasks/:id - Update task
// =====================================================
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);

    // If status is changed to 'done', set completed_at
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.status === "done") {
      updateData.completed_at = new Date();
    }

    const [task] = await db
      .update(crmTasks)
      .set(updateData)
      .where(eq(crmTasks.id, id))
      .returning();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Update task error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    });
  }
});

// =====================================================
// POST /api/crm/tasks/:id/complete - Mark task as complete
// =====================================================
router.post("/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [task] = await db
      .update(crmTasks)
      .set({
        status: "done",
        completed_at: new Date(),
      })
      .where(eq(crmTasks.id, id))
      .returning();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
      message: "Task marked as complete",
    });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete task",
    });
  }
});

// =====================================================
// DELETE /api/crm/tasks/:id - Delete task
// =====================================================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(crmTasks).where(eq(crmTasks.id, id));

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete task",
    });
  }
});

export default router;
