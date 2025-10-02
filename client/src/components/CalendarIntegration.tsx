import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar, 
  Smartphone, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Trash2,
  Plus,
  Activity,
  Clock,
  ExternalLink
} from 'lucide-react';

// Types
interface CalendarConnection {
  id: string;
  provider: 'google' | 'apple' | 'outlook';
  calendarName: string;
  isActive: boolean;
  syncDirection: 'crm_to_calendar' | 'calendar_to_crm' | 'bidirectional';
  autoSync: boolean;
  syncStatus: 'connected' | 'error' | 'disconnected' | 'syncing';
  syncError?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SyncStats {
  totalOperations: number;
  successful: number;
  failed: number;
  skipped: number;
  byOperation: {
    create: number;
    update: number;
    delete: number;
    sync: number;
  };
  byDirection: {
    crmToCalendar: number;
    calendarToCrm: number;
  };
  lastSync?: string;
  recentErrors: Array<{
    operation: string;
    direction: string;
    error: string;
    timestamp: string;
  }>;
}

// Form schemas
const appleCredentialsSchema = z.object({
  username: z.string().email('Apple ID must be a valid email'),
  password: z.string().min(1, 'App-specific password is required'),
  serverUrl: z.string().url().optional(),
});

const syncOptionsSchema = z.object({
  direction: z.enum(['crm_to_calendar', 'calendar_to_crm', 'bidirectional']),
  forceSync: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

type AppleCredentialsForm = z.infer<typeof appleCredentialsSchema>;
type SyncOptionsForm = z.infer<typeof syncOptionsSchema>;

const CalendarIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAppleDialog, setShowAppleDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<CalendarConnection | null>(null);

  // Mock agent ID - in a real app, this would come from auth context
  const agentId = 'mock-agent-123';

  // Forms
  const appleForm = useForm<AppleCredentialsForm>({
    resolver: zodResolver(appleCredentialsSchema),
    defaultValues: {
      username: '',
      password: '',
      serverUrl: '',
    },
  });

  const syncForm = useForm<SyncOptionsForm>({
    resolver: zodResolver(syncOptionsSchema),
    defaultValues: {
      direction: 'bidirectional',
      forceSync: false,
      dryRun: false,
    },
  });

  // Queries
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/calendar/connections'],
    queryFn: () => apiRequest(`/api/calendar/connections?agentId=${agentId}`),
  });

