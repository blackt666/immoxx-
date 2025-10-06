-- Simple CRM Test Data
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
  'within_1_month', 'Sehr interessiert an Seenähe.', 
  strftime('%s', 'now'), strftime('%s', 'now')
),
(
  'lead-002', 'Anna', 'Schmidt', 'anna.schmidt@example.com', '+49 170 9876543',
  'referral', 'active', 'contacted', 92, 'hot', 600000, 800000, 'Haus', 'Überlingen',
  'within_1_month', 'Empfehlung von bestehendem Kunden.', 
  strftime('%s', 'now', '-2 days'), strftime('%s', 'now', '-1 day')
),

-- Warm Leads (Qualified & Viewing Scheduled)
(
  'lead-003', 'Thomas', 'Weber', 'thomas.weber@example.com', '+49 151 2468135',
  'phone', 'active', 'qualified', 68, 'warm', 350000, 500000, 'Penthouse', 'Friedrichshafen',
  'within_3_months', 'Qualifiziert. Besichtigung geplant.', 
  strftime('%s', 'now', '-5 days'), strftime('%s', 'now', '-1 day')
),
(
  'lead-004', 'Julia', 'Becker', 'julia.becker@example.com', '+49 162 1357924',
  'social_media', 'active', 'viewing_scheduled', 75, 'warm', 300000, 450000, 'Wohnung', 'Konstanz',
  'within_3_months', 'Besichtigung am Freitag 14:00 Uhr.', 
  strftime('%s', 'now', '-7 days'), strftime('%s', 'now', '-2 days')
),

-- Cold Leads (Offer Made & Negotiation)
(
  'lead-005', 'Michael', 'Fischer', 'm.fischer@example.com', '+49 175 8642097',
  'email', 'active', 'offer_made', 55, 'cold', 250000, 350000, 'Wohnung', 'Meersburg',
  'flexible', 'Angebot unterbreitet.', 
  strftime('%s', 'now', '-10 days'), strftime('%s', 'now', '-3 days')
),
(
  'lead-006', 'Sarah', 'Meyer', 'sarah.meyer@example.com', '+49 163 7539514',
  'website', 'active', 'negotiation', 48, 'cold', 500000, 700000, 'Villa', 'Lindau',
  'flexible', 'In Verhandlung. Preis wird diskutiert.', 
  strftime('%s', 'now', '-15 days'), strftime('%s', 'now', '-5 days')
),

-- Won & Lost
(
  'lead-007', 'Peter', 'Braun', 'peter.braun@example.com', '+49 171 9753124',
  'referral', 'won', 'won', 95, 'hot', 800000, 1000000, 'Villa', 'Konstanz',
  'immediate', 'Deal abgeschlossen! Notartermin nächste Woche.', 
  strftime('%s', 'now', '-20 days'), strftime('%s', 'now', '-1 day')
),
(
  'lead-008', 'Lisa', 'Hoffmann', 'lisa.hoffmann@example.com', '+49 152 3698147',
  'phone', 'lost', 'lost', 25, 'cold', 200000, 300000, 'Wohnung', 'Ravensburg',
  'flexible', 'Kein Budget. Projekt verschoben.', 
  strftime('%s', 'now', '-30 days'), strftime('%s', 'now', '-10 days')
),

-- More Inbox leads
(
  'lead-009', 'Andreas', 'Koch', 'andreas.koch@example.com', '+49 160 4567890',
  'website', 'new', 'inbox', 70, 'warm', 450000, 650000, 'Haus', 'Konstanz',
  'within_6_months', 'Neuer Lead - Erstkontakt steht noch aus.', 
  strftime('%s', 'now'), strftime('%s', 'now')
),
(
  'lead-010', 'Laura', 'Zimmermann', 'laura.zimmermann@example.com', '+49 170 7891234',
  'email', 'new', 'inbox', 65, 'warm', 300000, 400000, 'Wohnung', 'Friedrichshafen',
  'within_3_months', 'Interessiert an 2-Zimmer Wohnung mit Seeblick.', 
  strftime('%s', 'now'), strftime('%s', 'now')
);
