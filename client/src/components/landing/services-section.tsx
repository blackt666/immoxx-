import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp,
  Home,
  Search,
  Users,
  MapPin,
  Award,
  FileText,
} from "lucide-react";

export default function ServicesSection() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const services = [
    {
      icon: TrendingUp,
      title: "Immobilienbewertung & Marktanalyse",
      description: "Professionelle Bewertung Ihrer Immobilie basierend auf aktuellen Marktdaten und langjähriger Erfahrung. Individuelle Suche nach Ihrer Traumimmobilie basierend auf Ihren spezifischen Wünschen und Anforderungen.",
      color: "text-[var(--bodensee-water)]",
      bg: "bg-[var(--bodensee-water)]/5",
      border: "border-[var(--bodensee-water)]/20",
    },
    {
      icon: Home,
      title: "Immobilienverkauf & Vermarktung",
      description: "Erfolgreicher Verkauf Ihrer Immobilie durch strategisches Marketing und professionelle Verhandlungsführung. Umfassende Beratung und Unterstützung während des gesamten Verkaufsprozesses.",
      color: "text-[var(--bodensee-stone)]",
      bg: "bg-[var(--bodensee-stone)]/5",
      border: "border-[var(--bodensee-stone)]/20",
    },
  ];

  return (
    <section id="services" className="pt-12 pb-6 bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('services.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.title}
                className={`group hover:shadow-xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 ${service.border} ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <CardContent className="p-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 ${service.bg} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${service.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[var(--arctic-blue)] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
