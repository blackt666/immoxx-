-- CRM System Migration for SQLite
-- Creates tables for: Leads, Contacts, Activities, Tasks, Notes
-- Version: 1.0 (SQLite compatible)
-- Date: 2025-10-02

-- =====================================================
-- 1. CRM LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Lead Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,

  -- Lead Source Tracking
  source TEXT NOT NULL DEFAULT 'manual',
  source_detail TEXT,

  -- Lead Status & Pipeline
  status TEXT NOT NULL DEFAULT 'new',
  pipeline_stage TEXT NOT NULL DEFAULT 'inbox',
  stage_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Lead Scoring
  score INTEGER DEFAULT 0,
  temperature TEXT DEFAULT 'cold',

  -- Assignment
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at DATETIME,

  -- Property Requirements
  budget_min REAL,
  budget_max REAL,
  property_type TEXT,
  preferred_location TEXT,
  timeline TEXT,

  -- Additional Info
  notes TEXT,
  tags TEXT, -- JSON array as string

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON crm_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON crm_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON crm_leads(created_at DESC);

-- =====================================================
-- 2. CRM CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Contact Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  position TEXT,

  -- Address
  street TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',

  -- Contact Type & Preferences
  contact_type TEXT DEFAULT 'buyer',
  preferred_contact_method TEXT DEFAULT 'email',
  language TEXT DEFAULT 'de',

  -- Financial Information
  budget_min REAL,
  budget_max REAL,
  financing_status TEXT,

  -- Tags & Custom Fields
  tags TEXT, -- JSON array as string
  custom_fields TEXT, -- JSON as string

  -- Relationship to Lead
  lead_id TEXT REFERENCES crm_leads(id) ON DELETE SET NULL,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contact_date DATETIME,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_lead ON crm_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON crm_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON crm_contacts(last_contact_date DESC);

-- =====================================================
-- 3. CRM ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Activity Type
  activity_type TEXT NOT NULL,

  -- Related Entities
  lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,

  -- Activity Details
  subject TEXT,
  description TEXT,
  outcome TEXT,

  -- Scheduling
  scheduled_at DATETIME,
  completed_at DATETIME,
  duration_minutes INTEGER,

  -- Assignment
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Email Specific Fields
  email_from TEXT,
  email_to TEXT,
  email_subject TEXT,
  email_opened INTEGER DEFAULT 0, -- Boolean as 0/1
  email_clicked INTEGER DEFAULT 0,
  email_opened_at DATETIME,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_lead ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_property ON crm_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled ON crm_activities(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created ON crm_activities(created_at DESC);

-- =====================================================
-- 4. CRM TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Task Info
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',

  -- Due Date & Reminders
  due_date DATETIME,
  reminder_at DATETIME,

  -- Related Entities
  lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Assignment
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON crm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON crm_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON crm_tasks(priority);

-- =====================================================
-- 5. CRM NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Note Content
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',

  -- Related Entities
  lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Metadata
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_pinned INTEGER DEFAULT 0, -- Boolean as 0/1

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for notes table
CREATE INDEX IF NOT EXISTS idx_notes_lead ON crm_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_contact ON crm_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON crm_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON crm_notes(is_pinned) WHERE is_pinned = 1;

-- =====================================================
-- 6. TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Auto-update updated_at for leads
CREATE TRIGGER IF NOT EXISTS update_crm_leads_updated_at
AFTER UPDATE ON crm_leads
FOR EACH ROW
BEGIN
  UPDATE crm_leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-update updated_at for contacts
CREATE TRIGGER IF NOT EXISTS update_crm_contacts_updated_at
AFTER UPDATE ON crm_contacts
FOR EACH ROW
BEGIN
  UPDATE crm_contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-update updated_at for notes
CREATE TRIGGER IF NOT EXISTS update_crm_notes_updated_at
AFTER UPDATE ON crm_notes
FOR EACH ROW
BEGIN
  UPDATE crm_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-update lead temperature based on score
CREATE TRIGGER IF NOT EXISTS trigger_update_lead_temperature
AFTER UPDATE OF score ON crm_leads
FOR EACH ROW
BEGIN
  UPDATE crm_leads
  SET temperature = CASE
    WHEN NEW.score >= 80 THEN 'hot'
    WHEN NEW.score >= 50 THEN 'warm'
    ELSE 'cold'
  END
  WHERE id = NEW.id;
END;

-- =====================================================
-- 7. SEED TEST DATA (Uncomment for development)
-- =====================================================

/*
INSERT INTO crm_leads (first_name, last_name, email, phone, source, budget_min, budget_max, property_type, preferred_location, timeline)
VALUES
  ('Max', 'Mustermann', 'max.mustermann@example.com', '+49 160 1234567', 'website', 300000, 500000, 'Wohnung', 'Konstanz', '3_months'),
  ('Anna', 'Schmidt', 'anna.schmidt@example.com', '+49 170 9876543', 'referral', 500000, 800000, 'Haus', 'Friedrichshafen', '6_months'),
  ('Thomas', 'Weber', 'thomas.weber@example.com', '+49 151 5555555', 'facebook', 200000, 350000, 'Wohnung', 'Überlingen', 'immediate');
*/

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
