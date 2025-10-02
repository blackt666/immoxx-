import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Save,
  Eye,
  Send,
  Download,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function NewsletterManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newsletter, setNewsletter] = useState({
    subject: "",
    content: "",
    category: "",
  });

  const { data: newsletters } = useQuery({
    queryKey: ["/api/newsletters"],
  });

  const { data: subscribers } = useQuery({
    queryKey: ["/api/newsletter-subscribers"],
  });

  const createNewsletterMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("/api/newsletters", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletters"] });
      setNewsletter({ subject: "", content: "", category: "" });
      toast({
        title: "Newsletter erstellt",
        description: "Der Newsletter wurde erfolgreich erstellt",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Newsletter konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (status: string) => {
    if (!newsletter.subject || !newsletter.content) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    createNewsletterMutation.mutate({
      ...newsletter,
      status,
    });
  };

  const subscriberStats = {
    total: Array.isArray(subscribers) ? subscribers.length : 0,
    active: Array.isArray(subscribers)
      ? subscribers.filter((s: any) => s.status === "active").length
      : 0,
    newThisWeek: Array.isArray(subscribers)
      ? subscribers.filter((s: any) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.subscribeDate) > weekAgo;
        }).length
      : 0,
    openRate: "78.5%", // This would come from analytics
  };

  const recentCampaigns = Array.isArray(newsletters)
    ? newsletters.slice(0, 3)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Newsletter Editor */}
      <div className="lg:col-span-2">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Newsletter erstellen
            </h2>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Betreff</Label>
                  <Input
                    id="subject"
                    placeholder="Newsletter Betreff"
                    value={newsletter.subject}
                    onChange={(e) =>
                      setNewsletter((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={newsletter.category}
                    onValueChange={(value) =>
                      setNewsletter((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_properties">
                        Neue Immobilien
                      </SelectItem>
                      <SelectItem value="market_update">Marktupdate</SelectItem>
                      <SelectItem value="tips">Tipps & Ratgeber</SelectItem>
                      <SelectItem value="company_news">
                        Unternehmensnews
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Newsletter Inhalt</Label>
                <Textarea
                  id="content"
                  rows={12}
                  placeholder="Ihren Newsletter-Inhalt hier eingeben..."
                  value={newsletter.content}
                  onChange={(e) =>
                    setNewsletter((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="resize-none"
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit("draft")}
                  disabled={createNewsletterMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Als Entwurf speichern
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--arctic-blue)] text-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/5"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vorschau
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit("sent")}
                  disabled={createNewsletterMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Newsletter versenden
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Subscriber Stats */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Abonnenten Statistiken
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Gesamt Abonnenten</span>
                <span className="font-semibold text-gray-900">
                  {subscriberStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Aktive Abonnenten</span>
                <span className="font-semibold text-green-600">
                  {subscriberStats.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Neue diese Woche</span>
                <span className="font-semibold text-blue-600">
                  {subscriberStats.newThisWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Öffnungsrate</span>
                <span className="font-semibold text-gray-900">
                  {subscriberStats.openRate}
                </span>
              </div>
            </div>

            <Button className="w-full mt-4 bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90">
              <Download className="w-4 h-4 mr-2" />
              CSV Export
            </Button>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Letzte Kampagnen
            </h3>

            <div className="space-y-4">
              {recentCampaigns.map((campaign: any, index: number) => (
                <div
                  key={campaign.id}
                  className={`border-l-4 pl-4 ${
                    index === 0
                      ? "border-green-500"
                      : index === 1
                        ? "border-blue-500"
                        : "border-orange-500"
                  }`}
                >
                  <h4 className="font-medium text-gray-900">
                    {campaign.subject}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Gesendet:{" "}
                    {campaign.sentAt
                      ? new Date(campaign.sentAt).toLocaleDateString("de-DE")
                      : "Entwurf"}
                  </p>
                  {campaign.openRate && (
                    <p
                      className={`text-sm ${
                        index === 0
                          ? "text-green-600"
                          : index === 1
                            ? "text-blue-600"
                            : "text-orange-600"
                      }`}
                    >
                      Öffnungsrate: {campaign.openRate}%
                    </p>
                  )}
                </div>
              ))}

              {recentCampaigns.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Keine Kampagnen vorhanden
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
