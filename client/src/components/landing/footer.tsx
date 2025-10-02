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
    <footer className="bg-[var(--bodensee-deep)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <button
                onClick={() => scrollToSection("#home")}
                className="block"
              >
                <div className="text-white font-bold text-2xl mb-2 tracking-wide">
                  Müller Immobilien Bodensee
                </div>
                <div className="text-[var(--bodensee-sand)] text-sm">
                  Ihr Partner am Bodensee
                </div>
              </button>
            </div>
            <p className="text-[var(--bodensee-shore)] mb-6 leading-relaxed max-w-md">
              Ihr vertrauensvoller Partner für Immobilien am Bodensee. Seit über
              20 Jahren verbinden wir Menschen mit ihren Traumimmobilien in der
              wunderschönen Bodenseeregion.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[var(--bodensee-sand)]" />
                <div>
                  <a
                    href="tel:+491608066630"
                    className="font-medium hover:text-[var(--bodensee-sand)] hover:underline transition-colors"
                  >
                    +49 160 8066630
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[var(--bodensee-sand)]" />
                <a
                  href="mailto:mueller@bimm-fn.de"
                  className="hover:text-[var(--bodensee-sand)] hover:underline transition-colors"
                >
                  mueller@bimm-fn.de
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-[var(--bodensee-sand)]" />
                <div>
                  <p>Seewiesenstraße 31/6</p>
                  <p className="text-sm text-[var(--bodensee-shore)]">88046 Friedrichshafen</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Navigation</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-[var(--bodensee-shore)] hover:text-white transition-colors duration-300 text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Rechtliches</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-[var(--bodensee-shore)] hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Business Hours */}
            <div className="mt-8">
              <h4 className="font-semibold mb-3">Öffnungszeiten</h4>
              <div className="text-sm text-[var(--bodensee-shore)] space-y-1">
                <p>Montag - Freitag: 9:00 - 18:00</p>
                <p>Samstag: 10:00 - 14:00</p>
                <p>Sonntag: Geschlossen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-blue-400/30 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm">
              © {currentYear} Bodensee Immobilien Müller. Alle Rechte
              vorbehalten.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-blue-200">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>24h Antwortzeit garantiert</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