  const { data: health } = useQuery({
    queryKey: ['/api/calendar/health'],
    queryFn: () => apiRequest(`/api/calendar/health?agentId=${agentId}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/calendar/sync/stats'],
    queryFn: () => apiRequest(`/api/calendar/sync/stats?agentId=${agentId}&days=7`),
  });

  // Mutations
  const connectGoogleMutation = useMutation({
    mutationFn: () => apiRequest(`/api/calendar/google/auth-url?agentId=${agentId}`),
    onSuccess: (data) => {
      // Redirect to Google OAuth
      window.open(data.authUrl, '_blank', 'width=500,height=600');
      toast({
        title: 'Google Calendar',
        description: 'Redirecting to Google for authorization...',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive',
      });
    },
  });

  const connectAppleMutation = useMutation({
    mutationFn: (credentials: AppleCredentialsForm) =>
      apiRequest('/api/calendar/apple/connect', {
        method: 'POST',
        body: JSON.stringify({ ...credentials, agentId }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/health'] });
      setShowAppleDialog(false);
      appleForm.reset();
      toast({
        title: 'Apple Calendar Connected',
        description: 'Successfully connected to Apple Calendar!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Apple Calendar',
        variant: 'destructive',
      });
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ connectionId, updates }: { connectionId: string; updates: any }) =>
      apiRequest(`/api/calendar/connections/${connectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, agentId }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/connections'] });
      toast({
        title: 'Settings Updated',
        description: 'Calendar connection settings updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update connection settings',
        variant: 'destructive',
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest(`/api/calendar/connections/${connectionId}?agentId=${agentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/health'] });
      toast({
        title: 'Connection Deleted',
        description: 'Calendar connection removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete connection',
        variant: 'destructive',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest(`/api/calendar/connections/${connectionId}/test`, {
        method: 'POST',
        body: JSON.stringify({ agentId }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/connections'] });
      toast({
        title: data.connected ? 'Connection Successful' : 'Connection Failed',
        description: data.message,
        variant: data.connected ? 'default' : 'destructive',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ connectionId, options }: { connectionId?: string; options: any }) => {
      const url = connectionId 
        ? `/api/calendar/connections/${connectionId}/sync`
        : '/api/calendar/sync';
      return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ ...options, agentId }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/sync/stats'] });
      setShowSyncDialog(false);
      syncForm.reset();
      toast({
        title: 'Sync Completed',
        description: `Sync completed successfully. ${JSON.stringify(data.results || data.result)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Calendar sync failed',
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Calendar className="h-5 w-5 text-blue-600" data-testid="icon-google-calendar" />;
      case 'apple':
        return <Smartphone className="h-5 w-5 text-gray-700" data-testid="icon-apple-calendar" />;
      default:
        return <Calendar className="h-5 w-5" data-testid="icon-default-calendar" />;
    }
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800" data-testid="badge-status-connected">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive" title={error} data-testid="badge-status-error">Error</Badge>;
      case 'syncing':
        return <Badge variant="secondary" data-testid="badge-status-syncing">Syncing</Badge>;
      case 'disconnected':
        return <Badge variant="outline" data-testid="badge-status-disconnected">Disconnected</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-unknown">Unknown</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Apple form submission
  const onAppleSubmit = (data: AppleCredentialsForm) => {
    connectAppleMutation.mutate(data);
  };

  // Sync form submission
  const onSyncSubmit = (data: SyncOptionsForm) => {
    syncMutation.mutate({
      connectionId: selectedConnection?.id,
      options: data,
    });
  };

  if (connectionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading calendar connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your personal calendars to sync appointments automatically.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-connections">
                  {health.totalConnections}
                </div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="stat-active-connections">
                  {health.connectedCount}
                </div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="stat-error-connections">
                  {health.errorCount}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600" data-testid="stat-auto-sync">
                  {health.autoSyncEnabled}
                </div>
                <div className="text-sm text-gray-600">Auto Sync</div>
              </div>
            </div>
            {health.lastSyncAt && (
              <div className="mt-4 text-sm text-gray-600">
                Last sync: {formatDate(health.lastSyncAt)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections" data-testid="tab-connections">Connections</TabsTrigger>
          <TabsTrigger value="sync" data-testid="tab-sync">Sync Management</TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {/* Add New Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Calendar Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Calendar */}
                <Card className="border border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <h3 className="font-semibold">Google Calendar</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your Google Calendar for seamless appointment synchronization.
                    </p>
                    <Button 
                      onClick={() => connectGoogleMutation.mutate()}
                      disabled={connectGoogleMutation.isPending}
                      className="w-full"
                      data-testid="button-connect-google"
                    >
                      {connectGoogleMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Connect Google Calendar
                    </Button>
                  </CardContent>
                </Card>

                {/* Apple Calendar */}
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Smartphone className="h-6 w-6 text-gray-700" />
                      <h3 className="font-semibold">Apple Calendar</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your iCloud Calendar using your Apple ID and app-specific password.
                    </p>
                    <Dialog open={showAppleDialog} onOpenChange={setShowAppleDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" data-testid="button-connect-apple">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Connect Apple Calendar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Connect Apple Calendar</DialogTitle>
                          <DialogDescription>
                            Enter your Apple ID and app-specific password to connect your iCloud Calendar.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...appleForm}>
                          <form onSubmit={appleForm.handleSubmit(onAppleSubmit)} className="space-y-4">
                            <FormField
                              control={appleForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Apple ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="your@icloud.com" {...field} data-testid="input-apple-username" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={appleForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>App-Specific Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} data-testid="input-apple-password" />
                                  </FormControl>
                                  <FormDescription>
                                    Generate an app-specific password in your Apple ID settings.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={appleForm.control}
                              name="serverUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Server URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://caldav.icloud.com" 
                                      {...field} 
                                      data-testid="input-apple-server"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Leave empty to use default iCloud CalDAV server.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                disabled={connectAppleMutation.isPending}
                                data-testid="button-submit-apple"
                              >
                                {connectAppleMutation.isPending ? (
                                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Connect
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowAppleDialog(false)}
                                data-testid="button-cancel-apple"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Existing Connections */}
          {connections?.connections && connections.connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Calendars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.connections.map((connection: CalendarConnection) => (
                    <Card key={connection.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getProviderIcon(connection.provider)}
                            <div>
                              <h3 className="font-semibold" data-testid={`connection-name-${connection.id}`}>
                                {connection.calendarName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {connection.provider.charAt(0).toUpperCase() + connection.provider.slice(1)} Calendar
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(connection.syncStatus, connection.syncError)}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testConnectionMutation.mutate(connection.id)}
                                disabled={testConnectionMutation.isPending}
                                data-testid={`button-test-${connection.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedConnection(connection);
                                  setShowSyncDialog(true);
                                }}
                                data-testid={`button-sync-${connection.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteConnectionMutation.mutate(connection.id)}
                                disabled={deleteConnectionMutation.isPending}
                                data-testid={`button-delete-${connection.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Connection Settings */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={connection.isActive}
                              onCheckedChange={(checked) =>
                                updateConnectionMutation.mutate({
                                  connectionId: connection.id,
                                  updates: { isActive: checked },
                                })
                              }
                              data-testid={`switch-active-${connection.id}`}
                            />
                            <Label>Active</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={connection.autoSync}
                              onCheckedChange={(checked) =>
                                updateConnectionMutation.mutate({
                                  connectionId: connection.id,
                                  updates: { autoSync: checked },
                                })
                              }
                              data-testid={`switch-auto-sync-${connection.id}`}
                            />
                            <Label>Auto Sync</Label>
                          </div>
                          <div className="space-y-1">
                            <Label>Sync Direction</Label>
                            <Select
                              value={connection.syncDirection}
                              onValueChange={(value) =>
                                updateConnectionMutation.mutate({
                                  connectionId: connection.id,
                                  updates: { syncDirection: value },
                                })
                              }
                            >
                              <SelectTrigger data-testid={`select-direction-${connection.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="crm_to_calendar">CRM → Calendar</SelectItem>
                                <SelectItem value="calendar_to_crm">Calendar → CRM</SelectItem>
                                <SelectItem value="bidirectional">Bidirectional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Last Sync Info */}
                        <div className="mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last sync: {formatDate(connection.lastSyncAt)}
                            </div>
                            {connection.syncError && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {connection.syncError}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sync Management Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Manual Sync
              </CardTitle>
              <CardDescription>
                Trigger manual synchronization for all calendars or specific connections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setSelectedConnection(null);
                    setShowSyncDialog(true);
                  }}
                  disabled={syncMutation.isPending}
                  data-testid="button-sync-all"
                >
                  {syncMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync All Calendars
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sync Statistics (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-operations">
                      {stats.totalStats.totalOperations}
                    </div>
                    <div className="text-sm text-gray-600">Total Operations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-successful">
                      {stats.totalStats.successful}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600" data-testid="stat-failed">
                      {stats.totalStats.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-skipped">
                      {stats.totalStats.skipped}
                    </div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                </div>

                {/* Recent Errors */}
                {stats.totalStats.recentErrors.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Errors</h3>
                    <div className="space-y-2">
                      {stats.totalStats.recentErrors.slice(0, 5).map((error: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{error.operation} - {error.direction}</span>
                            <span className="text-gray-600">{formatDate(error.timestamp)}</span>
                          </div>
                          <p className="text-sm text-red-800 mt-1">{error.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Manual Sync - {selectedConnection ? selectedConnection.calendarName : 'All Calendars'}
            </DialogTitle>
            <DialogDescription>
              Configure sync options and trigger manual synchronization.
            </DialogDescription>
          </DialogHeader>
          <Form {...syncForm}>
            <form onSubmit={syncForm.handleSubmit(onSyncSubmit)} className="space-y-4">
              <FormField
                control={syncForm.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sync Direction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sync-direction">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="crm_to_calendar">CRM → Calendar</SelectItem>
                        <SelectItem value="calendar_to_crm">Calendar → CRM</SelectItem>
                        <SelectItem value="bidirectional">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={syncForm.control}
                name="forceSync"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Force Sync</FormLabel>
                      <FormDescription>
                        Sync all items regardless of change detection.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-force-sync"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={syncForm.control}
                name="dryRun"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Dry Run</FormLabel>
                      <FormDescription>
                        Preview changes without actually syncing.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-dry-run"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={syncMutation.isPending}
                  data-testid="button-submit-sync"
                >
                  {syncMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Start Sync
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowSyncDialog(false)}
                  data-testid="button-cancel-sync"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarIntegration;