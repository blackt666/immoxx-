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
    <section className="wf-section relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--wf-neutral-primary)' }}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {heroContent.backgroundImage?.endsWith('.mp4') ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-20"
            onLoadedData={handleVideoLoad}
          >
            <source src={heroContent.backgroundImage} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url('${heroContent.backgroundImage || '/uploads/hero-bodensee-sunset.jpg'}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
      </div>

      {/* Content - Webflow Style */}
      <div className="wf-container relative z-10 text-center">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in py-20">
          {/* Location Badge */}
          <div className="inline-flex items-center space-x-2 bg-webflow-neutral-secondary rounded-full px-6 py-3 text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 text-webflow-accent-primary" />
            <span style={{ color: 'var(--wf-neutral-inverse)' }}>Friedrichshafen • Bodensee-Region</span>
          </div>

          {/* Main Heading - Webflow Typography */}
          <h1 className="font-manrope font-bold text-webflow-neutral-inverse" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
            {heroContent.title}
          </h1>

          {/* Subheading */}
          <p className="wf-subheading max-w-3xl mx-auto mb-8" style={{ fontSize: '1.25rem', lineHeight: '1.6', color: 'rgba(0, 0, 31, 0.7)' }}>
            {heroContent.subtitle}
          </p>

          {/* CTA Buttons - Webflow Style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={scrollToValuation}
              className="wf-button group"
              data-testid="button-hero-ai-valuation"
            >
              <Bot className="mr-2 w-5 h-5" />
              {heroContent.ctaText}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={scrollToContact}
              className="wf-button is-secondary"
              data-testid="button-hero-contact"
            >
              <Phone className="mr-2 w-4 h-4" />
              {t('hero.call')}
            </button>
          </div>

          {/* Stats Grid - Webflow Style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--wf-accent-primary)' }}>3k+</div>
              <div className="text-sm" style={{ color: 'rgba(0, 0, 31, 0.6)' }}>
                {language === 'de' ? 'Zufriedene Kunden' : 'Satisfied Customers'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--wf-accent-primary)' }}>80+</div>
              <div className="text-sm" style={{ color: 'rgba(0, 0, 31, 0.6)' }}>
                {language === 'de' ? 'Verkaufte Immobilien' : 'Properties Sold'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--wf-accent-primary)' }}>98%</div>
              <div className="text-sm" style={{ color: 'rgba(0, 0, 31, 0.6)' }}>{t('stats.success')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--wf-accent-primary)' }}>10+</div>
              <div className="text-sm" style={{ color: 'rgba(0, 0, 31, 0.6)' }}>
                {language === 'de' ? 'Jahre Erfahrung' : 'Years Experience'}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <a href="tel:+4975413716448" className="flex items-center gap-2 text-webflow-neutral-inverse hover:text-webflow-accent-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span>+49-7541-371648</span>
            </a>
            <a href="mailto:mueller@bimm-fn.de" className="flex items-center gap-2 text-webflow-neutral-inverse hover:text-webflow-accent-primary transition-colors">
              <Mail className="w-4 h-4" />
              <span>mueller@bimm-fn.de</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 rounded-full flex justify-center" style={{ borderColor: 'rgba(0, 0, 31, 0.2)' }}>
          <div className="w-1 h-3 rounded-full mt-2 animate-bounce" style={{ backgroundColor: 'var(--wf-accent-primary)' }}></div>
        </div>
      </div>
    </section>
  );
}