import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Customer form schema
const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional(),
  type: z.enum(['lead', 'prospect', 'active_client', 'past_client']).default('lead'),
  status: z.enum(['new', 'contacted', 'qualified', 'interested', 'not_interested']).default('new'),
  leadScore: z.number().min(0).max(100).default(50),
  assignedAgent: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  timeline: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  status: string;
  leadScore: number;
  assignedAgent?: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  address?: string;
  occupation?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  interested: 'bg-purple-100 text-purple-800',
  not_interested: 'bg-gray-100 text-gray-800'
};

const typeColors = {
  lead: 'bg-orange-100 text-orange-800',
  prospect: 'bg-blue-100 text-blue-800',
  active_client: 'bg-green-100 text-green-800',
  past_client: 'bg-gray-100 text-gray-800'
};

export default function CRMCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers with filters
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['/api/crm/customers', currentPage, searchTerm, typeFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: '10',
        offset: (currentPage * 10).toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      });
      return apiRequest(`/api/crm/customers?${params}`);
    }
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiRequest('/api/crm/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers'] });
      setShowCreateDialog(false);
      toast({
        title: '✅ Kunde erfolgreich erstellt',
        description: 'Der neue Kunde wurde zur Datenbank hinzugefügt.'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Fehler beim Erstellen',
        description: error.message || 'Kunde konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/crm/customers/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers'] });
      toast({
        title: '✅ Kunde gelöscht',
        description: 'Der Kunde wurde erfolgreich entfernt.'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Fehler beim Löschen',
        description: error.message || 'Kunde konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      type: 'lead',
      status: 'new',
      leadScore: 50
    }
  });

  const onCreateCustomer = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return '-';
    if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
    if (min) return `ab €${min.toLocaleString()}`;
    if (max) return `bis €${max.toLocaleString()}`;
    return '-';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Kunden werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-crm-title">CRM - Kunden</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kundenbeziehungen und Leads
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-customer">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Kunde
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neuen Kunden anlegen</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateCustomer)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Vollständiger Name" {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="kunde@example.com" {...field} data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="+49 123 456789" {...field} data-testid="input-customer-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unternehmen</FormLabel>
                        <FormControl>
                          <Input placeholder="Firma GmbH" {...field} data-testid="input-customer-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-customer-type">
                              <SelectValue placeholder="Kundentyp wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="prospect">Interessent</SelectItem>
                            <SelectItem value="active_client">Aktiver Kunde</SelectItem>
                            <SelectItem value="past_client">Ehemaliger Kunde</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-customer-status">
                              <SelectValue placeholder="Status wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Neu</SelectItem>
                            <SelectItem value="contacted">Kontaktiert</SelectItem>
                            <SelectItem value="qualified">Qualifiziert</SelectItem>
                            <SelectItem value="interested">Interessiert</SelectItem>
                            <SelectItem value="not_interested">Nicht interessiert</SelectItem>
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
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Min (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="300000"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-budget-min"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="budgetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Max (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-budget-max"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notizen</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Zusätzliche Informationen..."
                          {...field}
                          data-testid="textarea-customer-notes"
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
                    data-testid="button-cancel-customer"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCustomerMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-save-customer"
                  >
                    {createCustomerMutation.isPending ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Kunden suchen (Name, E-Mail, Telefon)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
            
            <Select value={typeFilter || undefined} onValueChange={(value) => setTypeFilter(value || '')}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Typ filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Interessent</SelectItem>
                <SelectItem value="active_client">Aktiver Kunde</SelectItem>
                <SelectItem value="past_client">Ehemaliger Kunde</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || '')}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="contacted">Kontaktiert</SelectItem>
                <SelectItem value="qualified">Qualifiziert</SelectItem>
                <SelectItem value="interested">Interessiert</SelectItem>
                <SelectItem value="not_interested">Nicht interessiert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Cards */}
      <div className="grid gap-4">
        {customersData?.customers?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Kunden gefunden</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || typeFilter || statusFilter
                  ? 'Keine Kunden entsprechen den aktuellen Filterkriterien.'
                  : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Kunden.'}
              </p>
              {!searchTerm && !typeFilter && !statusFilter && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-first-customer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ersten Kunden hinzufügen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          customersData?.customers?.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold" data-testid={`text-customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                      <Badge className={`text-xs ${typeColors[customer.type as keyof typeof typeColors]}`}>
                        {customer.type === 'lead' ? 'Lead' :
                         customer.type === 'prospect' ? 'Interessent' :
                         customer.type === 'active_client' ? 'Aktiver Kunde' :
                         'Ehemaliger Kunde'}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[customer.status as keyof typeof statusColors]}`}>
                        {customer.status === 'new' ? 'Neu' :
                         customer.status === 'contacted' ? 'Kontaktiert' :
                         customer.status === 'qualified' ? 'Qualifiziert' :
                         customer.status === 'interested' ? 'Interessiert' :
                         'Nicht interessiert'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">E-Mail:</span>
                        <span data-testid={`text-customer-email-${customer.id}`}>{customer.email}</span>
                      </div>
                      
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Telefon:</span>
                          <span data-testid={`text-customer-phone-${customer.id}`}>{customer.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Lead Score:</span>
                        <Badge className={`text-xs ${getLeadScoreColor(customer.leadScore)}`}>
                          {customer.leadScore}/100
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Budget:</span>
                        <span data-testid={`text-customer-budget-${customer.id}`}>
                          {formatBudget(customer.budgetMin, customer.budgetMax)}
                        </span>
                      </div>
                    </div>
                    
                    {(customer.company || customer.timeline || customer.address) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {customer.company && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Unternehmen:</span>
                            <span data-testid={`text-customer-company-${customer.id}`}>{customer.company}</span>
                          </div>
                        )}
                        
                        {customer.timeline && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Timeline:</span>
                            <span data-testid={`text-customer-timeline-${customer.id}`}>{customer.timeline}</span>
                          </div>
                        )}
                        
                        {customer.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Adresse:</span>
                            <span data-testid={`text-customer-address-${customer.id}`}>{customer.address}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {customer.notes && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-md">
                        <p className="text-sm text-muted-foreground" data-testid={`text-customer-notes-${customer.id}`}>
                          {customer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCustomer(customer)}
                      data-testid={`button-view-customer-${customer.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCustomerMutation.mutate(customer.id)}
                      disabled={deleteCustomerMutation.isPending}
                      data-testid={`button-delete-customer-${customer.id}`}
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

      {/* Customer Preview Dialog */}
      <Dialog open={selectedCustomer !== null} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="title-customer-preview">
              Kundendetails - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Header with badges */}
              <div className="flex flex-wrap gap-3">
                <Badge className={`${typeColors[selectedCustomer.type as keyof typeof typeColors]}`} data-testid="badge-customer-type">
                  {selectedCustomer.type === 'lead' ? 'Lead' :
                   selectedCustomer.type === 'prospect' ? 'Interessent' :
                   selectedCustomer.type === 'active_client' ? 'Aktiver Kunde' :
                   'Ehemaliger Kunde'}
                </Badge>
                <Badge className={`${statusColors[selectedCustomer.status as keyof typeof statusColors]}`} data-testid="badge-customer-status">
                  {selectedCustomer.status === 'new' ? 'Neu' :
                   selectedCustomer.status === 'contacted' ? 'Kontaktiert' :
                   selectedCustomer.status === 'qualified' ? 'Qualifiziert' :
                   selectedCustomer.status === 'interested' ? 'Interessiert' :
                   'Nicht interessiert'}
                </Badge>
                <Badge className={`${getLeadScoreColor(selectedCustomer.leadScore)}`} data-testid="badge-lead-score">
                  Lead Score: {selectedCustomer.leadScore}/100
                </Badge>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Kontaktinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">E-Mail</p>
                      <p className="font-medium" data-testid="preview-customer-email">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium" data-testid="preview-customer-phone">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedCustomer.company && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-muted-foreground rounded-sm"></div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unternehmen</p>
                        <p className="font-medium" data-testid="preview-customer-company">{selectedCustomer.company}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedCustomer.occupation && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Beruf</p>
                        <p className="font-medium" data-testid="preview-customer-occupation">{selectedCustomer.occupation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget and Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Budget & Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-lg">€</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium" data-testid="preview-customer-budget">
                        {formatBudget(selectedCustomer.budgetMin, selectedCustomer.budgetMax)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedCustomer.timeline && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Timeline</p>
                        <p className="font-medium" data-testid="preview-customer-timeline">{selectedCustomer.timeline}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedCustomer.address && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Standort</h3>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      <p className="font-medium" data-testid="preview-customer-address">{selectedCustomer.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Assignment */}
              {selectedCustomer.assignedAgent && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Zuständigkeit</h3>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Zuständiger Makler</p>
                      <p className="font-medium" data-testid="preview-customer-agent">{selectedCustomer.assignedAgent}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Notizen</h3>
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm whitespace-pre-wrap" data-testid="preview-customer-notes">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Systemdaten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Erstellt am</p>
                    <p className="font-medium" data-testid="preview-customer-created">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zuletzt aktualisiert</p>
                    <p className="font-medium" data-testid="preview-customer-updated">
                      {new Date(selectedCustomer.updatedAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCustomer(null)}
                  data-testid="button-close-preview"
                >
                  Schließen
                </Button>
                <Button
                  variant="outline"
                  data-testid="button-edit-from-preview"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {customersData?.total > 10 && (
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
            Seite {currentPage + 1} von {Math.ceil(customersData.total / 10)}
          </span>
          <Button
            variant="outline"
            disabled={(currentPage + 1) * 10 >= customersData.total}
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