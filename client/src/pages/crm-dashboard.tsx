import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  AlertCircle,
} from 'lucide-react';
import { LeadDetailModal } from '../components/crm/LeadDetailModal';
import { NewLeadModal } from '../components/crm/NewLeadModal';
import { useToast } from '../hooks/use-toast';

// Types
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  pipeline_stage: string;
  score: number;
  temperature: 'hot' | 'warm' | 'cold';
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  preferred_location?: string;
  created_at: string;
}

interface LeadsResponse {
  success: boolean;
  data: Lead[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Pipeline stages configuration with Bodensee colors
const PIPELINE_STAGES = [
  { id: 'inbox', label: 'Posteingang', colorStyle: { backgroundColor: 'var(--bodensee-shore)', color: 'var(--bodensee-deep)' }, icon: '📥' },
  { id: 'contacted', label: 'Kontaktiert', colorStyle: { backgroundColor: 'var(--bodensee-sand)', color: 'var(--bodensee-deep)' }, icon: '📞' },
  { id: 'qualified', label: 'Qualifiziert', colorStyle: { backgroundColor: '#d4edda', color: '#155724' }, icon: '✓' },
  { id: 'viewing_scheduled', label: 'Besichtigung', colorStyle: { backgroundColor: 'var(--bodensee-water)', color: 'white', opacity: 0.7 }, icon: '🏠' },
  { id: 'offer_made', label: 'Angebot', colorStyle: { backgroundColor: '#fff3cd', color: '#856404' }, icon: '💰' },
  { id: 'negotiation', label: 'Verhandlung', colorStyle: { backgroundColor: '#ffeaa7', color: '#856404' }, icon: '🤝' },
  { id: 'won', label: 'Gewonnen', colorStyle: { backgroundColor: '#c3e6cb', color: '#155724' }, icon: '🎉' },
  { id: 'lost', label: 'Verloren', colorStyle: { backgroundColor: '#f5c6cb', color: '#721c24' }, icon: '❌' },
];

export default function CRMDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch leads
  const { data: leadsData, isLoading, error } = useQuery<LeadsResponse>({
    queryKey: ['crm-leads', selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('temperature', selectedFilter);
      }

      const res = await fetch(`/api/crm/v2/leads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      return res.json();
    },
  });

  const leads = leadsData?.data || [];

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/crm/v2/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({
        title: 'Lead erstellt',
        description: 'Der neue Lead wurde erfolgreich erstellt.',
      });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Lead konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  // Move lead stage mutation
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const res = await fetch(`/api/crm/v2/leads/${leadId}/move-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      if (!res.ok) throw new Error('Failed to move lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({
        title: 'Lead verschoben',
        description: 'Der Lead wurde erfolgreich verschoben.',
      });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`/api/crm/v2/leads/${leadId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      setShowLeadDetail(false);
      toast({
        title: 'Lead gelöscht',
        description: 'Der Lead wurde erfolgreich gelöscht.',
      });
    },
  });

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;

    // Find the lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.pipeline_stage === newStage) return;

    // Optimistic update
    queryClient.setQueryData(['crm-leads', selectedFilter], (old: LeadsResponse | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map(l =>
          l.id === leadId ? { ...l, pipeline_stage: newStage } : l
        ),
      };
    });

    // Move lead
    moveLeadMutation.mutate({ leadId, newStage });
  };

  // Filter leads by search query
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.first_name.toLowerCase().includes(query) ||
      lead.last_name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      (lead.phone && lead.phone.includes(query))
    );
  });

  // Group leads by pipeline stage
  const leadsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(lead => lead.pipeline_stage === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Statistics
  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.temperature === 'hot').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    cold: leads.filter(l => l.temperature === 'cold').length,
  };

  // Temperature badge component
  const TemperatureBadge = ({ temperature }: { temperature: string }) => {
    const colors = {
      hot: 'bg-red-500 text-white',
      warm: 'bg-orange-500 text-white',
      cold: 'bg-blue-500 text-white',
    };
    const icons = {
      hot: '🔥',
      warm: '☀️',
      cold: '❄️',
    };
    return (
      <Badge className={colors[temperature as keyof typeof colors]}>
        {icons[temperature as keyof typeof icons]} {temperature.toUpperCase()}
      </Badge>
    );
  };

  // Draggable Lead Card component
  const DraggableLeadCard = ({ lead }: { lead: Lead }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: lead.id,
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card
          className="p-4 mb-3 hover:shadow-md transition-shadow cursor-move"
          onClick={(e) => {
            // Only open detail if not dragging
            if (!isDragging) {
              setSelectedLead(lead);
              setShowLeadDetail(true);
            }
          }}
        >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-sm" style={{ color: 'var(--bodensee-deep)' }}>
            {lead.first_name} {lead.last_name}
          </h4>
          <p className="text-xs text-gray-500">{lead.email}</p>
        </div>
        <TemperatureBadge temperature={lead.temperature} />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        {lead.phone && (
          <div className="flex items-center gap-1">
            <span>📞</span>
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.property_type && (
        <div className="text-xs text-gray-600 mb-1">
          <span className="font-medium">Typ:</span> {lead.property_type}
        </div>
      )}

      {lead.budget_min && lead.budget_max && (
        <div className="text-xs text-gray-600 mb-1">
          <span className="font-medium">Budget:</span> {lead.budget_min.toLocaleString()}€ - {lead.budget_max.toLocaleString()}€
        </div>
      )}

      {lead.preferred_location && (
        <div className="text-xs text-gray-600 mb-2">
          <span className="font-medium">Ort:</span> {lead.preferred_location}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs font-semibold" style={{ color: 'var(--bodensee-deep)' }}>
          Score: {lead.score}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => e.stopPropagation()}>
            <span>📞</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => e.stopPropagation()}>
            <span>✉️</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => e.stopPropagation()}>
            <span>📅</span>
          </Button>
        </div>
      </div>
        </Card>
      </div>
    );
  };

  // Droppable Stage Column component
  const DroppableStageColumn = ({ stage, leads }: { stage: any; leads: Lead[] }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: stage.id,
    });

    return (
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 w-80 ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      >
        <div className="rounded-t-lg p-3 mb-2" style={stage.colorStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{stage.icon}</span>
              <h3 className="font-semibold">{stage.label}</h3>
            </div>
            <Badge variant="secondary">
              {leads.length}
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-b-lg p-3 min-h-[500px] max-h-[600px] overflow-y-auto">
          {leads.length > 0 ? (
            leads.map(lead => (
              <DraggableLeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Keine Leads</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--bodensee-water)' }}></div>
          <p className="text-gray-600">Lade CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Fehler beim Laden</h3>
          </div>
          <p className="text-gray-600">
            CRM Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" style={{ color: 'var(--bodensee-water)' }} className="hover:opacity-80 font-semibold">
              ← Zurück zur Startseite
            </a>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>CRM Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--bodensee-sand)', color: 'var(--bodensee-deep)' }}>
              📊 Admin Bereich
            </a>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Subtitle */}
        <div className="mb-6">
          <p className="text-gray-600">Lead Management & Pipeline Übersicht</p>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gesamt Leads</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>{stats.total}</p>
            </div>
            <span style={{ fontSize: '32px' }}>👥</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hot Leads 🔥</p>
              <p className="text-2xl font-bold text-red-500">{stats.hot}</p>
            </div>
            <span style={{ fontSize: '32px' }}>📈</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warm Leads ☀️</p>
              <p className="text-2xl font-bold text-orange-500">{stats.warm}</p>
            </div>
            <span style={{ fontSize: '32px' }}>📊</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cold Leads ❄️</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--bodensee-water)' }}>{stats.cold}</p>
            </div>
            <span style={{ fontSize: '32px' }}>📉</span>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="🔍 Lead suchen (Name, E-Mail, Telefon)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            Alle
          </Button>
          <Button
            variant={selectedFilter === 'hot' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('hot')}
          >
            🔥 Hot
          </Button>
          <Button
            variant={selectedFilter === 'warm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('warm')}
          >
            ☀️ Warm
          </Button>
          <Button
            variant={selectedFilter === 'cold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('cold')}
          >
            ❄️ Cold
          </Button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <span className="mr-2">⬇️</span>
            Export
          </Button>
          <Button
            size="sm"
            style={{ backgroundColor: 'var(--bodensee-water)', color: 'white' }}
            onClick={() => setShowNewLead(true)}
          >
            <span className="mr-2">➕</span>
            Neuer Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto">
          <div className="inline-flex gap-4 min-w-full pb-4">
            {PIPELINE_STAGES.map(stage => (
              <DroppableStageColumn
                key={stage.id}
                stage={stage}
                leads={leadsByStage[stage.id] || []}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <Card className="p-4 opacity-90 shadow-2xl" style={{ backgroundColor: 'var(--bodensee-sand)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--bodensee-deep)' }}>
                Verschiebe Lead...
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Calendar Integration Info */}
      <Card className="mt-6 p-4">
        <div className="flex items-start gap-3">
          <span style={{ fontSize: '32px' }}>📅</span>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--bodensee-deep)' }}>Apple Kalender Integration</h3>
            <p className="text-sm text-gray-600 mb-2">
              Exportieren Sie Ihre CRM Aufgaben und Aktivitäten zu Apple Kalender, Google Calendar oder Outlook.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/api/crm/v2/calendar/subscribe', '_blank')}
              >
                Kalender Abonnement einrichten
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/api/crm/v2/calendar/tasks', '_blank')}
              >
                Aufgaben exportieren (.ics)
              </Button>
            </div>
          </div>
        </div>
      </Card>
      </div>

      {/* Modals */}
      <LeadDetailModal
        lead={selectedLead}
        open={showLeadDetail}
        onClose={() => {
          setShowLeadDetail(false);
          setSelectedLead(null);
        }}
        onDelete={(leadId) => deleteLeadMutation.mutate(leadId)}
      />

      <NewLeadModal
        open={showNewLead}
        onClose={() => setShowNewLead(false)}
        onSubmit={async (data) => {
          await createLeadMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
