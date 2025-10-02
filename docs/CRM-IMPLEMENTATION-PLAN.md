# 🎯 CRM System - Implementation Plan

**Feature:** Customer Relationship Management (CRM)
**Priorität:** P0 - START NOW
**Zeitrahmen:** 1-2 Wochen
**ROI:** 🔥🔥🔥🔥🔥 (High)

---

## 🎯 Ziele

1. **Lead Management** - Alle Interessenten zentral erfassen und tracken
2. **Contact Management** - 360° Kundenview mit kompletter History
3. **Pipeline Visualization** - Kanban Board für Sales Pipeline
4. **Activity Tracking** - Anrufe, E-Mails, Meetings dokumentieren
5. **Lead Scoring** - Hot/Warm/Cold basierend auf Verhalten
6. **Automation** - Auto-Routing, Follow-up Reminders

**Business Impact:** +40% Lead Conversion durch besseres Follow-up

---

## 📊 CRM Features Übersicht

### Core Features (MVP - Week 1)

#### 1. Lead Capture & Management
```typescript
- Lead kommt rein (Website Form, Manual Entry)
- Lead Scoring: Hot (>80), Warm (50-80), Cold (<50)
- Automatisches Routing zu zuständigem Makler
- Lead Lifecycle Status Tracking
```

#### 2. Pipeline Stages
```
1. Neuer Lead (Inbox)
2. Kontaktiert (First Touch)
3. Qualifiziert (Budget + Timeline klar)
4. Besichtigung geplant
5. Angebot gemacht
6. Verhandlung
7. Abgeschlossen (Won/Lost)
```

#### 3. Contact Database
```typescript
- Zentrale Datenbank aller Kontakte
- Rich Profiles (Budget, Präferenzen, Timeline)
- Kontakthistorie (alle Touchpoints)
- Tags & Custom Fields
- Linked Properties (welche Immobilien interessieren)
```

#### 4. Activity Timeline
```typescript
- Anrufe (mit Notes)
- E-Mails (senden + empfangen)
- Meetings/Besichtigungen
- Property Views
- Email Opens/Clicks
- Website Visits (wenn eingeloggt)
```

### Advanced Features (Week 2)

#### 5. Lead Scoring Algorithm
```typescript
Score Calculation:
+ Property Views: +10 points each
+ Email Opens: +5 points
+ Email Clicks: +15 points
+ Form Submissions: +20 points
+ Phone Call: +25 points
+ Meeting Attended: +30 points
+ Budget > €500k: +20 points
+ Timeline < 3 months: +15 points

Hot Lead: >80 points
Warm Lead: 50-80 points
Cold Lead: <50 points
```

#### 6. Auto-Routing & Assignment
```typescript
Rules Engine:
- Leads aus Konstanz → Makler A
- Budget >€1M → Senior Makler
- Gewerbe-Immobilien → Spezialist B
- Round-Robin wenn keine Regel matched
```

#### 7. Task Management
```typescript
- Follow-up Reminders
- TODO Liste pro Lead
- Automatische Tasks (z.B. "Call in 3 days")
- Overdue Warnings
```

---

## 🗄️ Database Schema

### Tables zu erstellen:

#### 1. `crm_leads` Table
```sql
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),

  -- Lead Source
  source VARCHAR(50) NOT NULL, -- 'website', 'referral', 'import', 'manual'
  source_detail TEXT, -- z.B. "Contact Form", "Facebook Ad"

  -- Lead Status
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  -- 'new', 'contacted', 'qualified', 'viewing_scheduled', 'offer_made', 'negotiation', 'won', 'lost'

  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'inbox',
  stage_changed_at TIMESTAMP DEFAULT NOW(),

  -- Lead Scoring
  score INTEGER DEFAULT 0,
  temperature VARCHAR(20) DEFAULT 'cold', -- 'hot', 'warm', 'cold'

  -- Assignment
  assigned_to INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,

  -- Lead Details
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  property_type VARCHAR(50), -- 'Wohnung', 'Haus', 'Gewerbe', etc.
  preferred_location TEXT,
  timeline VARCHAR(50), -- 'immediate', '3_months', '6_months', '1_year'

  -- Notes
  notes TEXT,
  tags TEXT[], -- Array of tags

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),

  -- Tenant (for Multi-Tenancy)
  tenant_id INTEGER REFERENCES tenants(id),

  -- Indexes
  CONSTRAINT unique_email_per_tenant UNIQUE(email, tenant_id)
);

CREATE INDEX idx_leads_status ON crm_leads(status);
CREATE INDEX idx_leads_score ON crm_leads(score DESC);
CREATE INDEX idx_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_leads_tenant ON crm_leads(tenant_id);
```

#### 2. `crm_contacts` Table
```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Info
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

  -- Contact Type
  contact_type VARCHAR(50) DEFAULT 'buyer', -- 'buyer', 'seller', 'tenant', 'landlord', 'partner'

  -- Preferences
  preferred_contact_method VARCHAR(50), -- 'email', 'phone', 'whatsapp'
  language VARCHAR(5) DEFAULT 'de',

  -- Financial
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  financing_status VARCHAR(50), -- 'approved', 'pending', 'cash', 'not_started'

  -- Tags & Custom Fields
  tags TEXT[],
  custom_fields JSONB,

  -- Relationships
  lead_id UUID REFERENCES crm_leads(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_contact_date TIMESTAMP,

  tenant_id INTEGER REFERENCES tenants(id)
);

CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_lead ON crm_contacts(lead_id);
```

