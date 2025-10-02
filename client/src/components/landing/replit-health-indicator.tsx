import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface HealthData {
  status: string;
  replit: { isReplit: boolean };
  memory: { isHighUsage: boolean };
  warnings: string[];
}

export default function ReplitHealthIndicator() {
  const { data: health } = useQuery({
    queryKey: ["health-status"],
    queryFn: () => apiRequest<HealthData>("/api/health"),
    refetchInterval: 60000, // Check every minute
    retry: false,
    staleTime: 30000,
  });

  // Only show on Replit and if there are issues
  if (!health?.replit?.isReplit || !health?.warnings || health.warnings.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg max-w-sm">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 font-medium">
            System Performance Notice
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          High memory usage detected. Some features may be slower.
        </p>
      </div>
    </div>
  );
}
