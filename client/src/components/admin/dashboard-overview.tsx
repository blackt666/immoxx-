import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  Mail,
  TrendingUp,
  Users,
  Plus,
  Image,
  Send,
  Edit,
} from "lucide-react";
import ReplitStatus from "./replit-status";

interface DashboardStats {
  propertiesCount: number;
  inquiriesCount: number;
  salesCount: number;
  subscribersCount: number;
}

interface Inquiry {
  id: string;
  name: string;
  subject: string;
  status: 'new' | 'in_progress' | 'answered';
  createdAt: string;
}

interface InquiriesResponse {
  inquiries: Inquiry[];
}

interface DashboardOverviewProps {
  onTabChange: (tab: string) => void;
}

export default function DashboardOverview({
  onTabChange,
}: DashboardOverviewProps) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentInquiries } = useQuery<InquiriesResponse>({
    queryKey: ["/api/inquiries", { limit: 3 }],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Immobilie hinzufügen",
      description: "Neue Immobilie erstellen",
      icon: Plus,
      color: "text-[var(--ruskin-blue)]",
      bgColor: "bg-[var(--ruskin-blue)]/5",
      borderColor: "border-[var(--ruskin-blue)]/20",
      tab: "properties",
    },
    {
      title: "Bilder verwalten",
      description: "Galerie bearbeiten",
      icon: Image,
      color: "text-[var(--arctic-blue)]",
      bgColor: "bg-[var(--arctic-blue)]/5",
      borderColor: "border-[var(--arctic-blue)]/20",
      tab: "gallery",
    },
    {
      title: "Newsletter senden",
      description: "Neue Kampagne",
      icon: Send,
      color: "text-green-500",
      bgColor: "bg-green-500/5",
      borderColor: "border-green-500/20",
      tab: "newsletter",
    },
    {
      title: "Content bearbeiten",
      description: "Website-Texte",
      icon: Edit,
      color: "text-orange-500",
      bgColor: "bg-orange-500/5",
      borderColor: "border-orange-500/20",
      tab: "content",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stats-card border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[var(--ruskin-blue)]/10 rounded-lg">
                <Building className="w-8 h-8 text-[var(--ruskin-blue)]" />
              </div>
              <span className="text-green-500 text-sm font-medium">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.propertiesCount || 0}
            </h3>
            <p className="text-gray-600">Aktive Immobilien</p>
          </CardContent>
        </Card>

        <Card className="stats-card border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[var(--arctic-blue)]/10 rounded-lg">
                <Mail className="w-8 h-8 text-[var(--arctic-blue)]" />
              </div>
              <span className="text-green-500 text-sm font-medium">+8</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.inquiriesCount || 0}
            </h3>
            <p className="text-gray-600">Neue Anfragen</p>
          </CardContent>
        </Card>

        <Card className="stats-card border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <span className="text-green-500 text-sm font-medium">+15%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.salesCount || 0}
            </h3>
            <p className="text-gray-600">Verkäufe (Monat)</p>
          </CardContent>
        </Card>

        <Card className="stats-card border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <span className="text-green-500 text-sm font-medium">+32</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.subscribersCount || 0}
            </h3>
            <p className="text-gray-600">Newsletter Abos</p>
          </CardContent>
        </Card>
      </div>

      {/* Replit Status */}
      <div className="mb-8">
        <ReplitStatus />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Neueste Anfragen
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange("inquiries")}
                className="text-[var(--arctic-blue)] border-[var(--arctic-blue)]/20 hover:bg-[var(--arctic-blue)]/5"
              >
                Alle anzeigen
              </Button>
            </div>

            <div className="space-y-4">
              {recentInquiries?.inquiries
                ?.slice(0, 3)
                .map((inquiry: Inquiry, index: number) => (
                  <div
                    key={inquiry.id}
                    className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-[var(--ruskin-blue)] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {inquiry.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {inquiry.name}
                      </h4>
                      <p className="text-sm text-gray-600">{inquiry.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(inquiry.createdAt).toLocaleDateString(
                          "de-DE",
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        inquiry.status === "new"
                          ? "bg-yellow-100 text-yellow-800"
                          : inquiry.status === "answered"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {inquiry.status === "new"
                        ? "Neu"
                        : inquiry.status === "answered"
                          ? "Beantwortet"
                          : "In Bearbeitung"}
                    </span>
                  </div>
                )) || (
                <p className="text-gray-500 text-center py-8">
                  Keine aktuellen Anfragen
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Schnellaktionen
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onTabChange(action.tab)}
                  className={`p-4 ${action.bgColor} hover:bg-opacity-20 rounded-lg border ${action.borderColor} transition-all group`}
                >
                  <action.icon
                    className={`w-8 h-8 ${action.color} mb-3 group-hover:scale-110 transition-transform`}
                  />
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
