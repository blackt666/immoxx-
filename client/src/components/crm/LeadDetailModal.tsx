import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Phone, Mail, Calendar, MessageSquare, FileText, Eye, Home, Clock } from 'lucide-react';

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
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'property_view' | 'viewing_scheduled' | 'offer_sent' | 'document_sent' | 'sms';
  subject?: string;
  description?: string;
  outcome?: string;
  created_at: string;
  assigned_to?: number;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Fetch activities for this lead
  useEffect(() => {
    if (open && lead) {
      setLoadingActivities(true);
      fetch(`/api/crm/v2/activities?lead_id=${lead.id}&limit=20`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setActivities(data.data || []);
          }
        })
        .catch(err => console.error('Failed to load activities:', err))
        .finally(() => setLoadingActivities(false));
    }
  }, [open, lead]);

  // Activity type icon and label mapping
  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      call: <Phone className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      meeting: <Calendar className="w-4 h-4" />,
      note: <MessageSquare className="w-4 h-4" />,
      property_view: <Eye className="w-4 h-4" />,
      viewing_scheduled: <Home className="w-4 h-4" />,
      offer_sent: <FileText className="w-4 h-4" />,
      document_sent: <FileText className="w-4 h-4" />,
      sms: <MessageSquare className="w-4 h-4" />,
    };
    return iconMap[type] || <Clock className="w-4 h-4" />;
  };

  const getActivityLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      call: 'Anruf',
      email: 'E-Mail',
      meeting: 'Meeting',
      note: 'Notiz',
      property_view: 'Immobilien-Ansicht',
      viewing_scheduled: 'Besichtigung geplant',
      offer_sent: 'Angebot gesendet',
      document_sent: 'Dokument gesendet',
      sms: 'SMS',
    };
    return labelMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  if (!lead) return null;

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
              {loadingActivities ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Laden...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Keine Aktivitäten vorhanden</p>
                  <Button size="sm" className="mt-2" variant="outline">
                    <span className="mr-2">➕</span> Aktivität hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-gray-600">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm">{getActivityLabel(activity.activity_type)}</span>
                            <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                          </div>
                          {activity.subject && (
                            <p className="text-sm font-medium mt-1">{activity.subject}</p>
                          )}
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                          {activity.outcome && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Ergebnis: {activity.outcome}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
