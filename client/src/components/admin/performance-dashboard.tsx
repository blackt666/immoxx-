
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from "lucide-react";

interface PerformanceData {
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  endpoints: {
    [key: string]: {
      averageResponseTime: number;
      requestCount: number;
      errorCount: number;
    };
  };
  systemHealth: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
}

export default function PerformanceDashboard() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Performance report query
  const { data: performanceData, isLoading, refetch } = useQuery<PerformanceData>({
    queryKey: ["/api/health/performance"],
    queryFn: async () => {
      const response = await fetch("/api/health/performance");
      if (!response.ok) throw new Error("Failed to fetch performance data");
      return response.json();
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
    retry: 1,
  });

  // Realtime metrics query
  const { data: realtimeData } = useQuery({
    queryKey: ["/api/health/performance/realtime"],
    queryFn: async () => {
      const response = await fetch("/api/health/performance/realtime");
      if (!response.ok) throw new Error("Failed to fetch realtime data");
      return response.json();
    },
    refetchInterval: autoRefresh ? 2000 : false, // Refresh every 2 seconds
    retry: 1,
  });

  const clearMetrics = async () => {
    try {
      const response = await fetch("/api/health/performance/clear", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to clear metrics");
      
      toast({
        title: "✅ Metriken gelöscht",
        description: "Performance-Daten wurden zurückgesetzt",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "❌ Fehler",
        description: "Metriken konnten nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getPerformanceStatus = (avgResponseTime: number): {
    status: string;
    color: string;
    icon: React.ReactNode;
  } => {
    if (avgResponseTime < 100) {
      return {
        status: "Excellent",
        color: "text-green-600",
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else if (avgResponseTime < 300) {
      return {
        status: "Good",
        color: "text-blue-600",
        icon: <Activity className="w-4 h-4" />
      };
    } else if (avgResponseTime < 500) {
      return {
        status: "Fair",
        color: "text-yellow-600",
        icon: <AlertTriangle className="w-4 h-4" />
      };
    } else {
      return {
        status: "Poor",
        color: "text-red-600",
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="w-6 h-6 animate-spin mr-2" />
        <span>Performance-Daten werden geladen...</span>
      </div>
    );
  }

  const performanceStatus = performanceData ? getPerformanceStatus(performanceData.summary.averageResponseTime) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Performance-Monitoring
          </h2>
          <p className="text-gray-600">
            Echtzeit-Überwachung der System-Performance und API-Metriken
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? "Auto-Refresh AN" : "Auto-Refresh AUS"}
          </Button>
          <Button onClick={clearMetrics} variant="outline" size="sm">
            Metriken löschen
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Antwortzeit</p>
                  <p className="text-2xl font-bold">
                    {performanceData.summary.averageResponseTime.toFixed(1)}ms
                  </p>
                </div>
                <div className={performanceStatus?.color}>
                  {performanceStatus?.icon}
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">
                {performanceStatus?.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Anfragen Total</p>
                  <p className="text-2xl font-bold">
                    {performanceData.summary.totalRequests.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fehlerrate</p>
                  <p className="text-2xl font-bold">
                    {performanceData.summary.errorRate.toFixed(1)}%
                  </p>
                </div>
                <AlertTriangle className={`w-6 h-6 ${performanceData.summary.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Laufzeit</p>
                  <p className="text-2xl font-bold">
                    {formatUptime(performanceData.summary.uptime)}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      {realtimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              System-Gesundheit (Echtzeit)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Speicher-Nutzung
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Heap Used:</span>
                    <span className="font-mono">{formatBytes(realtimeData.memoryUsage.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Total:</span>
                    <span className="font-mono">{formatBytes(realtimeData.memoryUsage.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RSS:</span>
                    <span className="font-mono">{formatBytes(realtimeData.memoryUsage.rss)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  CPU-Nutzung
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-mono">{(realtimeData.cpuUsage.user / 1000).toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System:</span>
                    <span className="font-mono">{(realtimeData.cpuUsage.system / 1000).toFixed(1)}ms</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Letzte Anfragen
                </h4>
                <div className="text-sm space-y-1 max-h-20 overflow-y-auto">
                  {realtimeData.lastRequests?.slice(0, 3).map((req: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="truncate">{req.endpoint}</span>
                      <span className="font-mono">{req.responseTime.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Performance */}
      {performanceData && Object.keys(performanceData.endpoints).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoint-Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(performanceData.endpoints)
                .sort(([,a], [,b]) => b.requestCount - a.requestCount)
                .slice(0, 10)
                .map(([endpoint, data]) => (
                <div key={endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{endpoint}</div>
                    <div className="text-xs text-gray-600">
                      {data.requestCount} Anfragen
                      {data.errorCount > 0 && (
                        <span className="text-red-600 ml-2">
                          ({data.errorCount} Fehler)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {data.averageResponseTime.toFixed(1)}ms
                    </div>
                    <Badge 
                      variant={data.averageResponseTime < 100 ? "default" : 
                               data.averageResponseTime < 300 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {data.averageResponseTime < 100 ? "Schnell" : 
                       data.averageResponseTime < 300 ? "OK" : "Langsam"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
