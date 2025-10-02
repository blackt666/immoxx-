-- Seed Test Data for CRM System
-- Creates 5 sample leads with different temperatures and stages
-- Run with: sqlite3 database.sqlite < database/seed-crm-data.sql

-- Lead 1: Hot Lead (Wealthy buyer, immediate timeline)
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone, company,
  source, source_detail,
  status, pipeline_stage, score, temperature,
  budget_min, budget_max, property_type, preferred_location, timeline,
  notes, tags,
  created_at, updated_at
) VALUES (
  lower(hex(randomblob(16))),
  'Maximilian', 'von Habsburg', 'max.habsburg@example.com', '+49 160 1234567', 'Habsburg GmbH',
  'website', 'Contact Form - Premium Villas Page',
  'qualified', 'viewing_scheduled', 95, 'hot',
  800000, 1200000, 'Villa', 'Konstanz Altstadt, Seeblick', 'immediate',
  'VIP Kunde - sehr interessiert an Luxus-Immobilien am Bodensee. Möchte nächste Woche 3 Objekte besichtigen.',
  '["VIP","Luxury","Hot Lead","Viewing Scheduled"]',
  datetime('now'), datetime('now')
);

-- Lead 2: Warm Lead (Good budget, 3 months timeline)
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone,
  source, source_detail,
  status, pipeline_stage, score, temperature,
  budget_min, budget_max, property_type, preferred_location, timeline,
  notes, tags,
  created_at, updated_at
) VALUES (
  lower(hex(randomblob(16))),
  'Anna', 'Schmidt', 'anna.schmidt@gmail.com', '+49 170 9876543',
  'referral', 'Empfehlung von Thomas Weber',
  'contacted', 'qualified', 65, 'warm',
  450000, 650000, 'Wohnung', 'Friedrichshafen, Zentrum', '3_months',
  'Sucht 3-4 Zimmer Wohnung für Familie. Hat bereits Finanzierung geklärt. Netter Erstkontakt.',
  '["Family","Financed","Warm Lead"]',
  datetime('now', '-2 days'), datetime('now', '-1 day')
);

-- Lead 3: Warm Lead (First-time buyer, good engagement)
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone,
  source, source_detail,
  status, pipeline_stage, score, temperature,
  budget_min, budget_max, property_type, preferred_location, timeline,
  notes, tags,
  created_at, updated_at
) VALUES (
  lower(hex(randomblob(16))),
  'Thomas', 'Müller', 'thomas.mueller@web.de', '+49 151 2468135',
  'facebook', 'Facebook Ad - First Time Buyers Campaign',
  'contacted', 'contacted', 58, 'warm',
  300000, 450000, 'Wohnung', 'Überlingen, Meersburg', '6_months',
  'Erstkäufer, braucht noch Beratung zur Finanzierung. Hat mehrere Exposés angefordert.',
  '["First Time Buyer","Facebook","Needs Financing Help"]',
  datetime('now', '-5 days'), datetime('now', '-2 days')
);

-- Lead 4: Cold Lead (Low budget, flexible timeline)
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone,
  source, source_detail,
  status, pipeline_stage, score, temperature,
  budget_min, budget_max, property_type, preferred_location, timeline,
  notes, tags,
  created_at, updated_at
) VALUES (
  lower(hex(randomblob(16))),
  'Julia', 'Becker', 'julia.becker@yahoo.com', '+49 162 7891234',
  'website', 'Newsletter Signup',
  'new', 'inbox', 25, 'cold',
  200000, 300000, 'Wohnung', 'Bodensee Region', '1_year',
  'Newsletter Abonnent. Noch kein direkter Kontakt. Niedriges Budget.',
  '["Newsletter","Cold Lead","Student"]',
  datetime('now', '-1 day'), datetime('now', '-1 day')
);

-- Lead 5: Hot Lead (Investment buyer, multiple properties)
INSERT INTO crm_leads (
  id, first_name, last_name, email, phone, company,
  source, source_detail,
  status, pipeline_stage, score, temperature,
  budget_min, budget_max, property_type, preferred_location, timeline,
  notes, tags,
  created_at, updated_at
) VALUES (
  lower(hex(randomblob(16))),
  'Dr. Michael', 'Steinmann', 'michael.steinmann@investcorp.de', '+49 171 3456789', 'InvestCorp AG',
  'referral', 'Empfehlung von Anwalt Dr. Meyer',
  'qualified', 'offer_made', 88, 'hot',
  1000000, 2000000, 'Gewerbe', 'Konstanz, Friedrichshafen', 'immediate',
  'Investor - sucht mehrere Gewerbeimmobilien. Angebot für Bürogebäude in Konstanz gemacht. Verhandlung läuft gut.',
  '["Investor","Commercial","Hot Lead","Multiple Properties","High Value"]',
  datetime('now', '-7 days'), datetime('now')
);

