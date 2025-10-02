-- CRM Test Data for Development
-- Run this to populate the CRM with realistic test leads

-- Clean existing data (optional)
-- DELETE FROM crm_leads;
-- DELETE FROM crm_contacts;
-- DELETE FROM crm_activities;
-- DELETE FROM crm_tasks;
-- DELETE FROM crm_notes;

-- Insert Test Leads across different pipeline stages
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone, source, status, pipeline_stage,
  score, temperature, budget_min, budget_max, property_type, preferred_location,
  timeline, notes, created_at, updated_at
) VALUES
-- Hot Leads (Inbox & Contacted)
(
  'lead-001', 'Max', 'Mustermann', 'max.mustermann@example.com', '+49 160 1234567',
  'website', 'active', 'inbox', 85, 'hot', 400000, 600000, 'Wohnung', 'Konstanz',
  'within_1_month', 'Sehr interessiert an Seenähe. Erstkontakt erfolgt.',
  datetime('now'), datetime('now')
),
(
  'lead-002', 'Anna', 'Schmidt', 'anna.schmidt@example.com', '+49 170 9876543',
  'referral', 'active', 'contacted', 92, 'hot', 600000, 800000, 'Haus', 'Überlingen',
  'within_1_month', 'Empfehlung von bestehendem Kunden. Budget bestätigt.',
  datetime('now', '-2 days'), datetime('now', '-1 day')
),

-- Warm Leads (Qualified & Viewing Scheduled)
(
  'lead-003', 'Thomas', 'Weber', 'thomas.weber@example.com', '+49 151 2468135',
  'phone', 'active', 'qualified', 68, 'warm', 350000, 500000, 'Penthouse', 'Friedrichshafen',
  'within_3_months', 'Qualifiziert. Besichtigung nächste Woche geplant.',
  datetime('now', '-5 days'), datetime('now', '-1 day')
),
(
  'lead-004', 'Julia', 'Becker', 'julia.becker@example.com', '+49 162 1357924',
  'social_media', 'active', 'viewing_scheduled', 75, 'warm', 300000, 450000, 'Wohnung', 'Konstanz',
  'within_3_months', 'Besichtigung am Freitag 14:00 Uhr.',
  datetime('now', '-7 days'), datetime('now', '-2 days')
),

-- Cold Leads (Offer Made & Negotiation)
(
  'lead-005', 'Michael', 'Fischer', 'm.fischer@example.com', '+49 175 8642097',
  'email', 'active', 'offer_made', 55, 'cold', 250000, 350000, 'Wohnung', 'Meersburg',
  'flexible', 'Angebot unterbreitet. Wartet auf Entscheidung.',
  datetime('now', '-10 days'), datetime('now', '-3 days')
),
(
  'lead-006', 'Sarah', 'Hoffmann', 'sarah.hoffmann@example.com', '+49 163 7531598',
  'website', 'active', 'negotiation', 48, 'cold', 500000, 700000, 'Villa', 'Lindau',
  'within_6_months', 'In Preisverhandlung. Interessiert an Grundstück.',
  datetime('now', '-15 days'), datetime('now', '-5 days')
),

-- Successful Leads (Won)
(
  'lead-007', 'Peter', 'Zimmermann', 'p.zimmermann@example.com', '+49 171 9517536',
  'referral', 'won', 'won', 100, 'hot', 550000, 650000, 'Haus', 'Konstanz',
  'within_1_month', 'Deal abgeschlossen! Unterschrift erfolgt.',
  datetime('now', '-20 days'), datetime('now', '-1 day')
),

-- Lost Leads
(
  'lead-008', 'Laura', 'Richter', 'laura.richter@example.com', '+49 152 7539514',
  'phone', 'lost', 'lost', 30, 'cold', 200000, 300000, 'Grundstück', 'Radolfzell',
  'flexible', 'Budget zu niedrig für verfügbare Objekte.',
  datetime('now', '-25 days'), datetime('now', '-10 days')
),

-- More Inbox Leads
(
  'lead-009', 'David', 'Koch', 'david.koch@example.com', '+49 160 3692581',
  'website', 'active', 'inbox', 62, 'warm', 400000, 550000, 'Wohnung', 'Konstanz',
  'within_3_months', 'Neuer Lead vom Kontaktformular.',
  datetime('now', '-1 hour'), datetime('now', '-1 hour')
),
(
  'lead-010', 'Lisa', 'Braun', 'lisa.braun@example.com', '+49 174 8527413',
  'social_media', 'active', 'inbox', 70, 'warm', 350000, 500000, 'Penthouse', 'Friedrichshafen',
  'within_1_month', 'Instagram Anfrage. Sehr schnelle Antworten.',
  datetime('now', '-3 hours'), datetime('now', '-3 hours')
);

