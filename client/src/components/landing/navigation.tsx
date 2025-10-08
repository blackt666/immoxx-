import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Bot, User, Calendar, Zap } from "lucide-react";
import { Link } from "wouter";
// Logo temporarily removed - using text logo instead
// import logoPath from "@assets/logo-mueller-immobilien-bodensee_1757809230389.png";
import LanguageSelector from "./language-selector";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Organize navigation into logical groups
  const mainNavItems = [
    { name: t('nav.home'), href: "#home" },
    { name: t('nav.properties'), href: "#properties" },
    { name: t('nav.about'), href: "#about" },
    { name: t('services.title', 'Leistungen'), href: "#services" },
  ];

  const aiServiceItems = [
    {
      name: t('nav.ai.valuation', 'AI-Bewertung'),
      href: "/ai-valuation",
      external: true,
      isAI: true,
      icon: Bot,
      description: t('nav.ai.subtitle', 'Automatisiert • Kostenlos • Sofort')
    },
  ];

  const humanServiceItems = [
    {
      name: t('nav.human.consultation', 'Beratungstermin'),
      href: "#contact",
      isHuman: true,
      icon: User,
      description: t('nav.human.subtitle', 'Individuelle Beratung • Terminvereinbarung')
    },
    {
      name: t('nav.human.contact', 'Kontakt'),
      href: "#contact",
      isHuman: true,
      icon: Phone,
      description: t('nav.human.subtitle', 'Individuelle Beratung • Terminvereinbarung')
    },
  ];

  const handleNavigation = (href: string, external?: boolean) => {
    if (external) {
      window.location.href = href;
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className={`wf-nav fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      }`}>
      <div className="wf-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3"
            data-testid="link-logo"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--wf-accent-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 33 33" fill="currentColor" style={{ color: 'var(--wf-text-on-accent)' }}>
                  <path d="M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z" />
                </svg>
              </div>
              <div className="font-manrope">
                <div className="text-base font-bold" style={{ color: 'var(--wf-neutral-inverse)' }}>Immobilien am Bodensee</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {mainNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="text-sm font-medium transition-colors hover:text-webflow-accent-primary"
                style={{ color: isScrolled ? 'var(--wf-neutral-inverse)' : 'var(--wf-neutral-inverse)' }}
                data-testid={`button-nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </button>
            ))}
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigation('/ai-valuation', true)}
                className="wf-button text-sm py-2 px-4"
                data-testid="button-ai-valuation"
              >
                <Bot className="w-4 h-4 mr-2" />
                {t('nav.ai.valuation', 'AI-Bewertung')}
              </button>
              
              <button
                onClick={() => handleNavigation("#contact")}
                className="wf-button is-secondary text-sm py-2 px-4"
                data-testid="button-contact"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t('nav.human.contact', 'Kontakt')}
              </button>
            </div>
            
            {/* Language Selector */}
            <LanguageSelector isScrolled={isScrolled} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector isScrolled={isScrolled} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md transition-colors"
              style={{ color: 'var(--wf-neutral-inverse)' }}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-4 space-y-2" style={{ backgroundColor: 'var(--wf-neutral-primary)', borderTop: '1px solid rgba(0, 0, 31, 0.1)' }}>
            {mainNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors hover:bg-webflow-neutral-secondary"
                style={{ color: 'var(--wf-neutral-inverse)' }}
                data-testid={`button-mobile-nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </button>
            ))}

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleNavigation('/ai-valuation', true)}
                className="wf-button w-full justify-center"
                data-testid="button-mobile-ai-valuation"
              >
                <Bot className="w-4 h-4 mr-2" />
                {t('nav.ai.valuation', 'AI-Bewertung')}
              </button>
              
              <button
                onClick={() => handleNavigation("#contact")}
                className="wf-button is-secondary w-full justify-center"
                data-testid="button-mobile-contact"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t('nav.human.contact', 'Kontakt')}
              </button>
            </div>

            {/* Contact Info in Mobile Menu */}
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'rgba(0, 0, 31, 0.1)' }}>
              <a
                href="tel:+4975413716448"
                className="flex items-center gap-2 px-4 py-2 text-sm"
                style={{ color: 'var(--wf-neutral-inverse)' }}
              >
                <Phone className="w-4 h-4" />
                +49-7541-371648
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <Zap className="w-3 h-3 text-yellow-300 opacity-80" />
                        <span className="text-xs text-white/90">Sofort verfügbar</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Human Services Section */}
            <div className="pt-3 border-t border-gray-200">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4" />
                  <span>{t('nav.human.title', 'Persönliche Beratung')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('nav.human.subtitle', 'Individuelle Beratung • Terminvereinbarung')}</p>
              </div>
              {humanServiceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center space-x-3 w-full px-3 py-3 text-left border border-gray-200 rounded-lg mx-3 mb-2 hover:bg-gray-50"
                    data-testid={`button-mobile-human-${item.href.replace('#', '')}`}
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Terminvereinbarung</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Contact Info & Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 px-3 text-sm text-gray-600 mb-3">
                <Phone className="w-4 h-4" />
                <a href="tel:+491608066630" className="hover:text-[var(--arctic-blue)] hover:underline">
                  +49 160 8066630
                </a>
              </div>
              <div className="mt-2 mx-3">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}