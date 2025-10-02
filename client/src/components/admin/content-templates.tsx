import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Home, 
  Star, 
  Mail, 
  Phone,
  MapPin,
  Copy,
  Eye
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  content: {
    hero?: any;
    about?: any;
    contact?: any;
  };
  preview: string;
  downloadContent: any; // Actual content structure for download
}

// Generate consistent preview from download content
const generatePreviewFromDownload = (downloadContent: any): string => {
  let preview = '';

  if (downloadContent.hero) {
    preview += `**Hero-Bereich:**\n${downloadContent.hero.title || 'Titel hier...'}\n${downloadContent.hero.subtitle || 'Untertitel hier...'}\n\n`;
  }

  if (downloadContent.about) {
    preview += `**Über uns:**\n${downloadContent.about.title || 'Über uns Titel'}\n${downloadContent.about.description || 'Beschreibung hier...'}\n\n`;
  }

  if (downloadContent.contact) {
    preview += `**Kontakt:**\n${downloadContent.contact.title || 'Kontakt Titel'}\n${downloadContent.contact.address || 'Adresse hier...'}\n`;
  }

  return preview.trim();
};

interface ContentTemplatesProps {
  onTemplateSelect: (template: Template) => void;
}

export default function ContentTemplates({ onTemplateSelect }: ContentTemplatesProps) {
  const templates: Template[] = [
    {
      id: 'modern-minimal',
      name: 'Modern & Minimal',
      category: 'hero',
      description: 'Moderne, minimalistische Gestaltung für gehobene Immobilien',
      content: {
        hero: {
          title: 'Exklusiv • Modern • Bodensee',
          subtitle: 'Wir verwirklichen Ihren Traum vom perfekten Zuhause am Bodensee. Mit Leidenschaft, Expertise und einem Netzwerk, das keine Wünsche offen lässt.',
          ctaText: 'Traumimmobilie finden',
          backgroundImage: '/uploads/hero-bodensee-sunset.jpg'
        }
      },
      preview: 'Elegantes Design mit Fokus auf Qualität und Exklusivität',
      downloadContent: {
        hero: {
          title: 'Exklusiv • Modern • Bodensee',
          subtitle: 'Wir verwirklichen Ihren Traum vom perfekten Zuhause am Bodensee. Mit Leidenschaft, Expertise und einem Netzwerk, das keine Wünsche offen lässt.',
          ctaText: 'Traumimmobilie finden',
          backgroundImage: '/uploads/hero-bodensee-sunset.jpg'
        }
      }
    },
    {
      id: 'family-friendly',
      name: 'Familienfreundlich',
      category: 'hero',
      description: 'Warme, einladende Gestaltung für Familien',
      content: {
        hero: {
          title: 'Ihr Familienglück am Bodensee',
          subtitle: 'Finden Sie das perfekte Zuhause für Ihre Familie. Wir begleiten Sie persönlich zu Ihrem Traumhaus mit Garten, guten Schulen und kurzen Wegen zum See.',
          ctaText: 'Familientraum verwirklichen',
          backgroundImage: '/uploads/hero-video.mp4'
        }
      },
      preview: 'Herzlich und vertrauensvoll, ideal für Familien',
      downloadContent: {
        hero: {
          title: 'Ihr Familienglück am Bodensee',
          subtitle: 'Finden Sie das perfekte Zuhause für Ihre Familie. Wir begleiten Sie persönlich zu Ihrem Traumhaus mit Garten, guten Schulen und kurzen Wegen zum See.',
          ctaText: 'Familientraum verwirklichen',
          backgroundImage: '/uploads/hero-video.mp4'
        }
      }
    },
    {
      id: 'luxury-premium',
      name: 'Luxus & Premium',
      category: 'hero',
      description: 'Exklusive Gestaltung für Luxusimmobilien',
      content: {
        hero: {
          title: 'Luxus. Exklusivität. Bodensee.',
          subtitle: 'Erleben Sie Immobilien der Extraklasse. Von der Villa mit Seeblick bis zum Penthouse - wir öffnen Ihnen die Türen zu den exklusivsten Adressen der Region.',
          ctaText: 'Exklusivität entdecken',
          backgroundImage: '/uploads/villa-bodensee-1.jpg'
        }
      },
      preview: 'Hochwertig und exklusiv für anspruchsvolle Klientel',
      downloadContent: {
        hero: {
          title: 'Luxus. Exklusivität. Bodensee.',
          subtitle: 'Erleben Sie Immobilien der Extraklasse. Von der Villa mit Seeblick bis zum Penthouse - wir öffnen Ihnen die Türen zu den exklusivsten Adressen der Region.',
          ctaText: 'Exklusivität entdecken',
          backgroundImage: '/uploads/villa-bodensee-1.jpg'
        }
      }
    },
    {
      id: 'professional-expertise',
      name: 'Professionelle Expertise',
      category: 'about',
      description: 'Fokus auf Fachwissen und Marktkenntnis',
      content: {
        about: {
          description: 'Mit über zwei Jahrzehnten Markterfahrung und einem tiefen Verständnis für die Bodensee-Region bin ich Ihr verlässlicher Partner in allen Immobilienfragen. Meine Expertise umfasst die gesamte Bandbreite: von der Marktanalyse über die Bewertung bis hin zur erfolgreichen Vermarktung.',
          experience: '25',
          sales: '350'
        }
      },
      preview: 'Betonung der Expertise und Marktkenntnisse',
      downloadContent: {
        about: {
          title: 'Über Uns',
          description: 'Mit über zwei Jahrzehnten Markterfahrung und einem tiefen Verständnis für die Bodensee-Region bin ich Ihr verlässlicher Partner in allen Immobilienfragen. Meine Expertise umfasst die gesamte Bandbreite: von der Marktanalyse über die Bewertung bis hin zur erfolgreichen Vermarktung.',
          experience: '25',
          sales: '350'
        }
      }
    },
    {
      id: 'personal-service',
      name: 'Persönlicher Service',
      category: 'about',
      description: 'Fokus auf individuelle Betreuung',
      content: {
        about: {
          description: 'Jeder Kunde ist einzigartig - genau wie seine Immobilienwünsche. Deshalb nehme ich mir die Zeit, Sie und Ihre Vorstellungen kennenzulernen. Gemeinsam entwickeln wir eine maßgeschneiderte Strategie, die zu Ihnen und Ihrem Budget passt.',
          experience: '20',
          sales: '280'
        }
      },
      preview: 'Persönliche Betreuung und individuelle Lösungen',
      downloadContent: {
        about: {
          title: 'Persönlicher Service',
          description: 'Jeder Kunde ist einzigartig - genau wie seine Immobilienwünsche. Deshalb nehme ich mir die Zeit, Sie und Ihre Vorstellungen kennenzulernen. Gemeinsam entwickeln wir eine maßgeschneiderte Strategie, die zu Ihnen und Ihrem Budget passt.',
          experience: '20',
          sales: '280'
        }
      }
    },
    {
      id: 'contact-modern',
      name: 'Modern & Direkt',
      category: 'contact',
      description: 'Moderne Kontaktmöglichkeiten',
      content: {
        contact: {
          phone: '07541 / 371648',
          mobile: '0160 / 8066630',
          email: 'mueller@bimm-fn.de',
          address: 'Seewiesenstraße 31/6, 88046 Friedrichshafen',
          hours: 'Mo-Fr 8-19h, Sa 9-16h, So nach Vereinbarung'
        }
      },
      preview: 'Erweiterte Öffnungszeiten und flexible Erreichbarkeit',
      downloadContent: {
        contact: {
          title: 'Kontakt',
          phone: '07541 / 371648',
          mobile: '0160 / 8066630',
          email: 'mueller@bimm-fn.de',
          address: 'Seewiesenstraße 31/6, 88046 Friedrichshafen',
          hours: 'Mo-Fr 8-19h, Sa 9-16h, So nach Vereinbarung'
        }
      }
    }
  ];

  const categories = [
    { key: 'hero', label: 'Hero-Bereiche', icon: Home },
    { key: 'about', label: 'Über Uns', icon: Star },
    { key: 'contact', label: 'Kontakt', icon: Phone }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Content-Vorlagen</h3>
          <p className="text-sm text-gray-600">
            Wählen Sie eine Vorlage und übernehmen Sie sie per Klick
          </p>
        </div>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {categories.map(category => (
            <TabsTrigger key={category.key} value={category.key}>
              <category.icon className="w-4 h-4 mr-2" />
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.key} value={category.key}>
            <div className="grid gap-4 md:grid-cols-2">
              {templates
                .filter(template => template.category === category.key)
                .map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-2">Vorschau:</p>
                        <p className="text-sm text-gray-800">{generatePreviewFromDownload(template.downloadContent)}</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => onTemplateSelect(template)}
                          className="flex-1 bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Übernehmen
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}