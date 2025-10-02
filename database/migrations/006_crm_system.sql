-- CRM System Migration
-- Creates tables for: Leads, Contacts, Activities, Tasks, Notes
-- Version: 1.0
-- Date: 2025-10-02

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CRM LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),

  -- Lead Source Tracking
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  -- Possible values: 'website', 'referral', 'import', 'manual', 'facebook', 'google_ads'
  source_detail TEXT,

  -- Lead Status & Pipeline
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  -- Possible values: 'new', 'contacted', 'qualified', 'viewing_scheduled',
  -- 'offer_made', 'negotiation', 'won', 'lost'

  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'inbox',
  stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Lead Scoring
  score INTEGER DEFAULT 0,
  temperature VARCHAR(20) DEFAULT 'cold',
  -- Possible values: 'hot' (>80), 'warm' (50-80), 'cold' (<50)

  -- Assignment
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,

  -- Property Requirements
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  property_type VARCHAR(50),
  -- Possible values: 'Wohnung', 'Haus', 'Villa', 'Grundstück', 'Gewerbe'
  preferred_location TEXT,
  timeline VARCHAR(50),
  -- Possible values: 'immediate', '3_months', '6_months', '1_year', 'flexible'

  -- Additional Info
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- For future multi-tenancy support
  tenant_id INTEGER DEFAULT 1
);

-- Indexes for leads table
CREATE INDEX idx_leads_email ON crm_leads(email);
CREATE INDEX idx_leads_status ON crm_leads(status);
CREATE INDEX idx_leads_score ON crm_leads(score DESC);
CREATE INDEX idx_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_leads_temperature ON crm_leads(temperature);
CREATE INDEX idx_leads_created_at ON crm_leads(created_at DESC);

-- =====================================================
-- 2. CRM CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),

  -- Address
  street VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'DE',

  -- Contact Type & Preferences
  contact_type VARCHAR(50) DEFAULT 'buyer',
  -- Possible values: 'buyer', 'seller', 'tenant', 'landlord', 'partner', 'other'
  preferred_contact_method VARCHAR(50) DEFAULT 'email',
  -- Possible values: 'email', 'phone', 'whatsapp', 'sms'
  language VARCHAR(5) DEFAULT 'de',

  -- Financial Information
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  financing_status VARCHAR(50),
  -- Possible values: 'approved', 'pending', 'cash', 'not_started', 'declined'

  -- Tags & Custom Fields
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::JSONB,

  -- Relationship to Lead
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_date TIMESTAMP WITH TIME ZONE,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for contacts table
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_lead ON crm_contacts(lead_id);
CREATE INDEX idx_contacts_type ON crm_contacts(contact_type);
CREATE INDEX idx_contacts_last_contact ON crm_contacts(last_contact_date DESC);

-- =====================================================
-- 3. CRM ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Activity Type
  activity_type VARCHAR(50) NOT NULL,
  -- Possible values: 'call', 'email', 'meeting', 'note', 'property_view',
  -- 'viewing_scheduled', 'offer_sent', 'document_sent', 'sms'

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,

  -- Activity Details
  subject VARCHAR(255),
  description TEXT,
  outcome VARCHAR(100),
  -- Possible values: 'successful', 'no_answer', 'voicemail', 'follow_up_needed',
  -- 'not_interested', 'rescheduled'

  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,

  -- Assignment
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Email Specific Fields
  email_from VARCHAR(255),
  email_to VARCHAR(255),
  email_subject VARCHAR(255),
  email_opened BOOLEAN DEFAULT FALSE,
  email_clicked BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for activities table
CREATE INDEX idx_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_activities_property ON crm_activities(property_id);
CREATE INDEX idx_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_activities_scheduled ON crm_activities(scheduled_at DESC);
CREATE INDEX idx_activities_created ON crm_activities(created_at DESC);

