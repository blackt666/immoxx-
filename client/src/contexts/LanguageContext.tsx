import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'de' | 'en';
  setLanguage: (lang: 'de' | 'en') => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  de: {
    // Navigation
    'nav.home': 'Home',
    'nav.properties': 'Immobilien', 
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.valuation': 'AI-Bewertung',
    'nav.calculator': 'Finanzrechner',
    'nav.calculator.short': 'Rechner',
    'nav.ai.title': 'Sofort-Services',
    'nav.ai.subtitle': 'Automatisiert • Kostenlos • Sofort',
    'nav.human.title': 'Persönliche Beratung',
    'nav.human.subtitle': 'Individuelle Beratung • Terminvereinbarung',
    'nav.ai.valuation': 'Kostenlose AI-Bewertung',
    'nav.ai.calculator': 'Finanzrechner',
    'nav.human.consultation': 'Beratungstermin',
    'nav.human.contact': 'Kontakt',
    
    // Hero Section
    'hero.title': 'Ihr Immobilienexperte am Bodensee',
    'hero.subtitle': 'Mit über 20 Jahren Erfahrung begleiten wir Sie professionell beim Kauf und Verkauf Ihrer Traumimmobilie am Bodensee.',
    'hero.cta': 'Kostenlose Bewertung',
    'hero.cta.secondary': 'Immobilien ansehen',
    
    // Stats Section
    'stats.experience': 'Jahre Erfahrung',
    'stats.sales': 'Verkaufte Immobilien',
    'stats.customers': 'Zufriedene Kunden',
    'stats.locations': 'Standorte',
    'stats.success': 'Erfolgsquote',
    'stats.sold': 'Verkaufte Immobilien',
    'stats.satisfied': 'Zufriedene Kunden',
    'stats.years': 'Jahre Erfahrung',
    
    // Hero Buttons
    'hero.call': 'Jetzt anrufen',
    'hero.view_properties': 'Immobilien ansehen',
    
    // Services
    'services.title': 'Unsere Leistungen',
    'services.subtitle': 'Professionelle Immobiliendienstleistungen für die Bodenseeregion – von der Bewertung bis zum erfolgreichen Abschluss',
    'services.valuation.title': 'Immobilienbewertung',
    'services.valuation.description': 'Professionelle Bewertung Ihrer Immobilie basierend auf aktuellen Marktdaten und langjähriger Erfahrung.',
    'services.selling.title': 'Immobilienverkauf',
    'services.selling.description': 'Erfolgreicher Verkauf Ihrer Immobilie durch strategisches Marketing und professionelle Verhandlungsführung.',
    'services.search.title': 'Immobiliensuche',
    'services.search.description': 'Individuelle Suche nach Ihrer Traumimmobilie basierend auf Ihren spezifischen Wünschen und Anforderungen.',
    'services.consultation.title': 'Persönliche Beratung',
    'services.consultation.description': 'Umfassende Beratung zu allen Aspekten des Immobilienkaufs und -verkaufs mit persönlichem Service.',
    'services.analysis.title': 'Marktanalyse',
    'services.analysis.description': 'Detaillierte Analyse des lokalen Immobilienmarkts mit Trends und Prognosen für die Bodenseeregion.',
    'services.support.title': 'Nachbetreuung',
    'services.support.description': 'Kontinuierliche Betreuung auch nach dem Kauf oder Verkauf für langfristige Kundenzufriedenheit.',
    'services.forms.title': 'Formulare & Lizenzierung',
    'services.forms.description': 'Professionelle Abwicklung aller notwendigen Formulare und lizenzierte Beratung auch bei Baukäufen und per E-Mail-Support.',
    
    // About Section
    'about.title': 'Über Müller Immobilien',
    'about.description': 'Als zertifizierter Immobilienmakler mit über 20 Jahren Erfahrung am Bodensee kenne ich den lokalen Markt wie kein anderer.',
    'about.cta': 'Mehr über uns',
    'about.badge': 'Ihr persönlicher Makler',
    'about.name': 'Manfred Müller',
    'about.subtitle': 'Immobilienexperte für die Bodensee-Region',
    'about.experience': 'Jahre Erfahrung',
    'about.contact.title': 'Direkter Kontakt',
    'about.contact.appointment': 'Termin vereinbaren',
    'about.intro': 'Mit über <strong>20 Jahren Erfahrung</strong> in der Immobilienbranche am Bodensee begleite ich Sie persönlich durch alle Phasen Ihres Immobiliengeschäfts.',
    'about.support': 'Von der ersten Beratung bis zum erfolgreichen Abschluss - bei mir erhalten Sie kompetente Unterstützung, die auf langjähriger Marktkenntnis und einem starken Netzwerk in der Region basiert.',
    'about.stats.customers': 'Zufriedene Kunden',
    'about.stats.success': 'Erfolgsquote',
    'about.stats.sold': 'Verkaufte Objekte',
    'about.qualifications.title': 'Qualifikationen & Zertifizierungen',
    'about.qualifications.broker': 'Geprüfter Immobilienmakler',
    'about.qualifications.ihk': 'IHK Sachkundeprüfung',
    'about.qualifications.valuation': 'Immobilienbewertung',
    'about.qualifications.specialist': 'Bodensee-Spezialist',
    'about.hours.title': 'Öffnungszeiten',
    'about.hours.weekdays': 'Montag - Freitag:',
    'about.hours.saturday': 'Samstag:',
    'about.hours.sunday': 'Sonntag:',
    'about.hours.weekdays.value': '09:00 - 18:00 Uhr',
    'about.hours.saturday.value': '10:00 - 14:00 Uhr',
    'about.hours.sunday.value': 'Nach Vereinbarung',
    
    // Contact Section
    'contact.title': 'Persönliche Beratung anfragen',
    'contact.subtitle': 'Möchten Sie eine individuelle Beratung oder haben Fragen zu unseren Leistungen? Vereinbaren Sie einen persönlichen Termin mit unserem Experten!',
    'contact.form.title': 'Beratungsanfrage senden',
    'contact.human.title': 'Persönliche Beratung',
    'contact.human.subtitle': 'Individuelle Betreuung • Terminvereinbarung • Vor-Ort-Service',
    'contact.ai.title': 'AI-Bewertung besprechen',
    'contact.ai.subtitle': 'Fragen zur AI-Bewertung • Weitere Details • Folgeberatung',
    'contact.form.consultation.placeholder': 'Beschreiben Sie Ihr Anliegen oder gewünschte Leistungen...',
    'contact.form.name': 'Name *',
    'contact.form.email': 'E-Mail *',
    'contact.form.subject': 'Betreff *',
    'contact.form.message': 'Nachricht *',
    'contact.form.name.placeholder': 'Ihr Name',
    'contact.form.email.placeholder': 'ihre@email.de',
    'contact.form.subject.placeholder': 'Worum geht es?',
    'contact.form.message.placeholder': 'Ihre Nachricht...',
    'contact.form.submit': 'Nachricht senden',
    'contact.form.sending': 'Wird gesendet...',
    'contact.info.phone': 'Telefon',
    'contact.info.email': 'E-Mail',
    'contact.info.address': 'Adresse',
    'contact.info.hours': 'Öffnungszeiten',
    'contact.info.hours.weekdays': 'Mo-Fr: 9:00 - 18:00 Uhr',
    'contact.info.hours.saturday': 'Sa: 10:00 - 14:00 Uhr',
    'contact.toast.missing.title': 'Fehlende Angaben',
    'contact.toast.missing.description': 'Bitte füllen Sie alle Felder aus.',
    'contact.toast.success.title': 'Nachricht gesendet!',
    'contact.toast.success.description': 'Vielen Dank für Ihre Nachricht. Wir melden uns bald bei Ihnen.',
    'contact.toast.error.title': 'Fehler',
    'contact.toast.error.description': 'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
    
    // Footer
    'footer.company': 'Müller Immobilien',
    'footer.description': 'Ihr vertrauensvoller Partner für Immobilien am Bodensee',
    'footer.links.imprint': 'Impressum',
    'footer.links.privacy': 'Datenschutz',
    'footer.links.terms': 'AGB',
    'footer.social': 'Folgen Sie uns',
    
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.view': 'Ansehen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Zurück',
    'common.close': 'Schließen',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.properties': 'Properties',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.valuation': 'AI Valuation',
    'nav.calculator': 'Financial Calculator',
    'nav.calculator.short': 'Calculator',
    'nav.ai.title': 'Instant Services',
    'nav.ai.subtitle': 'Automated • Free • Instant',
    'nav.human.title': 'Personal Consultation',
    'nav.human.subtitle': 'Individual Advice • Appointment Booking',
    'nav.ai.valuation': 'Free AI Valuation',
    'nav.ai.calculator': 'Financial Calculator',
    'nav.human.consultation': 'Consultation',
    'nav.human.contact': 'Contact',
    
    // Hero Section
    'hero.title': 'Your Real Estate Expert at Lake Constance',
    'hero.subtitle': 'With over 20 years of experience, we professionally guide you through buying and selling your dream property at Lake Constance.',
    'hero.cta': 'Free Valuation',
    'hero.cta.secondary': 'View Properties',
    
    // Stats Section
    'stats.experience': 'Years Experience',
    'stats.sales': 'Properties Sold',
    'stats.customers': 'Satisfied Customers',
    'stats.locations': 'Locations',
    'stats.success': 'Success Rate',
    'stats.sold': 'Properties Sold',
    'stats.satisfied': 'Satisfied Customers',
    'stats.years': 'Years Experience',
    
    // Hero Buttons
    'hero.call': 'Call Now',
    'hero.view_properties': 'View Properties',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Professional real estate services for the Lake Constance region – from valuation to successful completion',
    'services.valuation.title': 'Property Valuation',
    'services.valuation.description': 'Professional valuation of your property based on current market data and years of experience.',
    'services.selling.title': 'Property Sale',
    'services.selling.description': 'Successful sale of your property through strategic marketing and professional negotiation.',
    'services.search.title': 'Property Search',
    'services.search.description': 'Individual search for your dream property based on your specific wishes and requirements.',
    'services.consultation.title': 'Personal Consultation',
    'services.consultation.description': 'Comprehensive advice on all aspects of real estate buying and selling with personal service.',
    'services.analysis.title': 'Market Analysis',
    'services.analysis.description': 'Detailed analysis of the local real estate market with trends and forecasts for the Lake Constance region.',
    'services.support.title': 'After-sales Support',
    'services.support.description': 'Continuous support even after purchase or sale for long-term customer satisfaction.',
    'services.forms.title': 'Forms & Licensing',
    'services.forms.description': 'Professional handling of all necessary forms and licensed advice also for construction purchases and via email support.',
    
    // About Section
    'about.title': 'About Müller Real Estate',
    'about.description': 'As a certified real estate agent with over 20 years of experience at Lake Constance, I know the local market like no other.',
    'about.cta': 'Learn More About Us',
    'about.badge': 'Your Personal Agent',
    'about.name': 'Manfred Müller',
    'about.subtitle': 'Real Estate Expert for the Lake Constance Region',
    'about.experience': 'Years Experience',
    'about.contact.title': 'Direct Contact',
    'about.contact.appointment': 'Schedule Appointment',
    'about.intro': 'With over <strong>20 years of experience</strong> in the real estate industry at Lake Constance, I personally guide you through all phases of your real estate transaction.',
    'about.support': 'From the first consultation to the successful completion - with me you receive competent support based on years of market knowledge and a strong network in the region.',
    'about.stats.customers': 'Satisfied Customers',
    'about.stats.success': 'Success Rate',
    'about.stats.sold': 'Properties Sold',
    'about.qualifications.title': 'Qualifications & Certifications',
    'about.qualifications.broker': 'Certified Real Estate Agent',
    'about.qualifications.ihk': 'IHK Professional Examination',
    'about.qualifications.valuation': 'Property Valuation',
    'about.qualifications.specialist': 'Lake Constance Specialist',
    'about.hours.title': 'Opening Hours',
    'about.hours.weekdays': 'Monday - Friday:',
    'about.hours.saturday': 'Saturday:',
    'about.hours.sunday': 'Sunday:',
    'about.hours.weekdays.value': '9:00 AM - 6:00 PM',
    'about.hours.saturday.value': '10:00 AM - 2:00 PM',
    'about.hours.sunday.value': 'By appointment',
    
    // Contact Section
    'contact.title': 'Request Personal Consultation',
    'contact.subtitle': 'Would you like individual advice or have questions about our services? Schedule a personal appointment with our expert!',
    'contact.form.title': 'Send Consultation Request',
    'contact.human.title': 'Personal Consultation',
    'contact.human.subtitle': 'Individual Support • Appointment Booking • On-Site Service',
    'contact.ai.title': 'Discuss AI Valuation',
    'contact.ai.subtitle': 'AI Valuation Questions • Additional Details • Follow-up Consultation',
    'contact.form.consultation.placeholder': 'Describe your request or desired services...',
    'contact.form.name': 'Name *',
    'contact.form.email': 'Email *',
    'contact.form.subject': 'Subject *',
    'contact.form.message': 'Message *',
    'contact.form.name.placeholder': 'Your Name',
    'contact.form.email.placeholder': 'your@email.com',
    'contact.form.subject.placeholder': 'What is it about?',
    'contact.form.message.placeholder': 'Your message...',
    'contact.form.submit': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.info.phone': 'Phone',
    'contact.info.email': 'Email',
    'contact.info.address': 'Address',
    'contact.info.hours': 'Opening Hours',
    'contact.info.hours.weekdays': 'Mon-Fri: 9:00 AM - 6:00 PM',
    'contact.info.hours.saturday': 'Sat: 10:00 AM - 2:00 PM',
    'contact.toast.missing.title': 'Missing Information',
    'contact.toast.missing.description': 'Please fill in all fields.',
    'contact.toast.success.title': 'Message Sent!',
    'contact.toast.success.description': 'Thank you for your message. We will get back to you soon.',
    'contact.toast.error.title': 'Error',
    'contact.toast.error.description': 'Your message could not be sent. Please try again.',
    
    // Footer
    'footer.company': 'Müller Real Estate',
    'footer.description': 'Your trusted partner for real estate at Lake Constance',
    'footer.links.imprint': 'Imprint',
    'footer.links.privacy': 'Privacy Policy',
    'footer.links.terms': 'Terms & Conditions',
    'footer.links.withdrawal': 'Right of Withdrawal',
    'footer.social': 'Follow Us',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'de' | 'en'>(() => {
    // Check localStorage first, fallback to browser language, then to 'de'
    const saved = localStorage.getItem('preferred-language') as 'de' | 'en';
    if (saved && (saved === 'de' || saved === 'en')) return saved;
    
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) return 'en';
    return 'de';
  });

  const setLanguageAndSave = (lang: 'de' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return (translations[language] as any)[key] || fallback || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageAndSave, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}