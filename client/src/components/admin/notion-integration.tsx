import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Settings,
  Users,
  Building,
  Mail,
  Calendar,
} from "lucide-react";

interface ConnectionStatus {
  success: boolean;
  message?: string;
  error?: string;
}

interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
}

export default function NotionIntegration() {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test Notion connection
  const { data: connectionStatus, isLoading: connectionLoading } = useQuery<ConnectionStatus>({
    queryKey: ["/api/notion/test"],
    refetchInterval: 30000, // Check connection every 30 seconds
  });

  // Get Notion tasks
  const { data: notionTasks, isLoading: tasksLoading } = useQuery<NotionTask[]>({
    queryKey: ["/api/notion/tasks"],
    enabled: connectionStatus?.success === true,
  });

  const syncInquiryMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      return await apiRequest(`/api/notion/sync-inquiry/${inquiryId}`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich synchronisiert",
        description: "Anfrage wurde zu Notion hinzugefügt",
      });
    },
    onError: () => {
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: "Anfrage konnte nicht zu Notion hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  const syncPropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return await apiRequest(`/api/notion/sync-property/${propertyId}`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich synchronisiert",
        description: "Immobilie wurde zu Notion hinzugefügt",
      });
    },
    onError: () => {
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: "Immobilie konnte nicht zu Notion hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return await apiRequest("/api/notion/create-task", { method: "POST", body: taskData });
    },
    onSuccess: () => {
      toast({
        title: "Aufgabe erstellt",
        description: "Neue Aufgabe wurde in Notion erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notion/tasks"] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "hoch":
        return "bg-red-100 text-red-800";
      case "mittel":
        return "bg-yellow-100 text-yellow-800";
      case "niedrig":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "zu erledigen":
        return "bg-blue-100 text-blue-800";
      case "in bearbeitung":
        return "bg-orange-100 text-orange-800";
      case "erledigt":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5" />
            <span>Notion Integration</span>
            {connectionStatus?.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sync">Automatische Synchronisation</Label>
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className={`w-3 h-3 rounded-full ${connectionStatus?.success ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span
                  className={
                    connectionStatus?.success
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {connectionStatus?.success ? "Verbunden" : "Nicht verbunden"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Immobilien</span>
              </h4>
              <p className="text-sm text-gray-600">
                Automatisch zu Notion synchronisiert
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Kundenanfragen</span>
              </h4>
              <p className="text-sm text-gray-600">
                Automatisch zu Notion synchronisiert
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notion Tasks */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Notion Aufgaben</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/notion/tasks"],
                })
              }
              disabled={tasksLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${tasksLoading ? "animate-spin" : ""}`}
              />
              Aktualisieren
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {notionTasks && notionTasks.length > 0 ? (
                notionTasks.map((task: NotionTask) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority || "Normal"}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status || "Zu erledigen"}
                        </Badge>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {task.assignee && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{task.assignee}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString(
                                "de-DE",
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://notion.so/${task.id.replace(/-/g, "")}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine offenen Aufgaben in Notion</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => {
                createTaskMutation.mutate({
                  title: "Neuer Kundenbesichtigung",
                  description: "Besichtigung für neue Immobilie planen",
                  priority: "Hoch",
                  type: "Immobilien",
                });
              }}
              disabled={
                createTaskMutation.isPending || !connectionStatus?.success
              }
              className="h-20 flex-col space-y-2"
            >
              <Calendar className="w-6 h-6" />
              <span>Besichtigung planen</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                createTaskMutation.mutate({
                  title: "Newsletter vorbereiten",
                  description: "Monatlicher Newsletter mit neuen Immobilien",
                  priority: "Mittel",
                  type: "Marketing",
                });
              }}
              disabled={
                createTaskMutation.isPending || !connectionStatus?.success
              }
              className="h-20 flex-col space-y-2"
            >
              <Mail className="w-6 h-6" />
              <span>Newsletter Aufgabe</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
