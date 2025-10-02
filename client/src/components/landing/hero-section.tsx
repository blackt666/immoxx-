import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, MapPin, Phone, Mail, Bot, Zap, Clock, Calculator, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
  backgroundImage: string;
}

export default function HeroSection() {
  const { t, language } = useLanguage();

  // Use React Query for site content
  const { data: siteContent } = useQuery({
    queryKey: ["/api/site-content"],
    queryFn: async () => {
      const response = await fetch('/api/site-content', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract hero background image from site content
  const heroSection = siteContent?.find((section: any) => section.section === 'hero');
  const backgroundImage = heroSection?.content?.backgroundImage || "/uploads/hero-bodensee-sunset.jpg";

  // Content is always from translations, not API
  const heroContent = {
    title: t('hero.title'),
    subtitle: t('hero.subtitle'),
    ctaText: t('hero.cta'),
    backgroundImage
  };

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent multiple video loads
    if (videoRef.current && heroContent?.backgroundImage?.endsWith('.mp4')) {
      videoRef.current.load();
    }
  }, [heroContent?.backgroundImage]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    console.log("Video data loaded");
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToValuation = () => {
    window.location.href = '/ai-valuation';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-[var(--ruskin-blue)] via-[var(--arctic-blue)] to-blue-600">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {heroContent.backgroundImage?.endsWith('.mp4') ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-30"
            onLoadedData={handleVideoLoad}
            onCanPlay={() => console.log("Video can play")}
          >
            <source src={heroContent.backgroundImage} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center opacity-30 hero-background"
            data-bg-url={heroContent.backgroundImage || '/uploads/hero-bodensee-sunset.jpg'}
          />
        )}
        <div className="absolute inset-0 z-10 hero-gradient" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-bodensee-bermuda-sand">
        <div className="space-y-8 animate-fade-in">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mt-16 sm:mt-8 text-bodensee-bermuda-sand">
            <span className="block mb-2 text-bodensee-bermuda-sand">{heroContent.title}</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal mt-4 text-bodensee-bermuda-sand">
              Manfred Müller
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed text-bodensee-bermuda-sand">
            {heroContent.subtitle}
          </p>

          {/* Company Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-white">
            <MapPin className="w-4 h-4 text-bodensee-sublime" />
            <span className="text-bodensee-sublime">Friedrichshafen • Bodensee-Region</span>
          </div>

          {/* Stats Row - Mobile Responsive */}
          <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:items-center sm:gap-0 sm:space-x-8 lg:space-x-12 py-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bodensee-bermuda-sand">3k+</div>
              <div className="text-xs sm:text-sm text-bodensee-bermuda-sand">
                {language === 'de' ? (
                  <>Zufriedene<br className="sm:hidden" /> Kunden</>
                ) : (
                  <>Satisfied<br className="sm:hidden" /> Customers</>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bodensee-bermuda-sand">80+</div>
              <div className="text-xs sm:text-sm text-bodensee-bermuda-sand">
                {language === 'de' ? (
                  <>Verkaufte<br className="sm:hidden" /> Immobilien</>
                ) : (
                  <>Properties<br className="sm:hidden" /> Sold</>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bodensee-bermuda-sand">98%</div>
              <div className="text-xs sm:text-sm text-bodensee-bermuda-sand">{t('stats.success')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bodensee-bermuda-sand">10+</div>
              <div className="text-xs sm:text-sm text-bodensee-bermuda-sand">
                {language === 'de' ? (
                  <>Jahre<br className="sm:hidden" /> Erfahrung</>
                ) : (
                  <>Years<br className="sm:hidden" /> Experience</>
                )}
              </div>
            </div>
          </div>

          {/* AI Services Highlight */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-white/20">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Bot className="w-6 h-6 text-yellow-400" />
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-white">KI-SOFORT-SERVICES</span>
              <Zap className="w-5 h-5 text-yellow-400" />
              <Bot className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-center text-white/90 mb-6">
              Revolutionäre KI-Technologie für sofortige Immobilienbewertung • Kostenlos • Präzise • Rund um die Uhr
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-[#566873]/20 to-[#65858C]/20 rounded-lg p-3 border border-white/20">
                <Calculator className="w-5 h-5 text-[#65858C]" />
                <div>
                  <div className="font-semibold text-white text-sm">Finanzrechner</div>
                  <div className="text-xs text-white/80">Sofort verfügbar</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-[#566873]/20 to-[#65858C]/20 rounded-lg p-3 border border-white/20">
                <Bot className="w-5 h-5 text-[#65858C]" />
                <div>
                  <div className="font-semibold text-white text-sm">AI-Bewertung</div>
                  <div className="text-xs text-white/80">In 30 Sekunden</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Enhanced with Service Distinction */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 px-4">
            {/* AI Service - Primary CTA */}
            <Button
              size="lg"
              className="w-full sm:w-auto text-white px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2"
              style={{
                backgroundColor: '#65858C',
                borderColor: '#566873'
              }}
              onClick={scrollToValuation}
              data-testid="button-hero-ai-valuation"
            >
              <Bot className="mr-2 w-5 h-5" />
              🤖 {heroContent.ctaText}
              <Zap className="ml-2 w-4 h-4" style={{color: '#D9CDBF'}} />
            </Button>

            {/* Calculator - Secondary AI Service */}
            <Button
              onClick={() => {
                const calculatorSection = document.getElementById("calculator");
                if (calculatorSection) {
                  calculatorSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-2 border-green-400/50 text-white hover:bg-green-400/20 font-semibold px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg rounded-full backdrop-blur-sm bg-white/10"
              data-testid="button-hero-calculator"
            >
              <Calculator className="mr-2 w-5 h-5 text-green-400" />
              📊 Finanzrechner
            </Button>

            {/* Human Contact - Tertiary */}
            <Button
              onClick={scrollToContact}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/50 text-white hover:bg-white hover:text-[var(--ruskin-blue)] font-medium px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-full backdrop-blur-sm bg-white/10"
              data-testid="button-hero-contact"
            >
              <Phone className="mr-2 w-4 h-4" />
              👤 {t('hero.call')}
            </Button>
          </div>

          {/* Service Distinction Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm">
            <div className="flex items-center space-x-2 bg-blue-500/20 rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">KI: Sofort verfügbar</span>
            </div>
            <div className="flex items-center space-x-2 bg-orange-500/20 rounded-full px-4 py-2">
              <Phone className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">Beratung: Terminvereinbarung</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-bodensee-bermuda-sand">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-white" />
              <span className="text-white">+49-7541-371648</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-white" />
              <span className="text-white">mueller@bimm-fn.de</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}