#### 3. `crm_activities` Table
```sql
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Activity Type
  activity_type VARCHAR(50) NOT NULL,
  -- 'call', 'email', 'meeting', 'note', 'property_view', 'viewing_scheduled', 'offer_sent'

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),
  property_id INTEGER REFERENCES properties(id),

  -- Activity Details
  subject VARCHAR(255),
  description TEXT,
  outcome VARCHAR(100), -- 'successful', 'no_answer', 'voicemail', 'follow_up_needed'

  -- Scheduling
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INTEGER,

  -- Assignment
  created_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),

  -- Email Specific
  email_from VARCHAR(255),
  email_to VARCHAR(255),
  email_subject VARCHAR(255),
  email_opened BOOLEAN DEFAULT FALSE,
  email_clicked BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  tenant_id INTEGER REFERENCES tenants(id)
);

CREATE INDEX idx_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_activities_scheduled ON crm_activities(scheduled_at);
```

#### 4. `crm_tasks` Table
```sql
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'cancelled'

  -- Due Date
  due_date TIMESTAMP,
  reminder_at TIMESTAMP,

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Assignment
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  tenant_id INTEGER REFERENCES tenants(id)
);

CREATE INDEX idx_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
```

#### 5. `crm_notes` Table
```sql
CREATE TABLE crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Note Content
  content TEXT NOT NULL,

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  tenant_id INTEGER REFERENCES tenants(id)
);

CREATE INDEX idx_notes_lead ON crm_notes(lead_id);
CREATE INDEX idx_notes_contact ON crm_notes(contact_id);
```

---

## 🛠️ Backend Implementation

### File Structure:
```
server/
├── routes/crm/
│   ├── leads.ts           # Lead CRUD + Pipeline
│   ├── contacts.ts        # Contact Management
│   ├── activities.ts      # Activity Tracking
│   ├── tasks.ts           # Task Management
│   └── notes.ts           # Notes
├── services/crm/
│   ├── leadService.ts     # Lead Business Logic
│   ├── scoringService.ts  # Lead Scoring Algorithm
│   ├── routingService.ts  # Auto-Assignment Logic
│   └── activityService.ts # Activity Tracking
└── database/migrations/
    └── 006_crm_system.sql # CRM Schema
```

### API Endpoints:

#### Leads API
```typescript
// GET /api/crm/leads
// Query Params: ?status=new&assigned_to=5&temperature=hot&limit=50
{
  leads: [...],
  total: 150,
  pagination: {...}
}

// GET /api/crm/leads/:id
{
  lead: {...},
  activities: [...],
  tasks: [...],
  notes: [...]
}

// POST /api/crm/leads
{
  first_name: "Max",
  last_name: "Mustermann",
  email: "max@example.com",
  phone: "+49 160 1234567",
  source: "website",
  budget_min: 300000,
  budget_max: 500000,
  property_type: "Wohnung",
  preferred_location: "Konstanz",
  timeline: "3_months"
}

// PATCH /api/crm/leads/:id
{
  status: "qualified",
  pipeline_stage: "viewing_scheduled",
  assigned_to: 5
}

// POST /api/crm/leads/:id/move-stage
{
  stage: "offer_made",
  note: "Sent offer for Seestraße property"
}

// POST /api/crm/leads/:id/score
// Recalculate score based on activities
```

#### Activities API
```typescript
// POST /api/crm/activities
{
  activity_type: "call",
  lead_id: "uuid",
  subject: "Initial consultation call",
  description: "Discussed budget and preferences",
  outcome: "successful",
  duration_minutes: 30,
  scheduled_at: "2025-10-05T14:00:00Z",
  completed_at: "2025-10-05T14:30:00Z"
}

// GET /api/crm/activities?lead_id=uuid
// Returns all activities for a lead
```

#### Tasks API
```typescript
// GET /api/crm/tasks?assigned_to=5&status=todo
// GET /api/crm/tasks/overdue
// POST /api/crm/tasks
// PATCH /api/crm/tasks/:id
```

---

## 🎨 Frontend Implementation

### File Structure:
```
client/src/
├── pages/crm/
│   ├── leads-dashboard.tsx    # Main CRM Dashboard (Kanban)
│   ├── lead-detail.tsx        # Lead Detail View
│   ├── contacts-list.tsx      # All Contacts
│   ├── contact-detail.tsx     # 360° Contact View
│   └── pipeline-analytics.tsx # Pipeline Reports
├── components/crm/
│   ├── kanban-board.tsx       # Drag & Drop Pipeline
│   ├── lead-card.tsx          # Card in Kanban
│   ├── activity-timeline.tsx  # Timeline Component
│   ├── lead-form.tsx          # Create/Edit Lead
│   ├── activity-form.tsx      # Log Activity
│   ├── task-list.tsx          # Tasks Widget
│   └── lead-score-badge.tsx   # Hot/Warm/Cold Badge
└── hooks/crm/
    ├── useLeads.ts            # React Query Hooks
    ├── useActivities.ts
    └── useTasks.ts
```

