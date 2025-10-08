import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PropertyCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: "", // Verkauf, Kauf, Vermietung
    propertyType: "",
    size: "",
    location: "",
    condition: "",
    budget: "", // Budget für Kauf
    purchasePrice: "", // Kaufpreis für Verkauf
    rentPrice: "", // Mietpreis für Vermietung
    timeframe: "",
    name: "",
    email: "",
    phone: "",
    documentsNeeded: [] as string[], // Required documents based on service type
    agreeToDocuments: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const requiredFields = [
      "serviceType",
      "propertyType",
      "size",
      "location",
      "name",
      "email",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData],
    );

    if (missingFields.length > 0) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Here you would normally send to your API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      toast({
        title: "Anfrage gesendet!",
        description: "Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
      });

      // Reset form
      setFormData({
        serviceType: "",
        propertyType: "",
        size: "",
        location: "",
        condition: "",
        budget: "",
        purchasePrice: "",
        rentPrice: "",
        timeframe: "",
        name: "",
        email: "",
        phone: "",
        documentsNeeded: [],
        agreeToDocuments: false,
      });
    } catch {
      toast({
        title: "Fehler",
        description:
          "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="calculator"
      className="py-12 sm:py-20 bg-white"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-8 sm:mb-16 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Kostenlose Immobilienbewertung
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Erhalten Sie eine erste Einschätzung Ihrer Immobilie oder lassen Sie
            sich bei der Suche nach Ihrer Traumimmobilie beraten
          </p>
        </div>

        {/* Calculator Form */}
        <div
          className={`max-w-4xl mx-auto transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 mx-2 sm:mx-0">
            <CardContent className="p-4 sm:p-8">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-[var(--arctic-blue)]/10 p-4 rounded-2xl">
                  <Calculator className="w-8 h-8 text-[var(--arctic-blue)]" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Service Type Selection */}
                <div className="space-y-4">
                  <Label
                    htmlFor="serviceType"
                    className="text-base font-semibold"
                  >
                    Service-Art *
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["verkauf", "kauf", "vermietung"].map((type) => (
                      <div
                        key={type}
                        onClick={() => handleInputChange("serviceType", type)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.serviceType === type
                            ? "border-[var(--arctic-blue)] bg-[var(--arctic-blue)]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {type}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {type === "verkauf" && "Immobilie verkaufen"}
                            {type === "kauf" && "Immobilie kaufen"}
                            {type === "vermietung" && "Immobilie vermieten"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="space-y-2">
                    <Label
                      htmlFor="propertyType"
                      className="text-base font-semibold"
                    >
                      Immobilienart *
                    </Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        handleInputChange("propertyType", value)
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Immobilienart wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="einfamilienhaus">
                          Einfamilienhaus
                        </SelectItem>
                        <SelectItem value="wohnung">Wohnung</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="grundstueck">Grundstück</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-base font-semibold">
                      Größe (m²) *
                    </Label>
                    <Input
                      id="size"
                      type="number"
                      placeholder="z.B. 120"
                      value={formData.size}
                      onChange={(e) =>
                        handleInputChange("size", e.target.value)
                      }
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="text-base font-semibold"
                    >
                      Lage *
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) =>
                        handleInputChange("location", value)
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Lage wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friedrichshafen">
                          Friedrichshafen
                        </SelectItem>
                        <SelectItem value="konstanz">Konstanz</SelectItem>
                        <SelectItem value="meersburg">Meersburg</SelectItem>
                        <SelectItem value="ueberlingen">Überlingen</SelectItem>
                        <SelectItem value="andere">Andere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="condition"
                      className="text-base font-semibold"
                    >
                      Zustand
                    </Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) =>
                        handleInputChange("condition", value)
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Zustand wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neuwertig">Neuwertig</SelectItem>
                        <SelectItem value="gut">Gut</SelectItem>
                        <SelectItem value="renovierungsbeduerftig">
                          Renovierungsbedürftig
                        </SelectItem>
                        <SelectItem value="sanierungsbeduerftig">
                          Sanierungsbedürftig
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Price Fields based on Service Type */}
                  {formData.serviceType === "kauf" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="budget"
                        className="text-base font-semibold"
                      >
                        Budget (€)
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="z.B. 500000"
                        value={formData.budget}
                        onChange={(e) =>
                          handleInputChange("budget", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>
                  )}

                  {formData.serviceType === "verkauf" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="purchasePrice"
                        className="text-base font-semibold"
                      >
                        Kaufpreis (€)
                      </Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="z.B. 750000"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          handleInputChange("purchasePrice", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>
                  )}

                  {formData.serviceType === "vermietung" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="rentPrice"
                        className="text-base font-semibold"
                      >
                        Mietpreis (€/Monat)
                      </Label>
                      <Input
                        id="rentPrice"
                        type="number"
                        placeholder="z.B. 1500"
                        value={formData.rentPrice}
                        onChange={(e) =>
                          handleInputChange("rentPrice", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="timeframe"
                      className="text-base font-semibold"
                    >
                      Zeitrahmen
                    </Label>
                    <Select
                      value={formData.timeframe}
                      onValueChange={(value) =>
                        handleInputChange("timeframe", value)
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Zeitrahmen wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sofort">Sofort</SelectItem>
                        <SelectItem value="3_monate">3 Monate</SelectItem>
                        <SelectItem value="6_monate">6 Monate</SelectItem>
                        <SelectItem value="1_jahr">1 Jahr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Kontaktdaten
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-semibold">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ihr Name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-base font-semibold"
                      >
                        E-Mail *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ihre@email.de"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-base font-semibold"
                      >
                        Telefon
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Ihre Telefonnummer"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 text-white px-2 sm:px-8 py-1.5 sm:py-4 text-xs sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-5 sm:w-5 border-b-2 border-white mr-1 sm:mr-2"></div>
                        <span className="text-xs sm:text-base">
                          Wird gesendet...
                        </span>
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-0.5 sm:mr-2 w-3 h-3 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-base">
                          Beratung anfordern
                        </span>
                        <ArrowRight className="ml-0.5 sm:ml-2 w-3 h-3 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