-- Insert corresponding contacts
INSERT INTO crm_contacts (
  id, first_name, last_name, email, phone, company, position, source,
  tags, notes, created_at, updated_at
) VALUES
('contact-001', 'Max', 'Mustermann', 'max.mustermann@example.com', '+49 160 1234567', NULL, NULL, 'website', 'hot-lead,konstanz', 'Neuer Kontakt', datetime('now'), datetime('now')),
('contact-002', 'Anna', 'Schmidt', 'anna.schmidt@example.com', '+49 170 9876543', NULL, NULL, 'referral', 'hot-lead,überlingen', 'Top Kontakt', datetime('now', '-2 days'), datetime('now', '-1 day')),
('contact-003', 'Thomas', 'Weber', 'thomas.weber@example.com', '+49 151 2468135', NULL, NULL, 'phone', 'warm-lead,friedrichshafen', 'Qualifiziert', datetime('now', '-5 days'), datetime('now', '-1 day')),
('contact-004', 'Julia', 'Becker', 'julia.becker@example.com', '+49 162 1357924', NULL, NULL, 'social_media', 'warm-lead,konstanz', 'Besichtigung geplant', datetime('now', '-7 days'), datetime('now', '-2 days')),
('contact-005', 'Michael', 'Fischer', 'm.fischer@example.com', '+49 175 8642097', NULL, NULL, 'email', 'cold-lead,meersburg', 'Angebot unterbreitet', datetime('now', '-10 days'), datetime('now', '-3 days'));

-- Insert sample activities
INSERT INTO crm_activities (
  id, lead_id, contact_id, type, subject, description, outcome,
  duration_minutes, scheduled_at, completed_at, created_by, created_at, updated_at
) VALUES
('activity-001', 'lead-002', 'contact-002', 'call', 'Erstkontakt Telefon', 'Erstgespräch über Immobilienwünsche', 'positive', 15, datetime('now', '-1 day'), datetime('now', '-1 day'), 'admin', datetime('now', '-1 day'), datetime('now', '-1 day')),
('activity-002', 'lead-003', 'contact-003', 'email', 'Objektangebot gesendet', 'Exposés für 3 Wohnungen in Friedrichshafen', 'email_sent', NULL, datetime('now', '-2 days'), datetime('now', '-2 days'), 'admin', datetime('now', '-2 days'), datetime('now', '-2 days')),
('activity-003', 'lead-004', 'contact-004', 'meeting', 'Besichtigungstermin vereinbart', 'Freitag 14:00 Uhr Objektbesichtigung', 'scheduled', 60, datetime('now', '+2 days', '14:00'), NULL, 'admin', datetime('now', '-3 days'), datetime('now', '-3 days'));

-- Insert sample tasks
INSERT INTO crm_tasks (
  id, lead_id, contact_id, title, description, priority, status,
  due_date, completed_at, created_by, assigned_to, created_at, updated_at
) VALUES
('task-001', 'lead-001', 'contact-001', 'Follow-up Anruf', 'Max Mustermann zurückrufen bzgl. Seenähe-Objekte', 'high', 'pending', datetime('now', '+1 day'), NULL, 'admin', 'admin', datetime('now'), datetime('now')),
('task-002', 'lead-003', 'contact-003', 'Exposé vorbereiten', 'Penthouse-Exposés zusammenstellen', 'medium', 'pending', datetime('now', '+3 days'), NULL, 'admin', 'admin', datetime('now', '-1 day'), datetime('now', '-1 day')),
('task-003', 'lead-007', 'contact-001', 'Vertragsunterlagen senden', 'Kaufvertragsunterlagen per Post versenden', 'high', 'completed', datetime('now', '-2 days'), datetime('now', '-1 day'), 'admin', 'admin', datetime('now', '-5 days'), datetime('now', '-1 day'));

-- Insert sample notes
INSERT INTO crm_notes (
  id, lead_id, contact_id, content, created_by, created_at, updated_at
) VALUES
('note-001', 'lead-002', 'contact-002', 'Kundin sehr professionell. Budget gesichert durch Bankbestätigung.', 'admin', datetime('now', '-1 day'), datetime('now', '-1 day')),
('note-002', 'lead-004', 'contact-004', 'Präferiert moderne Architektur. Keine Altbauten.', 'admin', datetime('now', '-3 days'), datetime('now', '-3 days')),
('note-003', 'lead-007', NULL, 'Deal erfolgreich! Provision: 3%. Kunde sehr zufrieden.', 'admin', datetime('now', '-1 day'), datetime('now', '-1 day'));

-- Summary
SELECT
  COUNT(*) as total_leads,
  SUM(CASE WHEN temperature = 'hot' THEN 1 ELSE 0 END) as hot_leads,
  SUM(CASE WHEN temperature = 'warm' THEN 1 ELSE 0 END) as warm_leads,
  SUM(CASE WHEN temperature = 'cold' THEN 1 ELSE 0 END) as cold_leads,
  SUM(CASE WHEN pipeline_stage = 'won' THEN 1 ELSE 0 END) as won_deals
FROM crm_leads;
