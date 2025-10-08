import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Target,
  Plus,
  TrendingUp,
  Euro,
  Calendar,
  Home,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Percent,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Lead form schema
const leadSchema = z.object({
  customerId: z.string().min(1, 'Kunde ist erforderlich'),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closing', 'won', 'lost']).default('new'),
  probability: z.number().min(0).max(100).default(25),
  value: z.number().optional(),
  dealType: z.enum(['not_specified', 'sale', 'rental', 'valuation_service']).optional(),
  commission: z.number().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  actionDueDate: z.string().optional()
});

type LeadFormData = z.infer<typeof leadSchema>;

interface Lead {
  id: string;
  customerId: string;
  propertyId?: string;
  agentId?: string;
  stage: string;
  probability: number;
  value?: number;
  dealType?: string;
  commission?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  lostReason?: string;
  competitor?: string;
  notes?: string;
  nextAction?: string;
  actionDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const stageColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  qualified: 'bg-yellow-100 text-yellow-800',
  proposal_sent: 'bg-orange-100 text-orange-800',
  negotiation: 'bg-indigo-100 text-indigo-800',
  closing: 'bg-pink-100 text-pink-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
};

const dealTypeColors = {
  not_specified: 'bg-gray-100 text-gray-800',
  sale: 'bg-green-100 text-green-800',
  rental: 'bg-blue-100 text-blue-800',
  valuation_service: 'bg-yellow-100 text-yellow-800'
};

const stageOrder = {
  new: 0,
  contacted: 1,
  qualified: 2,
  proposal_sent: 3,
  negotiation: 4,
  closing: 5,
  won: 6,
  lost: 7
};

