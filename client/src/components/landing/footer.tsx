import { Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const quickLinks = [
    { name: t('nav.home'), href: "#home" },
    { name: t('services.title'), href: "#services" },
    { name: t('nav.properties'), href: "#properties" },
    { name: t('nav.about'), href: "#about" },
    { name: t('nav.contact'), href: "#contact" },
  ];

  const legalLinks = [
    { name: t('footer.links.imprint'), href: "/impressum" },
    { name: t('footer.links.privacy'), href: "/datenschutz" },
    { name: t('footer.links.terms'), href: "/agb" },
    { name: t('footer.links.withdrawal'), href: "/widerruf" },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="wf-section is-inverse">
      <div className="wf-container">
        <div className="wf-grid-3 gap-12">
          {/* Company Info */}
          <div>
            <div className="mb-6">
              <button
                onClick={() => scrollToSection("#home")}
                className="block text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--wf-accent-primary)' }}>
                    <svg width="24" height="24" viewBox="0 0 33 33" fill="currentColor" style={{ color: 'var(--wf-text-on-accent)' }}>
                      <path d="M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-lg" style={{ color: 'var(--wf-neutral-primary)' }}>
                      Müller Immobilien
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Bodensee
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Ihr vertrauensvoller Partner für Immobilien am Bodensee. Seit über
              20 Jahren verbinden wir Menschen mit ihren Traumimmobilien.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" style={{ color: 'var(--wf-accent-primary)' }} />
                <a
                  href="tel:+4975413716448"
                  className="hover:text-webflow-accent-primary transition-colors"
                  style={{ color: 'var(--wf-neutral-primary)' }}
                >
                  +49-7541-371648
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" style={{ color: 'var(--wf-accent-primary)' }} />
                <a
                  href="mailto:mueller@bimm-fn.de"
                  className="hover:text-webflow-accent-primary transition-colors"
                  style={{ color: 'var(--wf-neutral-primary)' }}
                >
                  mueller@bimm-fn.de
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1" style={{ color: 'var(--wf-accent-primary)' }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <p>Seewiesenstraße 31/6</p>
                  <p className="text-sm">88046 Friedrichshafen</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--wf-neutral-primary)' }}>Navigation</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="hover:text-webflow-accent-primary transition-colors text-left"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links & Hours */}
          <div>
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--wf-neutral-primary)' }}>Rechtliches</h3>
            <ul className="space-y-2 text-sm mb-8">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-webflow-accent-primary transition-colors"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Business Hours */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--wf-neutral-primary)' }}>Öffnungszeiten</h4>
              <div className="text-xs space-y-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <p>Montag - Freitag: 9:00 - 18:00</p>
                <p>Samstag: 10:00 - 14:00</p>
                <p>Sonntag: Geschlossen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              © {currentYear} Bodensee Immobilien Müller. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--wf-accent-primary)' }}></div>
              <span>24h Antwortzeit garantiert</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
