import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Home,
  Bath,
  Calendar,
  Square,
  Camera,
  Send,
  Eye,
} from "lucide-react";
import TourModal from "@/components/landing/tour-modal";
import { VirtualTour } from "@/components/landing/real-virtual-tour";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShareProperty } from "@/components/landing/share-property";

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    dsgvoAccepted: false,
    commissionAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id,
  });

  // Type safety for property data
  const safeProperty = property as any;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.dsgvoAccepted || !contactForm.commissionAccepted) {
      alert("Bitte bestätigen Sie die DSGVO und die Provisionsbelehrung.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contactForm,
          propertyId: id,
          propertyTitle: safeProperty.title,
          type: "property_inquiry",
        }),
      });

      if (response.ok) {
        alert("Ihre Anfrage wurde erfolgreich gesendet!");
        setContactForm({
          name: "",
          email: "",
          phone: "",
          message: "",
          dsgvoAccepted: false,
          commissionAccepted: false,
        });
        setIsContactFormOpen(false);
      } else {
        alert("Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.");
      }
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ruskin-blue)] mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Immobilie...</p>
        </div>
      </div>
    );
  }

  if (!safeProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Immobilie nicht gefunden</h1>
          <Link href="/">
            <Button>Zurück zur Startseite</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    if (!price || price === "Preis auf Anfrage")
      return price || "Preis auf Anfrage";
    const numPrice = parseFloat(price.replace(/[^\d]/g, ""));
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        label: "Verfügbar",
        className: "bg-green-100 text-green-800",
      },
      reserved: {
        label: "Reserviert",
        className: "bg-yellow-100 text-yellow-800",
      },
      sold: { label: "Verkauft", className: "bg-red-100 text-red-800" },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.available;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const openGoogleMaps = (location: string) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location + ", Deutschland")}`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              {(safeProperty.has360Tour ||
                safeProperty.features?.has360Tour ||
                safeProperty.features?.tour360Images?.length > 0) && (
                <Button
                  onClick={() => setIsTourModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  360° Tour ansehen
                </Button>
              )}

              <ShareProperty
                property={{
                  id: safeProperty.id,
                  title: safeProperty.title,
                  price: formatPrice(safeProperty.price),
                  location: safeProperty.location,
                  description:
                    typeof safeProperty.description === "string"
                      ? safeProperty.description
                      : "",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardContent className="p-0">
                {safeProperty.images && safeProperty.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {safeProperty.images
                      .slice(0, 4)
                      .map((imageId: string, index: number) => (
                        <div
                          key={imageId}
                          className={`relative ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                        >
                          <img
                            src={`/api/gallery/${imageId}/image`}
                            alt={`${safeProperty.title} - Bild ${index + 1}`}
                            className="w-full h-64 md:h-80 object-cover rounded-lg"
                          />
                          {index === 3 && safeProperty.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-white text-lg font-semibold">
                                +{safeProperty.images.length - 4} weitere
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">
                      Keine Bilder verfügbar
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Beschreibung</h2>
                <p className="text-gray-600 leading-relaxed">
                  {(() => {
                    try {
                      if (typeof safeProperty.description === "string") {
                        return safeProperty.description;
                      }
                      if (
                        typeof safeProperty.description === "object" &&
                        safeProperty.description !== null
                      ) {
                        return JSON.stringify(safeProperty.description);
                      }
                      return "Keine Beschreibung verfügbar.";
                    } catch (error) {
                      console.error("Error rendering description:", error);
                      return "Keine Beschreibung verfügbar.";
                    }
                  })()}
                </p>
              </CardContent>
            </Card>

            {/* Property Features */}
            {safeProperty.features && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Ausstattung</h2>
                  <div className="text-gray-600">
                    {(() => {
                      try {
                        if (typeof safeProperty.features === "string") {
                          return safeProperty.features;
                        }
                        if (
                          safeProperty.features?.features &&
                          Array.isArray(safeProperty.features.features)
                        ) {
                          return safeProperty.features.features.join(", ");
                        }
                        if (Array.isArray(safeProperty.features)) {
                          return safeProperty.features.join(", ");
                        }
                        if (typeof safeProperty.features === "object") {
                          return (
                            Object.values(safeProperty.features)
                              .filter(Boolean)
                              .join(", ") || "Ausstattungsdetails verfügbar"
                          );
                        }
                        return "Ausstattungsdetails verfügbar";
                      } catch (error) {
                        console.error("Error rendering features:", error);
                        return "Ausstattungsdetails verfügbar";
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Virtual Tour */}
            {(safeProperty.features?.has360Tour ||
              safeProperty.features?.tour360Images?.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Eye className="w-6 h-6 mr-2 text-[var(--arctic-blue)]" />
                    360° Virtuelle Tour
                  </h2>
                  <VirtualTour property={safeProperty} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Details Card */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold mb-2">
                    {safeProperty.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <button
                      onClick={() => openGoogleMaps(safeProperty.location)}
                      className="hover:text-[var(--ruskin-blue)] transition-colors"
                    >
                      {safeProperty.location}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[var(--ruskin-blue)]">
                      {formatPrice(safeProperty.price)}
                    </span>
                    {getStatusBadge(safeProperty.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Typ</span>
                    <span className="font-medium">{safeProperty.type}</span>
                  </div>

                  {safeProperty.size && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Wohnfläche</span>
                      </div>
                      <span className="font-medium">
                        {safeProperty.size} m²
                      </span>
                    </div>
                  )}

                  {safeProperty.rooms && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Zimmer</span>
                      </div>
                      <span className="font-medium">{safeProperty.rooms}</span>
                    </div>
                  )}

                  {safeProperty.bathrooms && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Badezimmer</span>
                      </div>
                      <span className="font-medium">
                        {safeProperty.bathrooms}
                      </span>
                    </div>
                  )}

                  {safeProperty.yearBuilt && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Baujahr</span>
                      </div>
                      <span className="font-medium">
                        {safeProperty.yearBuilt}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 text-white flex-1"
                      onClick={() => {
                        window.location.href = `tel:+497541123456`;
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Anrufen
                    </Button>

                    <Dialog
                      open={isContactFormOpen}
                      onOpenChange={setIsContactFormOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-[var(--arctic-blue)] text-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)] hover:text-white flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Anfrage senden
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Kontaktformular</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleContactSubmit}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              value={contactForm.name}
                              onChange={(e) =>
                                setContactForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">E-Mail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) =>
                                setContactForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                              id="phone"
                              value={contactForm.phone}
                              onChange={(e) =>
                                setContactForm((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message">Nachricht *</Label>
                            <Textarea
                              id="message"
                              rows={4}
                              value={contactForm.message}
                              onChange={(e) =>
                                setContactForm((prev) => ({
                                  ...prev,
                                  message: e.target.value,
                                }))
                              }
                              placeholder={`Ich interessiere mich für die Immobilie "${safeProperty.title}" und würde gerne weitere Informationen erhalten.`}
                              required
                            />
                          </div>

                          <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="dsgvo"
                                checked={contactForm.dsgvoAccepted}
                                onCheckedChange={(checked) =>
                                  setContactForm((prev) => ({
                                    ...prev,
                                    dsgvoAccepted: checked as boolean,
                                  }))
                                }
                              />
                              <Label
                                htmlFor="dsgvo"
                                className="text-sm text-gray-600"
                              >
                                Ich stimme der Verarbeitung meiner
                                personenbezogenen Daten gemäß der
                                <strong> DSGVO</strong> zu. Meine Daten werden
                                ausschließlich zur Bearbeitung meiner Anfrage
                                verwendet. *
                              </Label>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="commission"
                                checked={contactForm.commissionAccepted}
                                onCheckedChange={(checked) =>
                                  setContactForm((prev) => ({
                                    ...prev,
                                    commissionAccepted: checked as boolean,
                                  }))
                                }
                              />
                              <Label
                                htmlFor="commission"
                                className="text-sm text-gray-600"
                              >
                                Ich wurde über die{" "}
                                <strong>Provisionsbedarfanzeige</strong>{" "}
                                informiert und bin mir bewusst, dass für die
                                Vermittlung Kosten entstehen können, die ich
                                selbst zu tragen habe. *
                              </Label>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                            disabled={
                              isSubmitting ||
                              !contactForm.dsgvoAccepted ||
                              !contactForm.commissionAccepted
                            }
                          >
                            {isSubmitting ? (
                              "Sende..."
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Anfrage senden
                              </>
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <ShareProperty
                    property={{
                      id: safeProperty.id,
                      title: safeProperty.title,
                      price: formatPrice(safeProperty.price),
                      location: safeProperty.location,
                      description:
                        typeof safeProperty.description === "string"
                          ? safeProperty.description
                          : "",
                    }}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Immobilie teilen
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 360° Tour Modal */}
      {(safeProperty.has360Tour ||
        safeProperty.features?.has360Tour ||
        safeProperty.features?.tour360Images?.length > 0) && (
        <TourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          property={safeProperty}
        />
      )}
    </div>
  );
}