export default function CRMLeads() {
  const [stageFilter, setStageFilter] = useState<string>('');
  const [dealTypeFilter, setDealTypeFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<'value' | 'probability' | 'date'>('date');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads with filters
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['/api/crm/leads', currentPage, stageFilter, dealTypeFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: '10',
        offset: (currentPage * 10).toString(),
        ...(stageFilter && stageFilter !== 'all' && { stage: stageFilter }),
        ...(dealTypeFilter && dealTypeFilter !== 'all' && { dealType: dealTypeFilter })
      });
      return apiRequest(`/api/crm/leads?${params}`);
    }
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: LeadFormData) => apiRequest('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      setShowCreateDialog(false);
      toast({
        title: '✅ Lead erfolgreich erstellt',
        description: 'Der neue Lead wurde gespeichert.'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Fehler beim Erstellen',
        description: error.message || 'Lead konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      customerId: '',
      stage: 'new',
      probability: 25,
      dealType: 'not_specified'
    }
  });

  const onCreateLead = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  const getStageProgress = (stage: string) => {
    const progress = (stageOrder[stage as keyof typeof stageOrder] / 7) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-100';
    if (probability >= 60) return 'text-yellow-600 bg-yellow-100';
    if (probability >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'new': return 'Neu';
      case 'contacted': return 'Kontaktiert';
      case 'qualified': return 'Qualifiziert';
      case 'proposal_sent': return 'Angebot gesendet';
      case 'negotiation': return 'Verhandlung';
      case 'closing': return 'Abschluss';
      case 'won': return 'Gewonnen';
      case 'lost': return 'Verloren';
      default: return stage;
    }
  };

  const getDealTypeLabel = (dealType?: string) => {
    switch (dealType) {
      case 'sale': return 'Verkauf';
      case 'rental': return 'Vermietung';
      case 'valuation_service': return 'Bewertungsservice';
      default: return dealType || 'Nicht spezifiziert';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const calculateTotalValue = () => {
    return leadsData?.leads?.reduce((sum: number, lead: Lead) => {
      return sum + (lead.value || 0);
    }, 0) || 0;
  };

  const calculateWeightedValue = () => {
    return leadsData?.leads?.reduce((sum: number, lead: Lead) => {
      return sum + ((lead.value || 0) * (lead.probability / 100));
    }, 0) || 0;
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date < new Date();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Leads werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedLeads = leadsData?.leads?.slice().sort((a: Lead, b: Lead) => {
    switch (sortBy) {
      case 'value':
        return (b.value || 0) - (a.value || 0);
      case 'probability':
        return b.probability - a.probability;
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-leads-title">CRM - Lead Pipeline</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Sales Pipeline und Geschäftschancen
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-lead">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Lead
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neuen Lead anlegen</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateLead)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kunde *</FormLabel>
                      <FormControl>
                        <Input placeholder="Kunden-ID" {...field} data-testid="input-lead-customer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-stage">
                              <SelectValue placeholder="Stage wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Neu</SelectItem>
                            <SelectItem value="contacted">Kontaktiert</SelectItem>
                            <SelectItem value="qualified">Qualifiziert</SelectItem>
                            <SelectItem value="proposal_sent">Angebot gesendet</SelectItem>
                            <SelectItem value="negotiation">Verhandlung</SelectItem>
                            <SelectItem value="closing">Abschluss</SelectItem>
                            <SelectItem value="won">Gewonnen</SelectItem>
                            <SelectItem value="lost">Verloren</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wahrscheinlichkeit (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-lead-probability"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wert (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-lead-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal-Typ</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-deal-type">
                              <SelectValue placeholder="Deal-Typ wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_specified">Nicht spezifiziert</SelectItem>
                            <SelectItem value="sale">Verkauf</SelectItem>
                            <SelectItem value="rental">Vermietung</SelectItem>
                            <SelectItem value="valuation_service">Bewertungsservice</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provision (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15000"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-lead-commission"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expectedCloseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erwartetes Abschlussdatum</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-lead-close-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immobilie</FormLabel>
                      <FormControl>
                        <Input placeholder="Immobilien-ID (optional)" {...field} data-testid="input-lead-property" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nextAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nächste Aktion</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Angebot erstellen, Termin vereinbaren..." {...field} data-testid="input-lead-next-action" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notizen</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Zusätzliche Informationen zum Lead..."
                          {...field}
                          data-testid="textarea-lead-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-lead"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-save-lead"
                  >
                    {createLeadMutation.isPending ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Pipeline</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-pipeline-value">
              {formatCurrency(calculateTotalValue())}
            </div>
            <p className="text-xs text-muted-foreground">
              Gesamtwert aller Leads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewichteter Wert</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-weighted-pipeline-value">
              {formatCurrency(calculateWeightedValue())}
            </div>
            <p className="text-xs text-muted-foreground">
              Nach Wahrscheinlichkeit gewichtet
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-leads-count">
              {leadsData?.leads?.filter((lead: Lead) => !['won', 'lost'].includes(lead.stage))?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads in Bearbeitung
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {leadsData?.total > 0 
                ? Math.round((leadsData?.leads?.filter((lead: Lead) => lead.stage === 'won')?.length / leadsData.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Gewonnene Leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={stageFilter || undefined} onValueChange={(value) => setStageFilter(value || '')}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-stage">
                  <SelectValue placeholder="Stage filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Stages</SelectItem>
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="contacted">Kontaktiert</SelectItem>
                  <SelectItem value="qualified">Qualifiziert</SelectItem>
                  <SelectItem value="proposal_sent">Angebot gesendet</SelectItem>
                  <SelectItem value="negotiation">Verhandlung</SelectItem>
                  <SelectItem value="closing">Abschluss</SelectItem>
                  <SelectItem value="won">Gewonnen</SelectItem>
                  <SelectItem value="lost">Verloren</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dealTypeFilter || undefined} onValueChange={(value) => setDealTypeFilter(value || '')}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-deal-type">
                  <SelectValue placeholder="Deal-Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="sale">Verkauf</SelectItem>
                  <SelectItem value="rental">Vermietung</SelectItem>
                  <SelectItem value="valuation_service">Bewertungsservice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'value' | 'probability' | 'date')}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Datum</SelectItem>
                <SelectItem value="value">Wert</SelectItem>
                <SelectItem value="probability">Wahrscheinlichkeit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {sortedLeads?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Leads gefunden</h3>
              <p className="text-muted-foreground text-center mb-4">
                {stageFilter || dealTypeFilter
                  ? 'Keine Leads entsprechen den aktuellen Filterkriterien.'
                  : 'Beginnen Sie mit dem Anlegen Ihres ersten Leads.'}
              </p>
              {!stageFilter && !dealTypeFilter && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-first-lead"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ersten Lead anlegen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedLeads?.map((lead: Lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold" data-testid={`text-lead-customer-${lead.id}`}>
                        Kunde: {lead.customerId}
                      </h3>
                      <Badge className={`text-xs ${stageColors[lead.stage as keyof typeof stageColors]}`}>
                        {getStageLabel(lead.stage)}
                      </Badge>
                      {lead.dealType && (
                        <Badge className={`text-xs ${dealTypeColors[lead.dealType as keyof typeof dealTypeColors]}`}>
                          {getDealTypeLabel(lead.dealType)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Pipeline Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Pipeline-Fortschritt</span>
                        <span className="text-sm font-medium">{Math.round(getStageProgress(lead.stage))}%</span>
                      </div>
                      <Progress value={getStageProgress(lead.stage)} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Wert:</span>
                        <span className="font-semibold" data-testid={`text-lead-value-${lead.id}`}>
                          {formatCurrency(lead.value)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Wahrscheinlichkeit:</span>
                        <Badge className={`text-xs ${getProbabilityColor(lead.probability)}`}>
                          {lead.probability}%
                        </Badge>
                      </div>
                      
                      {lead.commission && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Provision:</span>
                          <span data-testid={`text-lead-commission-${lead.id}`}>
                            {formatCurrency(lead.commission)}
                          </span>
                        </div>
                      )}
                      
                      {lead.expectedCloseDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isOverdue(lead.expectedCloseDate) ? 'text-red-500' : 'text-muted-foreground'}`} />
                          <span className="text-muted-foreground">Abschluss:</span>
                          <span className={isOverdue(lead.expectedCloseDate) ? 'text-red-600 font-semibold' : ''} data-testid={`text-lead-close-date-${lead.id}`}>
                            {formatDate(lead.expectedCloseDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {lead.propertyId && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Immobilie:</span>
                        <span data-testid={`text-lead-property-${lead.id}`}>{lead.propertyId}</span>
                      </div>
                    )}
                    
                    {lead.nextAction && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Nächste Aktion:</span>
                        </div>
                        <p className="text-sm text-blue-700" data-testid={`text-lead-next-action-${lead.id}`}>
                          {lead.nextAction}
                        </p>
                        {lead.actionDueDate && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600">
                              Fällig: {formatDate(lead.actionDueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {lead.notes && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-md">
                        <p className="text-sm text-muted-foreground" data-testid={`text-lead-notes-${lead.id}`}>
                          {lead.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-view-lead-${lead.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-edit-lead-${lead.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-delete-lead-${lead.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {leadsData?.total > 10 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
            data-testid="button-prev-page"
          >
            Vorherige
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-muted-foreground">
            Seite {currentPage + 1} von {Math.ceil(leadsData.total / 10)}
          </span>
          <Button
            variant="outline"
            disabled={(currentPage + 1) * 10 >= leadsData.total}
            onClick={() => setCurrentPage(currentPage + 1)}
            data-testid="button-next-page"
          >
            Nächste
          </Button>
        </div>
      )}
    </div>
  );
}