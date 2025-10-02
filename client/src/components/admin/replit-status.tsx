import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface HealthData {
  status: string;
  timestamp: string;
  environment: string;
  replit: {
    isReplit: boolean;
    info?: {
      slug: string;
      owner: string;
      replUrl: string;
    };
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    maxRecommendedMB: number | string;
    isHighUsage: boolean;
  };
  warnings: string[];
}

export default function ReplitStatus() {
  const {
    data: health,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiRequest<HealthData>("/api/health/detailed"),
    refetchInterval: 30000, // Update every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading system status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  // Defensive check for health structure
  if (!health.replit || !health.memory) {
    console.warn('Health data structure incomplete:', health);
    return (
      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>System Status</span>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Loading...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">System status wird geladen...</p>
        </CardContent>
      </Card>
    );
  }

  const memoryPercent =
    typeof health.memory.maxRecommendedMB === "number"
      ? (health.memory.heapUsedMB / health.memory.maxRecommendedMB) * 100
      : 0;

  return (
    <Card
      className={
        health.warnings.length > 0 ? "border-yellow-500" : "border-green-500"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>System Status</span>
            {health?.replit?.isReplit && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Replit
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Environment:</span>
          <Badge
            variant={health.environment === "replit" ? "default" : "secondary"}
          >
            {health.environment}
          </Badge>
        </div>

        {/* Replit-specific info */}
        {health?.replit?.isReplit && health.replit.info && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Repl URL:</span>
              <a
                href={health.replit.info.replUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate max-w-48"
              >
                {health.replit.info.slug}.{health.replit.info.owner}.repl.co
              </a>
            </div>
          </div>
        )}

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Memory Usage:</span>
            <span
              className={
                health.memory.isHighUsage ? "text-red-600 font-semibold" : ""
              }
            >
              {health.memory.heapUsedMB}MB
              {typeof health.memory.maxRecommendedMB === "number" &&
                ` / ${health.memory.maxRecommendedMB}MB`}
            </span>
          </div>

          {health?.replit?.isReplit && (
            <Progress
              value={memoryPercent}
              className={`h-2 ${memoryPercent > 90 ? "bg-red-100" : memoryPercent > 75 ? "bg-yellow-100" : "bg-green-100"}`}
            />
          )}
        </div>

        {/* Warnings */}
        {health.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Warnings:</span>
            </div>
            {health.warnings.map((warning, index) => (
              <div
                key={index}
                className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
              >
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-center pt-2">
          {health.warnings.length === 0 ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">System Healthy</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Needs Attention</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}