-- =====================================================
-- 4. CRM TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  -- Possible values: 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'todo',
  -- Possible values: 'todo', 'in_progress', 'done', 'cancelled'

  -- Due Date & Reminders
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_at TIMESTAMP WITH TIME ZONE,

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Assignment
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for tasks table
CREATE INDEX idx_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
CREATE INDEX idx_tasks_lead ON crm_tasks(lead_id);
CREATE INDEX idx_tasks_priority ON crm_tasks(priority);

-- =====================================================
-- 5. CRM NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Note Content
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  -- Possible values: 'general', 'call_log', 'meeting_notes', 'internal', 'important'

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Metadata
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,

  tenant_id INTEGER DEFAULT 1
);

-- Indexes for notes table
CREATE INDEX idx_notes_lead ON crm_notes(lead_id);
CREATE INDEX idx_notes_contact ON crm_notes(contact_id);
CREATE INDEX idx_notes_created ON crm_notes(created_at DESC);
CREATE INDEX idx_notes_pinned ON crm_notes(is_pinned) WHERE is_pinned = TRUE;

-- =====================================================
-- 6. TRIGGER FUNCTIONS FOR AUTO-UPDATE
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leads table
DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to contacts table
DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to notes table
DROP TRIGGER IF EXISTS update_crm_notes_updated_at ON crm_notes;
CREATE TRIGGER update_crm_notes_updated_at
  BEFORE UPDATE ON crm_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FUNCTIONS FOR LEAD SCORING
-- =====================================================

-- Calculate lead score based on activities
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  lead_record RECORD;
BEGIN
  -- Get lead details
  SELECT * INTO lead_record FROM crm_leads WHERE id = lead_uuid;

  -- Base score from activities
  SELECT
    COALESCE(SUM(
      CASE activity_type
        WHEN 'property_view' THEN 10
        WHEN 'email' THEN 5
        WHEN 'call' THEN 25
        WHEN 'meeting' THEN 30
        WHEN 'viewing_scheduled' THEN 35
        WHEN 'offer_sent' THEN 40
        ELSE 2
      END
    ), 0) INTO total_score
  FROM crm_activities
  WHERE lead_id = lead_uuid;

  -- Bonus for high budget
  IF lead_record.budget_max > 500000 THEN
    total_score := total_score + 20;
  END IF;

  -- Bonus for urgent timeline
  IF lead_record.timeline IN ('immediate', '3_months') THEN
    total_score := total_score + 15;
  END IF;

  -- Email engagement bonuses
  total_score := total_score + (
    SELECT COALESCE(COUNT(*) * 5, 0)
    FROM crm_activities
    WHERE lead_id = lead_uuid AND email_opened = TRUE
  );

  total_score := total_score + (
    SELECT COALESCE(COUNT(*) * 15, 0)
    FROM crm_activities
    WHERE lead_id = lead_uuid AND email_clicked = TRUE
  );

  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Update lead temperature based on score
CREATE OR REPLACE FUNCTION update_lead_temperature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score >= 80 THEN
    NEW.temperature := 'hot';
  ELSIF NEW.score >= 50 THEN
    NEW.temperature := 'warm';
  ELSE
    NEW.temperature := 'cold';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_temperature ON crm_leads;
CREATE TRIGGER trigger_update_lead_temperature
  BEFORE UPDATE OF score ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_temperature();

-- =====================================================
-- 8. SEED INITIAL DATA (Optional)
-- =====================================================

-- Insert test leads (commented out, uncomment for development)
-- INSERT INTO crm_leads (first_name, last_name, email, phone, source, budget_min, budget_max, property_type, preferred_location, timeline)
-- VALUES
--   ('Max', 'Mustermann', 'max.mustermann@example.com', '+49 160 1234567', 'website', 300000, 500000, 'Wohnung', 'Konstanz', '3_months'),
--   ('Anna', 'Schmidt', 'anna.schmidt@example.com', '+49 170 9876543', 'referral', 500000, 800000, 'Haus', 'Friedrichshafen', '6_months'),
--   ('Thomas', 'Weber', 'thomas.weber@example.com', '+49 151 5555555', 'facebook', 200000, 350000, 'Wohnung', 'Überlingen', 'immediate');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
