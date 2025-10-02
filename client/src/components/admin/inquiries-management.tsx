import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Download, Calendar, Check, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function InquiriesManagement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/inquiries", { status: statusFilter }],
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest(`/api/inquiries/${id}`, { method: "PUT", body: { status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Status aktualisiert",
        description: "Der Anfrage-Status wurde erfolgreich geändert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Neu";
      case "in_progress":
        return "In Bearbeitung";
      case "answered":
        return "Beantwortet";
      default:
        return status;
    }
  };

  const getInquiryTypeLabel = (type: string) => {
    switch (type) {
      case "property_interest":
        return "Immobilieninteresse";
      case "valuation":
        return "Bewertung";
      case "consultation":
        return "Beratung";
      default:
        return type || "Allgemein";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--ruskin-blue)] mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Anfragen...</p>
        </div>
      </div>
    );
  }

  const inquiries = Array.isArray((data as any)?.inquiries)
    ? (data as any).inquiries
    : [];

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Kundenanfragen
            </h2>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="answered">Beantwortet</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-green-500 hover:bg-green-600">
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-4">
            {inquiries.length > 0 ? (
              inquiries.map((inquiry: any) => (
                <div
                  key={inquiry.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[var(--ruskin-blue)] text-white rounded-full flex items-center justify-center text-lg font-medium">
                        {inquiry.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {inquiry.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{inquiry.email}</span>
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{inquiry.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          inquiry.status === "new"
                            ? "default"
                            : inquiry.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          inquiry.status === "new"
                            ? "bg-red-100 text-red-800"
                            : inquiry.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {getStatusLabel(inquiry.status)}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(inquiry.createdAt).toLocaleDateString(
                          "de-DE",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Betreff: {inquiry.subject}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {inquiry.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>
                        <span className="font-medium">Typ:</span>{" "}
                        {getInquiryTypeLabel(inquiry.inquiryType)}
                      </span>
                      {inquiry.propertyId && (
                        <span>
                          <span className="font-medium">Immobilie:</span>{" "}
                          Verknüpft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {inquiry.status === "new" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Antworten
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateInquiryMutation.mutate({
                                id: inquiry.id,
                                status: "answered",
                              })
                            }
                            disabled={updateInquiryMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Als beantwortet markieren
                          </Button>
                        </>
                      )}
                      {inquiry.status === "in_progress" && (
                        <Button
                          size="sm"
                          className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Termin vereinbaren
                        </Button>
                      )}
                      {inquiry.status === "answered" && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Antwort anzeigen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4" />
                <p>Keine Anfragen gefunden</p>
                <p className="text-sm">Neue Anfragen werden hier angezeigt</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
