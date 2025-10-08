import React from "react";
import Navigation from "@/components/landing/navigation";
import HeroSection from "@/components/landing/hero-section";
import StatsSection from "@/components/landing/stats-section";
import ServicesSection from "@/components/landing/services-section";
import PropertiesShowcase from "@/components/landing/properties-showcase";
import PropertyCalculator from "@/components/landing/property-calculator";
import AboutSection from "@/components/landing/about-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import ContactSection from "@/components/landing/contact-section";
import Footer from "@/components/landing/footer";
import ReplitHealthIndicator from "@/components/landing/replit-health-indicator";
import { Calculator, User, Calendar, Home } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <PropertiesShowcase />
      <ServicesSection />
      {/* Property Calculator - Traditional Service */}
      <section id="calculator" className="py-16 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 text-sm font-medium text-green-800 mb-6">
              <Calculator className="w-5 h-5" />
              <span>📊 Traditioneller Service</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Immobilien-Finanzrechner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              Berechnen Sie Finanzierungsoptionen, Nebenkosten und erhalten Sie eine erste Kostenschätzung für Ihren Immobilienkauf oder -verkauf.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <User className="w-4 h-4 text-green-500" />
                <span>Persönliche Beratung</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Terminvereinbarung</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <Home className="w-4 h-4 text-purple-500" />
                <span>Umfassende Beratung</span>
              </div>
            </div>
          </div>
          <PropertyCalculator />
        </div>
      </section>
      {/* <GalleryShowcase /> - Deaktiviert */}
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <ReplitHealthIndicator />
    </div>
  );
}