import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// =====================================================
// CRM LEADS TABLE
// =====================================================
export const crmLeads = sqliteTable("crm_leads", {
  id: text("id").primaryKey(),

  // Lead Personal Info
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),

  // Lead Source
  source: text("source").notNull().default("manual"),
  source_detail: text("source_detail"),

  // Lead Status & Pipeline
  status: text("status").notNull().default("new"),
  pipeline_stage: text("pipeline_stage").notNull().default("inbox"),
  stage_changed_at: integer("stage_changed_at", { mode: "timestamp" }),

  // Lead Scoring
  score: integer("score").default(0),
  temperature: text("temperature").default("cold"),

  // Assignment
  assigned_to: integer("assigned_to"),
  assigned_at: integer("assigned_at", { mode: "timestamp" }),

  // Property Requirements
  budget_min: real("budget_min"),
  budget_max: real("budget_max"),
  property_type: text("property_type"),
  preferred_location: text("preferred_location"),
  timeline: text("timeline"),

  // Additional Info
  notes: text("notes"),
  tags: text("tags"), // JSON string

  // Metadata
  created_at: integer("created_at", { mode: "timestamp" }),
  updated_at: integer("updated_at", { mode: "timestamp" }),
  created_by: integer("created_by"),
  tenant_id: integer("tenant_id").default(1),
});

// =====================================================
// CRM CONTACTS TABLE
// =====================================================
export const crmContacts = sqliteTable("crm_contacts", {
  id: text("id").primaryKey(),

  // Contact Personal Info
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  company: text("company"),
  position: text("position"),

  // Address
  street: text("street"),
  city: text("city"),
  postal_code: text("postal_code"),
  country: text("country").default("DE"),

  // Contact Type & Preferences
  contact_type: text("contact_type").default("buyer"),
  preferred_contact_method: text("preferred_contact_method").default("email"),
  language: text("language").default("de"),

  // Financial Information
  budget_min: real("budget_min"),
  budget_max: real("budget_max"),
  financing_status: text("financing_status"),

  // Tags & Custom Fields
  tags: text("tags"),
  custom_fields: text("custom_fields"),

  // Relationship
  lead_id: text("lead_id"),

  // Metadata
  created_at: integer("created_at", { mode: "timestamp" }),
  updated_at: integer("updated_at", { mode: "timestamp" }),
  last_contact_date: integer("last_contact_date", { mode: "timestamp" }),
  tenant_id: integer("tenant_id").default(1),
});

// =====================================================
// CRM ACTIVITIES TABLE
// =====================================================
export const crmActivities = sqliteTable("crm_activities", {
  id: text("id").primaryKey(),

  // Activity Type
  activity_type: text("activity_type").notNull(),

  // Related Entities
  lead_id: text("lead_id"),
  contact_id: text("contact_id"),
  property_id: integer("property_id"),

  // Activity Details
  subject: text("subject"),
  description: text("description"),
  outcome: text("outcome"),

  // Scheduling
  scheduled_at: integer("scheduled_at", { mode: "timestamp" }),
  completed_at: integer("completed_at", { mode: "timestamp" }),
  duration_minutes: integer("duration_minutes"),

  // Assignment
  created_by: integer("created_by"),
  assigned_to: integer("assigned_to"),

  // Email Specific Fields
  email_from: text("email_from"),
  email_to: text("email_to"),
  email_subject: text("email_subject"),
  email_opened: integer("email_opened").default(0),
  email_clicked: integer("email_clicked").default(0),
  email_opened_at: integer("email_opened_at", { mode: "timestamp" }),

  // Metadata
  created_at: integer("created_at", { mode: "timestamp" }),
  tenant_id: integer("tenant_id").default(1),
});

// =====================================================
// CRM TASKS TABLE
// =====================================================
export const crmTasks = sqliteTable("crm_tasks", {
  id: text("id").primaryKey(),

  // Task Info
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"),
  status: text("status").default("todo"),

  // Due Date & Reminders
  due_date: integer("due_date", { mode: "timestamp" }),
  reminder_at: integer("reminder_at", { mode: "timestamp" }),

  // Related Entities
  lead_id: text("lead_id"),
  contact_id: text("contact_id"),

  // Assignment
  assigned_to: integer("assigned_to"),
  created_by: integer("created_by"),

  // Metadata
  created_at: integer("created_at", { mode: "timestamp" }),
  completed_at: integer("completed_at", { mode: "timestamp" }),
  tenant_id: integer("tenant_id").default(1),
});

// =====================================================
// CRM NOTES TABLE
// =====================================================
export const crmNotes = sqliteTable("crm_notes", {
  id: text("id").primaryKey(),

  // Note Content
  content: text("content").notNull(),
  note_type: text("note_type").default("general"),

  // Related Entities
  lead_id: text("lead_id"),
  contact_id: text("contact_id"),

  // Metadata
  created_by: integer("created_by"),
  created_at: integer("created_at", { mode: "timestamp" }),
  updated_at: integer("updated_at", { mode: "timestamp" }),
  is_pinned: integer("is_pinned").default(0),
  tenant_id: integer("tenant_id").default(1),
});

// Export types
export type CrmLead = typeof crmLeads.$inferSelect;
export type NewCrmLead = typeof crmLeads.$inferInsert;

export type CrmContact = typeof crmContacts.$inferSelect;
export type NewCrmContact = typeof crmContacts.$inferInsert;

export type CrmActivity = typeof crmActivities.$inferSelect;
export type NewCrmActivity = typeof crmActivities.$inferInsert;

export type CrmTask = typeof crmTasks.$inferSelect;
export type NewCrmTask = typeof crmTasks.$inferInsert;

export type CrmNote = typeof crmNotes.$inferSelect;
export type NewCrmNote = typeof crmNotes.$inferInsert;
