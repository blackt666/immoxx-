import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useQuery } from '@tanstack/react-query';

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
  source?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

export function LeadDetailModal({ lead, open, onClose, onEdit, onDelete }: LeadDetailModalProps) {
  if (!lead) return null;

  // Fetch activities for this lead
  const { data: activitiesData } = useQuery({
    queryKey: ['lead-activities', lead.id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/v2/leads/${lead.id}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
    enabled: open && !!lead.id,
  });

  // Fetch tasks for this lead
  const { data: tasksData } = useQuery({
    queryKey: ['lead-tasks', lead.id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/v2/tasks/lead/${lead.id}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: open && !!lead.id,
  });

  const activities = activitiesData?.data || [];
  const tasks = tasksData?.data || [];

  const temperatureColors = {
    hot: 'bg-red-500 text-white',
    warm: 'bg-orange-500 text-white',
    cold: 'text-white',
  };

  const temperatureIcons = {
    hot: '🔥',
    warm: '☀️',
    cold: '❄️',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span style={{ color: 'var(--bodensee-deep)' }}>
              {lead.first_name} {lead.last_name}
            </span>
            <Badge className={temperatureColors[lead.temperature]}>
              {temperatureIcons[lead.temperature]} {lead.temperature.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Lead Score: <strong>{lead.score}</strong> | Erstellt: {new Date(lead.created_at).toLocaleDateString('de-DE')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">📋 Informationen</TabsTrigger>
            <TabsTrigger value="activity">📊 Aktivitäten</TabsTrigger>
            <TabsTrigger value="notes">📝 Notizen</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--bodensee-deep)' }}>Kontaktdaten</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">E-Mail:</span>
                    <p>{lead.email}</p>
                  </div>
                  {lead.phone && (
                    <div>
                      <span className="text-gray-500">Telefon:</span>
                      <p>{lead.phone}</p>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <span className="text-gray-500">Quelle:</span>
                      <p>{lead.source}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--bodensee-deep)' }}>Immobilien-Präferenzen</h4>
                <div className="space-y-2 text-sm">
                  {lead.property_type && (
                    <div>
                      <span className="text-gray-500">Typ:</span>
                      <p>{lead.property_type}</p>
                    </div>
                  )}
                  {lead.preferred_location && (
                    <div>
                      <span className="text-gray-500">Standort:</span>
                      <p>{lead.preferred_location}</p>
                    </div>
                  )}
                  {lead.budget_min && lead.budget_max && (
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p>{lead.budget_min.toLocaleString()}€ - {lead.budget_max.toLocaleString()}€</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button size="sm" style={{ backgroundColor: 'var(--bodensee-water)', color: 'white' }}>
                <span className="mr-2">📞</span> Anrufen
              </Button>
              <Button size="sm" variant="outline">
                <span className="mr-2">✉️</span> E-Mail senden
              </Button>
              <Button size="sm" variant="outline">
                <span className="mr-2">📅</span> Termin planen
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-3">
              {activities.length > 0 ? (
                <>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--bodensee-deep)' }}>
                    Aktivitäten-Timeline
                  </h4>
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="border-l-2 border-gray-300 pl-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.type}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Keine Aktivitäten vorhanden</p>
                </div>
              )}
              
              {tasks.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold mt-4" style={{ color: 'var(--bodensee-deep)' }}>
                    Aufgaben
                  </h4>
                  {tasks.map((task: any) => (
                    <div key={task.id} className="border rounded p-3 mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status === 'completed' ? '✅' : '⏳'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">{lead.notes || 'Keine Notizen vorhanden'}</p>
              <Button size="sm" className="mt-2" variant="outline">
                <span className="mr-2">➕</span> Notiz hinzufügen
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(lead)}>
                ✏️ Bearbeiten
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(lead.id)}>
                🗑️ Löschen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
