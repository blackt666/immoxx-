import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
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

  const testimonials = [
    {
      id: 1,
      name: "Familie Weber",
      location: "Friedrichshafen",
      rating: 5,
      text: "Herr Müller hat uns beim Verkauf unseres Hauses professionell begleitet. Seine Marktkenntnis und sein Engagement haben uns überzeugt. Der Verkauf wurde schnell und zu einem sehr guten Preis abgewickelt.",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 2,
      name: "Dr. Schmidt",
      location: "Konstanz",
      rating: 5,
      text: "Die Immobilienbewertung war sehr präzise und detailliert. Herr Müller hat sich viel Zeit genommen und alle unsere Fragen kompetent beantwortet. Wir können ihn uneingeschränkt weiterempfehlen.",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 3,
      name: "Sarah Kaufmann",
      location: "Meersburg",
      rating: 5,
      text: "Dank der hervorragenden Beratung von Herrn Müller haben wir unsere Traumimmobilie gefunden. Seine lokale Expertise und sein persönlicher Service haben den Unterschied gemacht.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="py-12 bg-gray-50" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Was unsere Kunden sagen
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vertrauen Sie auf die Erfahrungen zufriedener Kunden – lesen Sie,
            was andere über unsere Arbeit sagen
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.id}
              className={`group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{
                transitionDelay: `${index * 200}ms`,
              }}
            >
              <CardContent className="p-8 relative">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6">
                  <Quote className="w-8 h-8 text-[var(--arctic-blue)]/20" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </blockquote>

                {/* Customer Info */}
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-[var(--arctic-blue)] transition-colors">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badge */}
        <div
          className={`text-center mt-16 transform transition-all duration-700 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="inline-flex items-center bg-white rounded-full px-8 py-4 shadow-lg">
            <div className="flex items-center mr-6">
              {renderStars(5)}
              <span className="ml-2 text-2xl font-bold text-gray-900">5.0</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">
                98% Kundenzufriedenheit
              </div>
              <div className="text-xs text-gray-600">
                Basierend auf 200+ Bewertungen
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
