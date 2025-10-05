import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Bot, Calculator, User, Calendar, Zap } from "lucide-react";
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

  const allNavItems = [...mainNavItems, ...aiServiceItems, ...humanServiceItems];

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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
      style={isScrolled ? {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(217, 205, 191, 0.3)'
      } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 bg-transparent">
            <Link
              to="/"
              className="flex items-center space-x-3 bg-transparent"
              data-testid="link-logo"
            >
              <div className="h-12 flex items-center bg-transparent">
                {/* Text Logo as placeholder */}
                <div className="text-white font-bold text-lg lg:text-xl px-2">
                  Müller Immobilien
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Improved spacing */}
          <div className="hidden md:block flex-1">
            <div className="ml-6 lg:ml-10 flex items-center justify-center space-x-2 lg:space-x-3">
              {/* Main Navigation Items */}
              {mainNavItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10 whitespace-nowrap ${
                    isScrolled ? "text-gray-700 hover:text-[var(--arctic-blue)]" : "text-white"
                  }`}
                  data-testid={`button-nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </button>
              ))}

              {/* AI Services - Prominent */}
              <div className="flex items-center ml-3 lg:ml-4">
                {aiServiceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href, item.external)}
                      className="group relative bg-gradient-to-r from-[#566873] to-[#65858C] text-white px-3 lg:px-4 py-2 rounded-full hover:shadow-lg hover:scale-105 font-semibold border-2 border-white/20 transition-all duration-300 whitespace-nowrap"
                      data-testid={`button-ai-${item.href.replace('#', '').replace('/', '')}`}
                    >
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm hidden lg:inline">{item.name}</span>
                        <span className="text-xs lg:hidden">AI</span>
                        <Zap className="w-3 h-3 text-yellow-300 opacity-80" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Human Services - Subtle */}
              <div className="flex items-center ml-2">
                {humanServiceItems.slice(0, 1).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`group relative flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors border border-white/20 hover:bg-white/10 whitespace-nowrap ${
                        isScrolled ? "text-gray-700 hover:text-[var(--arctic-blue)]" : "text-white"
                      }`}
                      data-testid={`button-human-${item.href.replace('#', '')}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.name}</span>
                      <span className="lg:hidden">Kontakt</span>
                      {/* Tooltip */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side Container - Responsive Layout */}
          <div className="flex items-center">
            {/* Contact Info - Phone only */}
            <div className="hidden 2xl:flex items-center space-x-3 mr-4">
              <div className="flex items-center space-x-1 text-sm">
                <Phone className="w-4 h-4" />
                <a
                  href="tel:+491608066630"
                  className={`hover:underline ${isScrolled ? "text-gray-700" : "text-white"}`}
                >
                  +49 160 8066630
                </a>
              </div>
            </div>

            {/* Phone only on xl screens */}
            <div className="hidden xl:flex 2xl:hidden items-center space-x-1 text-sm mr-4">
              <Phone className="w-4 h-4" />
              <a
                href="tel:+491608066630"
                className={`hover:underline ${isScrolled ? "text-gray-700" : "text-white"}`}
              >
                +49 160 8066630
              </a>
            </div>

            {/* Language Selector */}
            <div className="flex items-center mr-2">
              <LanguageSelector isScrolled={isScrolled} />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-md transition-colors ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t border-gray-100">
            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-gray-700 hover:text-[var(--arctic-blue)] hover:bg-gray-50"
                data-testid={`button-mobile-nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </button>
            ))}

            {/* AI Services Section */}
            <div className="pt-3 border-t border-gray-200">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-[var(--arctic-blue)]">
                  <Zap className="w-4 h-4" />
                  <span>{t('nav.ai.title', 'Sofort-Services')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('nav.ai.subtitle', 'Automatisiert • Kostenlos • Sofort')}</p>
              </div>
              {aiServiceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href, item.external)}
                    className="flex items-center space-x-3 w-full px-3 py-3 text-left bg-gradient-to-r from-[#566873] to-[#65858C] text-white rounded-lg mx-3 mb-2 hover:opacity-90 shadow-lg transition-opacity duration-200"
                    data-testid={`button-mobile-ai-${item.href.replace('#', '').replace('/', '')}`}
                  >
                    <Icon className="w-5 h-5" />
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