### Key Components:

#### 1. Lead Dashboard (Kanban Board)
```typescript
// leads-dashboard.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function LeadsDashboard() {
  const { data: leads } = useLeads();

  const stages = [
    'inbox',
    'contacted',
    'qualified',
    'viewing_scheduled',
    'offer_made',
    'negotiation',
    'won',
    'lost'
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    // Move lead to new stage
    moveLeadStage(event.active.id, event.over?.id);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {stages.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={leads.filter(l => l.pipeline_stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

#### 2. Lead Detail View
```typescript
// lead-detail.tsx
export default function LeadDetail({ leadId }) {
  const { data: lead } = useLead(leadId);
  const { data: activities } = useActivities(leadId);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Lead Info */}
      <div className="col-span-2">
        <LeadInfo lead={lead} />
        <ActivityTimeline activities={activities} />
      </div>

      {/* Right: Sidebar */}
      <div>
        <LeadScoreBadge score={lead.score} temperature={lead.temperature} />
        <TaskList leadId={leadId} />
        <QuickActions lead={lead} />
      </div>
    </div>
  );
}
```

#### 3. Activity Timeline
```typescript
// activity-timeline.tsx
export function ActivityTimeline({ activities }) {
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex gap-4">
          <ActivityIcon type={activity.activity_type} />
          <div className="flex-1">
            <div className="font-medium">{activity.subject}</div>
            <div className="text-sm text-gray-600">{activity.description}</div>
            <div className="text-xs text-gray-400">
              {formatTimeAgo(activity.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### E2E Tests zu erstellen:
```typescript
// tests/crm-lead-management.spec.ts
test('create new lead from contact form', async ({ page }) => {
  // Fill contact form
  // Verify lead appears in CRM
  // Check initial score
  // Verify auto-assignment
});

test('move lead through pipeline stages', async ({ page }) => {
  // Drag lead card to next stage
  // Verify stage updated
  // Check activity logged
});

test('log activity increases lead score', async ({ page }) => {
  // Initial score: 20
  // Log phone call (+25)
  // Verify new score: 45
  // Check temperature changed from cold to warm
});
```

---

## 📋 Implementation Checklist

### Week 1: MVP (Core Features)

**Day 1-2: Database & Backend**
- [ ] Create migration: `006_crm_system.sql`
- [ ] Run migration: `npm run db:migrate`
- [ ] Implement `leadService.ts`
- [ ] Create API routes: `leads.ts`, `activities.ts`
- [ ] Test APIs with Postman/curl

**Day 3-4: Frontend Structure**
- [ ] Create page structure (leads-dashboard, lead-detail)
- [ ] Set up React Query hooks
- [ ] Implement basic Lead List (Table View)
- [ ] Create Lead Form (Create/Edit)

**Day 5-7: Kanban Board**
- [ ] Install `@dnd-kit/core` (Drag & Drop)
- [ ] Build Kanban Board Component
- [ ] Implement Drag & Drop logic
- [ ] Test pipeline stage transitions
- [ ] Add Activity Timeline

### Week 2: Advanced Features

**Day 8-9: Lead Scoring**
- [ ] Implement scoring algorithm in `scoringService.ts`
- [ ] Add score calculation triggers
- [ ] Create score history tracking
- [ ] Display score badges in UI

**Day 10-11: Auto-Routing**
- [ ] Build routing rules engine
- [ ] Implement auto-assignment logic
- [ ] Add manual assignment override
- [ ] Test round-robin distribution

**Day 12-13: Task Management**
- [ ] Create tasks table & API
- [ ] Build task widget
- [ ] Add due date reminders
- [ ] Implement task notifications

**Day 14: Polish & Testing**
- [ ] E2E tests for all CRM features
- [ ] Documentation (CRM-GUIDE.md)
- [ ] Performance optimization
- [ ] Deploy to staging

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable
npm install react-big-calendar  # For calendar widget
npm install recharts            # For analytics charts
```

### 2. Run Migration
```bash
npm run db:migrate
```

### 3. Seed Test Data
```bash
npm run db:seed:crm
```

### 4. Start Development
```bash
npm run dev
```

### 5. Navigate to CRM
```
http://localhost:5001/admin/crm/leads
```

---

## 📊 Success Metrics

### KPIs to track:
```
- Lead Response Time: <5 minutes (target)
- Lead → Customer Conversion: +40% improvement
- Pipeline Velocity: Days per stage
- Win Rate: % of leads that close
- Average Deal Size: €XXX.XXX
- Activities per Lead: >5 (engaged)
- Task Completion Rate: >90%
```

---

## 🎯 Next Steps After CRM

Once CRM is complete, implement:
1. **Appointment System** (Week 3)
2. **Email Marketing** (Week 4)
3. **Analytics Dashboard** (Week 5)

---

**Implementation Plan Ende**
**Bereit zum Start!** 🚀
