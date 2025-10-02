import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Home,
  Eye,
  Edit,
  Trash2,
  CalendarDays,
  Timer,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Appointment form schema
const appointmentSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  type: z.enum(['property_viewing', 'consultation', 'valuation', 'contract_signing', 'follow_up']),
  customerId: z.string().optional(),
  agentId: z.string().min(1, 'Agent ist erforderlich'),
  propertyId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Datum ist erforderlich'),
  duration: z.number().min(15).default(60),
  location: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preparation: z.string().optional()
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Appointment {
  id: string;
  title: string;
  type: string;
  status: string;
  customerId?: string;
  agentId: string;
  propertyId?: string;
  scheduledDate: string;
  endDate?: string;
  duration: number;
  location?: string;
  address?: string;
  notes?: string;
  preparation?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  no_show: 'bg-orange-100 text-orange-800'
};

const typeColors = {
  property_viewing: 'bg-purple-100 text-purple-800',
  consultation: 'bg-blue-100 text-blue-800',
  valuation: 'bg-green-100 text-green-800',
  contract_signing: 'bg-red-100 text-red-800',
  follow_up: 'bg-yellow-100 text-yellow-800'
};

const typeIcons = {
  property_viewing: Home,
  consultation: User,
  valuation: CheckCircle,
  contract_signing: Edit,
  follow_up: CalendarDays
};

export default function CRMAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointments with filters
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['/api/crm/appointments', currentPage, statusFilter, typeFilter, dateFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: '10',
        offset: (currentPage * 10).toString(),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
        ...(dateFilter && { date: dateFilter })
      });
      return apiRequest(`/api/crm/appointments?${params}`);
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: AppointmentFormData) => apiRequest('/api/crm/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/appointments'] });
      setShowCreateDialog(false);
      toast({
        title: '✅ Termin erfolgreich erstellt',
        description: 'Der neue Termin wurde gespeichert.'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Fehler beim Erstellen',
        description: error.message || 'Termin konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: '',
      type: 'property_viewing',
      scheduledDate: '',
      duration: 60,
      agentId: 'user-1' // Default to current user
    }
  });

  const onCreateAppointment = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'no_show': return AlertCircle;
      default: return Clock;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy, HH:mm', { locale: de });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'property_viewing': return 'Besichtigung';
      case 'consultation': return 'Beratung';
      case 'valuation': return 'Bewertung';
      case 'contract_signing': return 'Vertragsunterzeichnung';
      case 'follow_up': return 'Nachfassung';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Geplant';
      case 'confirmed': return 'Bestätigt';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgesagt';
      case 'rescheduled': return 'Verschoben';
      case 'no_show': return 'Nicht erschienen';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Termine werden geladen...</p>
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-appointments-title">CRM - Termine</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Termine und Besichtigungen
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-appointment">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Termin
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neuen Termin anlegen</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateAppointment)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Termin-Titel" {...field} data-testid="input-appointment-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-appointment-type">
                              <SelectValue placeholder="Termintyp wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="property_viewing">Besichtigung</SelectItem>
                            <SelectItem value="consultation">Beratung</SelectItem>
                            <SelectItem value="valuation">Bewertung</SelectItem>
                            <SelectItem value="contract_signing">Vertragsunterzeichnung</SelectItem>
                            <SelectItem value="follow_up">Nachfassung</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dauer (Min) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-appointment-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum & Uhrzeit *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-appointment-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ort</FormLabel>
                        <FormControl>
                          <Input placeholder="Büro, Online, etc." {...field} data-testid="input-appointment-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kunde</FormLabel>
                        <FormControl>
                          <Input placeholder="Kunden-ID (optional)" {...field} data-testid="input-appointment-customer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Vollständige Adresse" {...field} data-testid="input-appointment-address" />
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
                          placeholder="Zusätzliche Informationen zum Termin..."
                          {...field}
                          data-testid="textarea-appointment-notes"
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
                    data-testid="button-cancel-appointment"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAppointmentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-save-appointment"
                  >
                    {createAppointmentMutation.isPending ? 'Speichern...' : 'Speichern'}
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
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
                data-testid="input-filter-date"
              />
            </div>
            
            <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || '')}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="scheduled">Geplant</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgesagt</SelectItem>
                <SelectItem value="rescheduled">Verschoben</SelectItem>
                <SelectItem value="no_show">Nicht erschienen</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter || undefined} onValueChange={(value) => setTypeFilter(value || '')}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                <SelectValue placeholder="Typ filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="property_viewing">Besichtigung</SelectItem>
                <SelectItem value="consultation">Beratung</SelectItem>
                <SelectItem value="valuation">Bewertung</SelectItem>
                <SelectItem value="contract_signing">Vertragsunterzeichnung</SelectItem>
                <SelectItem value="follow_up">Nachfassung</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointmentsData?.appointments?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Termine gefunden</h3>
              <p className="text-muted-foreground text-center mb-4">
                {statusFilter || typeFilter || dateFilter
                  ? 'Keine Termine entsprechen den aktuellen Filterkriterien.'
                  : 'Beginnen Sie mit dem Anlegen Ihres ersten Termins.'}
              </p>
              {!statusFilter && !typeFilter && !dateFilter && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-first-appointment"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ersten Termin anlegen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          appointmentsData?.appointments?.map((appointment: Appointment) => {
            const StatusIcon = getStatusIcon(appointment.status);
            
            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <StatusIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold" data-testid={`text-appointment-title-${appointment.id}`}>
                          {appointment.title}
                        </h3>
                        <Badge className={`text-xs ${typeColors[appointment.type as keyof typeof typeColors]}`}>
                          {getTypeLabel(appointment.type)}
                        </Badge>
                        <Badge className={`text-xs ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Datum:</span>
                          <span data-testid={`text-appointment-date-${appointment.id}`}>
                            {formatDateTime(appointment.scheduledDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Dauer:</span>
                          <span data-testid={`text-appointment-duration-${appointment.id}`}>
                            {appointment.duration} Min
                          </span>
                        </div>
                        
                        {appointment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Ort:</span>
                            <span data-testid={`text-appointment-location-${appointment.id}`}>
                              {appointment.location}
                            </span>
                          </div>
                        )}
                        
                        {appointment.customerId && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Kunde:</span>
                            <span data-testid={`text-appointment-customer-${appointment.id}`}>
                              {appointment.customerId}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {appointment.address && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Adresse:</span>
                          <span data-testid={`text-appointment-address-${appointment.id}`}>
                            {appointment.address}
                          </span>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md">
                          <p className="text-sm text-muted-foreground" data-testid={`text-appointment-notes-${appointment.id}`}>
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                      
                      {appointment.preparation && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Vorbereitung:</span>
                          </div>
                          <p className="text-sm text-blue-700" data-testid={`text-appointment-preparation-${appointment.id}`}>
                            {appointment.preparation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-view-appointment-${appointment.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-edit-appointment-${appointment.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-delete-appointment-${appointment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {appointmentsData?.total > 10 && (
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
            Seite {currentPage + 1} von {Math.ceil(appointmentsData.total / 10)}
          </span>
          <Button
            variant="outline"
            disabled={(currentPage + 1) * 10 >= appointmentsData.total}
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