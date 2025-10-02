import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MapPin, Bed, Bath, Square } from "lucide-react";

export default function PropertiesNavigation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const element = document.getElementById("properties-nav");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const scrollToProperties = () => {
    const element = document.querySelector("#properties");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="properties-nav"
      className="py-4 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Section Header */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Aktuelle Immobilien
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Entdecken Sie unsere handverlesenen Immobilien in der
              Bodenseeregion
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[var(--arctic-blue)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-[var(--arctic-blue)]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Premium Lagen
                </h3>
                <p className="text-gray-600">
                  Direkt am Bodensee und in begehrten Wohngebieten
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[var(--arctic-blue)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Square className="w-6 h-6 text-[var(--arctic-blue)]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Vielfältige Auswahl
                </h3>
                <p className="text-gray-600">
                  Von Eigentumswohnungen bis hin zu Villen
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[var(--arctic-blue)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-[var(--arctic-blue)]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Exklusive Einblicke
                </h3>
                <p className="text-gray-600">
                  Detaillierte Exposés und virtuelle Rundgänge
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToProperties}
            size="lg"
            className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Eye className="mr-2 w-5 h-5" />
            Alle Immobilien ansehen
          </Button>
        </div>
      </div>
    </section>
  );
}