-- Activities for Lead 1 (Hot Lead)
INSERT INTO crm_activities (
  id, activity_type, lead_id, subject, description, outcome,
  completed_at, duration_minutes, created_by,
  created_at
) VALUES
  (lower(hex(randomblob(16))), 'call', (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   'Initial Consultation Call', 'Discussed requirements: Villa with lake view, 200+ sqm, budget up to 1.2M EUR',
   'successful', datetime('now', '-3 days'), 45, 1, datetime('now', '-3 days')),

  (lower(hex(randomblob(16))), 'email', (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   'Sent Property Exposés', 'Sent 3 luxury villa exposés matching criteria', 'successful',
   datetime('now', '-2 days'), 0, 1, datetime('now', '-2 days')),

  (lower(hex(randomblob(16))), 'viewing_scheduled', (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   'Viewing Scheduled', 'Confirmed viewing for 3 properties next Tuesday 10:00', 'successful',
   datetime('now', '-1 day'), 15, 1, datetime('now', '-1 day'));

-- Activities for Lead 2 (Warm Lead)
INSERT INTO crm_activities (
  id, activity_type, lead_id, subject, description, outcome,
  completed_at, duration_minutes, created_by,
  created_at
) VALUES
  (lower(hex(randomblob(16))), 'call', (SELECT id FROM crm_leads WHERE email='anna.schmidt@gmail.com'),
   'First Contact Call', 'Introduced agency, discussed her requirements for family apartment',
   'successful', datetime('now', '-2 days'), 30, 1, datetime('now', '-2 days')),

  (lower(hex(randomblob(16))), 'email', (SELECT id FROM crm_leads WHERE email='anna.schmidt@gmail.com'),
   'Financing Information', 'Sent overview of financing options and local banks',
   'successful', datetime('now', '-1 day'), 0, 1, datetime('now', '-1 day'));

-- Tasks for Lead 1 (Hot Lead)
INSERT INTO crm_tasks (
  id, title, description, priority, status,
  due_date, lead_id, assigned_to, created_by,
  created_at
) VALUES
  (lower(hex(randomblob(16))), 'Prepare Viewing Materials',
   'Print exposés, prepare iPad with additional photos, confirm building access',
   'high', 'todo',
   datetime('now', '+1 day'), (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   1, 1, datetime('now')),

  (lower(hex(randomblob(16))), 'Follow-up Call After Viewing',
   'Call Mr. Habsburg day after viewing to discuss impressions',
   'high', 'todo',
   datetime('now', '+4 days'), (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   1, 1, datetime('now'));

-- Tasks for Lead 2 (Warm Lead)
INSERT INTO crm_tasks (
  id, title, description, priority, status,
  due_date, lead_id, assigned_to, created_by,
  created_at
) VALUES
  (lower(hex(randomblob(16))), 'Send Property Listings',
   'Send selection of 5-6 suitable apartments in Friedrichshafen',
   'medium', 'todo',
   datetime('now', '+1 day'), (SELECT id FROM crm_leads WHERE email='anna.schmidt@gmail.com'),
   1, 1, datetime('now'));

-- Notes for leads
INSERT INTO crm_notes (
  id, content, note_type, lead_id, created_by, is_pinned,
  created_at, updated_at
) VALUES
  (lower(hex(randomblob(16))),
   'WICHTIG: Kunde möchte nur Objekte mit direktem Seeblick. Keine Kompromisse bei der Lage.',
   'important',
   (SELECT id FROM crm_leads WHERE email='max.habsburg@example.com'),
   1, 1, datetime('now'), datetime('now')),

  (lower(hex(randomblob(16))),
   'Familie hat 2 Kinder (5 und 8 Jahre). Nähe zu guten Schulen wichtig.',
   'general',
   (SELECT id FROM crm_leads WHERE email='anna.schmidt@gmail.com'),
   1, 0, datetime('now'), datetime('now'));

-- Success message
SELECT 'CRM Test Data Seeded Successfully!' as message,
       (SELECT COUNT(*) FROM crm_leads) as total_leads,
       (SELECT COUNT(*) FROM crm_activities) as total_activities,
       (SELECT COUNT(*) FROM crm_tasks) as total_tasks,
       (SELECT COUNT(*) FROM crm_notes) as total_notes;
