import { useState } from "react";
import { X, ChevronDown, ChevronRight, Search, Building, Image, MessageSquare, Mail, Edit, Settings, Link, Activity, Target, FileText, BarChart3, Users, Calendar, Shield, Palette, Upload, Download, HelpCircle, LayoutDashboard, TrendingUp, Clock, Star, Euro, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: string) => void;
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  features: HelpFeature[];
  quickActions?: string[];
  tips?: string[];
}

interface HelpFeature {
  title: string;
  description: string;
  howTo: string[];
}

export default function DashboardHelp({ isOpen, onClose, onTabChange }: DashboardHelpProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigateToTab = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  // Comprehensive help sections for all dashboard areas
  const helpSections: HelpSection[] = [
    {
      id: "overview",
      title: "Dashboard Übersicht",
      icon: LayoutDashboard,
      description: "Ihr zentraler Ausgangspunkt mit wichtigen Kennzahlen und Schnellzugriffen.",
      features: [
        {
          title: "Statistik-Karten",
          description: "Zeigt aktuelle Immobilien, Anfragen, Verkäufe und Newsletter-Abonnenten",
          howTo: [
            "Automatische Aktualisierung alle 5 Minuten",
            "Klicken Sie auf eine Karte für Details",
            "Wachstumsprozente zeigen Monatsvergleich"
          ]
        },
        {
          title: "Schnellaktionen",
          description: "Direkte Shortcuts zu häufig verwendeten Funktionen",
          howTo: [
            "Immobilie hinzufügen - Neue Objekte schnell erstellen",
            "Bilder verwalten - Direkter Zugriff zur Galerie",
            "Newsletter senden - Neue Kampagne starten",
            "Content bearbeiten - Website-Texte anpassen"
          ]
        },
        {
          title: "Neueste Anfragen",
          description: "Überblick über die letzten Kundenanfragen",
          howTo: [
            "Status-Badges zeigen Bearbeitungsstand",
            "Klicken auf Anfrage für Details",
            "'Alle anzeigen' für vollständige Liste"
          ]
        }
      ],
      quickActions: ["Statistiken aktualisieren", "Neue Immobilie erstellen", "Anfragen bearbeiten"],
      tips: [
        "Dashboard lädt automatisch neueste Daten",
        "Nutzen Sie Schnellaktionen für effizientes Arbeiten",
        "Behalten Sie Anfragen-Status im Blick"
      ]
    },
    {
      id: "properties",
      title: "Immobilien verwalten",
      icon: Building,
      description: "Komplette Verwaltung Ihrer Immobilien-Objekte mit allen Details.",
      features: [
        {
          title: "Immobilien-Liste",
          description: "Alle Ihre Objekte in übersichtlicher Tabellenform",
          howTo: [
            "Sortierung nach Preis, Datum, Status möglich",
            "Suchfunktion für schnelles Finden",
            "Filter nach Typ, Status, Preisspanne",
            "Massenaktionen für mehrere Objekte"
          ]
        },
        {
          title: "Objekt erstellen/bearbeiten",
          description: "Detaillierte Eingabe aller Immobilien-Daten",
          howTo: [
            "Grunddaten: Typ, Preis, Größe, Zimmer",
            "Beschreibung und Ausstattung",
            "Lage und Kontaktdaten",
            "Bilder und 360°-Touren verknüpfen",
            "SEO-optimierte Titel und Beschreibungen"
          ]
        },
        {
          title: "Status-Management",
          description: "Verfügbarkeitsstatus und Verkaufsprozess verfolgen",
          howTo: [
            "Verfügbar - Aktiv beworbene Objekte",
            "Reserviert - Vorgemerkte Immobilien",
            "Verkauft/Vermietet - Abgeschlossene Objekte",
            "Entwurf - Noch nicht veröffentlichte Objekte"
          ]
        }
      ],
      quickActions: ["Neue Immobilie", "Import von Excel", "Exposé generieren"],
      tips: [
        "Hochwertige Bilder steigern Interesse",
        "Vollständige Beschreibungen verbessern SEO",
        "Regelmäßige Preis-Updates halten Objekte aktuell"
      ]
    },
    {
      id: "gallery",
      title: "Galerie verwalten",
      icon: Image,
      description: "Bilder, Videos und 360°-Touren für Ihre Immobilien organisieren.",
      features: [
        {
          title: "Bild-Upload",
          description: "Professionelle Fotos hochladen und verwalten",
          howTo: [
            "Drag & Drop für mehrere Bilder",
            "Automatische Komprimierung und Größenanpassung",
            "Bild-Titel und Alt-Texte für SEO",
            "Reihenfolge per Drag & Drop ändern"
          ]
        },
        {
          title: "360°-Touren",
          description: "Immersive Virtual Reality Rundgänge erstellen",
          howTo: [
            "Panorama-Bilder hochladen",
            "Hotspots zwischen Räumen verknüpfen",
            "Informations-Pins hinzufügen",
            "Tour-Navigation konfigurieren"
          ]
        },
        {
          title: "Organisation",
          description: "Medien-Bibliothek strukturiert verwalten",
          howTo: [
            "Ordner nach Objekten erstellen",
            "Tags für einfache Suche vergeben",
            "Batch-Bearbeitung für viele Bilder",
            "Automatische Backup-Funktion"
          ]
        }
      ],
      quickActions: ["Bilder hochladen", "360°-Tour erstellen", "Galerie aufräumen"],
      tips: [
        "Nutzen Sie professionelle Fotografie",
        "360°-Touren steigern Engagement erheblich",
        "Regelmäßig alte Bilder archivieren"
      ]
    },
    {
      id: "inquiries",
      title: "Kundenanfragen",
      icon: MessageSquare,
      description: "Effiziente Bearbeitung und Verfolgung aller Kundenanfragen.",
      features: [
        {
          title: "Anfragen-Übersicht",
          description: "Alle Kundenanfragen mit Status und Priorität",
          howTo: [
            "Neue Anfragen automatisch erkannt",
            "Status: Neu, In Bearbeitung, Beantwortet",
            "Priorität nach Dringlichkeit setzen",
            "Zuordnung zu Teammitgliedern"
          ]
        },
        {
          title: "Antwort-System",
          description: "Professionelle und schnelle Kundenbetreuung",
          howTo: [
            "Vorgefertigte Antwort-Templates nutzen",
            "Personalisierte Nachrichten verfassen",
            "Automatische Email-Benachrichtigungen",
            "Follow-up Erinnerungen setzen"
          ]
        },
        {
          title: "CRM-Integration",
          description: "Nahtlose Verbindung zu Notion für Kundenverfolgung",
          howTo: [
            "Automatische Übertragung zu Notion",
            "Kunden-Profile automatisch erstellen",
            "Interessens-Matching mit Objekten",
            "Kommunikationsverlauf speichern"
          ]
        }
      ],
      quickActions: ["Neue Anfrage beantworten", "Follow-ups prüfen", "CRM synchronisieren"],
      tips: [
        "Antworten Sie innerhalb 1 Stunde",
        "Nutzen Sie persönliche Ansprache",
        "Planen Sie Follow-up Termine"
      ]
    },
    {
      id: "newsletter",
      title: "Newsletter Marketing",
      icon: Mail,
      description: "Professionelle Newsletter-Kampagnen erstellen und versenden.",
      features: [
        {
          title: "Kampagnen-Erstellung",
          description: "Newsletter mit ansprechendem Design gestalten",
          howTo: [
            "Drag & Drop Editor für einfache Gestaltung",
            "Immobilien automatisch einbinden",
            "Responsive Design für alle Geräte",
            "A/B Tests für Betreffzeilen"
          ]
        },
        {
          title: "Abonnenten-Management",
          description: "Empfängerlisten verwalten und segmentieren",
          howTo: [
            "Automatische Anmeldung über Website",
            "Segmentierung nach Interessen",
            "Double-Opt-In für DSGVO-Konformität",
            "Abmeldungen automatisch verarbeiten"
          ]
        },
        {
          title: "Erfolgs-Analyse",
          description: "Newsletter-Performance messen und optimieren",
          howTo: [
            "Öffnungsraten und Klicks verfolgen",
            "Beste Versendzeiten ermitteln",
            "Engagement-Reports generieren",
            "ROI von Kampagnen berechnen"
          ]
        }
      ],
      quickActions: ["Newsletter erstellen", "Kampagne senden", "Statistiken prüfen"],
      tips: [
        "Versenden Sie regelmäßig, aber nicht zu oft",
        "Personalisieren Sie Inhalte nach Zielgruppe",
        "Testen Sie verschiedene Versendzeiten"
      ]
    },
    {
      id: "content",
      title: "Content Management",
      icon: Edit,
      description: "Website-Inhalte direkt über das Dashboard bearbeiten und verwalten.",
      features: [
        {
          title: "Seiten-Editor",
          description: "Direkte Bearbeitung aller Website-Bereiche",
          howTo: [
            "WYSIWYG Editor für einfache Bearbeitung",
            "Live-Vorschau der Änderungen",
            "Mehrsprachige Inhalte verwalten",
            "SEO-Optimierung für alle Texte"
          ]
        },
        {
          title: "Blog-Management",
          description: "Artikel und Neuigkeiten veröffentlichen",
          howTo: [
            "Neue Blog-Artikel erstellen",
            "Kategorien und Tags verwalten",
            "Bilder und Videos einbinden",
            "Automatische Social Media Integration"
          ]
        },
        {
          title: "Rechtliche Seiten",
          description: "Impressum, Datenschutz und AGB verwalten",
          howTo: [
            "Vorlagen für rechtliche Texte",
            "Automatische Updates bei Gesetzesänderungen",
            "Mehrsprachige Rechtstexte",
            "Compliance-Checker integriert"
          ]
        }
      ],
      quickActions: ["Seite bearbeiten", "Blog-Artikel erstellen", "SEO optimieren"],
      tips: [
        "Aktualisieren Sie Inhalte regelmäßig",
        "Nutzen Sie Keywords strategisch",
        "Halten Sie rechtliche Texte aktuell"
      ]
    },
    {
      id: "settings",
      title: "System-Einstellungen",
      icon: Settings,
      description: "Vollständige Konfiguration des Systems und Design-Management.",
      features: [
        {
          title: "Profil-Einstellungen",
          description: "Persönliche Admin-Daten verwalten",
          howTo: [
            "Profilbild und Kontaktdaten ändern",
            "Passwort sicher aktualisieren",
            "Benachrichtigungs-Präferenzen setzen",
            "Zwei-Faktor-Authentifizierung aktivieren"
          ]
        },
        {
          title: "Design & Theme",
          description: "Website-Erscheinungsbild anpassen",
          howTo: [
            "Farbpalette für Corporate Design",
            "Schriftarten und -größen anpassen",
            "Logo und Branding-Elemente",
            "Live-Vorschau aller Änderungen",
            "Hell/Dunkel-Modus Einstellungen"
          ]
        },
        {
          title: "System-Konfiguration",
          description: "Technische Einstellungen und Backups",
          howTo: [
            "Automatische Backup-Zeitpläne",
            "Datenbank-Optimierung",
            "Performance-Überwachung",
            "Sicherheits-Einstellungen",
            "API-Konfiguration"
          ]
        }
      ],
      quickActions: ["Design anpassen", "Backup erstellen", "Sicherheit prüfen"],
      tips: [
        "Erstellen Sie regelmäßige Backups",
        "Testen Sie Design-Änderungen in Vorschau",
        "Aktivieren Sie alle Sicherheitsfeatures"
      ]
    },
    {
      id: "crm-customers",
      title: "CRM - Kunden verwalten",
      icon: Users,
      description: "Umfassende Kunden-Datenbank mit Lead-Scoring und Relationship-Management.",
      features: [
        {
          title: "Kunden-Übersicht",
          description: "Zentrale Verwaltung aller Kunden mit erweiterten Such- und Filterfunktionen",
          howTo: [
            "Kunden nach Name, E-Mail oder Telefon suchen",
            "Nach Kundentyp filtern: Lead, Interessent, Aktiver Kunde, Ehemaliger Kunde",
            "Status-Filter: Neu, Kontaktiert, Qualifiziert, Interessiert, Nicht interessiert",
            "Lead Score anzeigen (0-100 Punkte-System)",
            "Budget-Spannen und Timeline-Informationen einsehen"
          ]
        },
        {
          title: "Neuen Kunden anlegen",
          description: "Vollständige Erfassung neuer Kunden mit allen relevanten Daten",
          howTo: [
            "Grunddaten eingeben: Name, E-Mail, Telefon",
            "Kundentyp und Status festlegen",
            "Budget-Spanne (Min/Max) definieren",
            "Unternehmen und berufliche Details",
            "Notizen und spezielle Anforderungen erfassen",
            "Lead Score automatisch berechnen lassen"
          ]
        },
        {
          title: "Kunden-Segmentierung",
          description: "Intelligente Kategorisierung für zielgerichtetes Marketing",
          howTo: [
            "Lead Score-System nutzen (Farbkodierung)",
            "Kundentypen unterscheiden: Lead → Interessent → Kunde",
            "Status-Workflow verfolgen: Neu → Kontaktiert → Qualifiziert",
            "Budget-Kategorien für passende Objekte",
            "Timeline-Planung für Follow-ups"
          ]
        },
        {
          title: "Interaktions-Management",
          description: "Kommunikation und Beziehungspflege strukturiert dokumentieren",
          howTo: [
            "Kontakt-Historie automatisch verfolgen",
            "Notizen zu Gesprächen und E-Mails",
            "Interesse-Matching mit verfügbaren Objekten",
            "Follow-up Erinnerungen setzen",
            "Kundenreise (Customer Journey) dokumentieren"
          ]
        }
      ],
      quickActions: ["Neuen Kunden hinzufügen", "Lead Score aktualisieren", "Follow-up planen"],
      tips: [
        "Halten Sie Lead Scores aktuell für bessere Priorisierung",
        "Nutzen Sie Segmentierung für zielgerichtete Kampagnen",
        "Dokumentieren Sie jede wichtige Kundeninteraktion",
        "Verfolgen Sie Budget-Entwicklungen bei bestehenden Kunden",
        "Planen Sie regelmäßige Follow-ups für warme Leads"
      ]
    },
    {
      id: "crm-appointments",
      title: "CRM - Termine verwalten",
      icon: Calendar,
      description: "Professionelle Terminplanung für Besichtigungen, Beratungen und Geschäftsabschlüsse.",
      features: [
        {
          title: "Termin-Übersicht",
          description: "Vollständiger Überblick über alle geplanten Termine mit Status-Tracking",
          howTo: [
            "Termine nach Datum, Status oder Typ filtern",
            "Status verfolgen: Geplant, Bestätigt, Abgeschlossen, Abgesagt",
            "Termintypen unterscheiden: Besichtigung, Beratung, Bewertung, Vertragsunterzeichnung",
            "Dauer und Ort für jeden Termin sichtbar",
            "Kunden- und Objektzuordnung nachverfolgen"
          ]
        },
        {
          title: "Termin erstellen",
          description: "Detaillierte Terminplanung mit allen notwendigen Informationen",
          howTo: [
            "Termintyp auswählen (Besichtigung, Beratung, etc.)",
            "Datum und Uhrzeit über Kalender-Widget festlegen",
            "Dauer in Minuten angeben (Standard: 60 Min)",
            "Kunden und Immobilie verknüpfen",
            "Ort/Adresse für externe Termine erfassen",
            "Vorbereitungs-Notizen für bessere Planung"
          ]
        },
        {
          title: "Termin-Management",
          description: "Effiziente Verwaltung und Nachverfolgung aller Termine",
          howTo: [
            "Status-Updates: Von 'Geplant' zu 'Bestätigt' zu 'Abgeschlossen'",
            "Terminverschiebungen dokumentieren",
            "No-Shows registrieren für Follow-up",
            "Termin-Ergebnisse und Notizen erfassen",
            "Automatische Erinnerungen einrichten"
          ]
        },
        {
          title: "Kalender-Integration",
          description: "Nahtlose Integration in Ihren Arbeitskalender",
          howTo: [
            "Termine automatisch im System-Kalender",
            "Mobile Benachrichtigungen aktivieren",
            "Zeitblöcke für Vorbereitung einplanen",
            "Reisezeiten zwischen Terminen berücksichtigen",
            "Konflikt-Erkennung bei Doppelbuchungen"
          ]
        }
      ],
      quickActions: ["Neuen Termin anlegen", "Heutige Termine prüfen", "Status aktualisieren"],
      tips: [
        "Planen Sie 15 Min Pufferzeit zwischen Terminen",
        "Bestätigen Sie Termine am Vortag per E-Mail/SMS",
        "Bereiten Sie sich mit Kunden- und Objektinfos vor",
        "Dokumentieren Sie Termin-Ergebnisse sofort danach",
        "Nutzen Sie Status-Updates für professionelles Follow-up"
      ]
    },
    {
      id: "crm-leads",
      title: "CRM - Lead Pipeline",
      icon: TrendingUp,
      description: "Vollständiges Sales Pipeline Management mit Wahrscheinlichkeits-Tracking und Umsatzprognosen.",
      features: [
        {
          title: "Pipeline-Übersicht",
          description: "Visualisierung Ihrer kompletten Sales Pipeline mit KPIs",
          howTo: [
            "Pipeline-Stages verfolgen: Neu → Kontaktiert → Qualifiziert → Angebot → Verhandlung → Abschluss",
            "Fortschritts-Balken für jeden Lead anzeigen",
            "Wahrscheinlichkeits-Prozente (0-100%) je Stage",
            "Gesamt-Pipeline-Wert und gewichteten Wert berechnen",
            "Conversion-Rate und Erfolgsquote überwachen"
          ]
        },
        {
          title: "Lead erstellen & verwalten",
          description: "Umfassende Lead-Erfassung mit Potential-Bewertung",
          howTo: [
            "Lead-Grunddaten: Kunde, Immobilie, zugeteilter Agent",
            "Pipeline-Stage und Abschluss-Wahrscheinlichkeit festlegen",
            "Deal-Wert und erwartete Provision kalkulieren",
            "Deal-Typ unterscheiden: Verkauf, Vermietung, Bewertungsservice",
            "Erwartetes Abschlussdatum für Prognosen",
            "Nächste Aktion und Fälligkeitsdatum definieren"
          ]
        },
        {
          title: "Sales Analytics",
          description: "Detaillierte Analyse Ihrer Verkaufsleistung und Pipeline-Gesundheit",
          howTo: [
            "Gesamt-Pipeline-Wert in Echtzeit verfolgen",
            "Gewichteten Pipeline-Wert nach Wahrscheinlichkeit",
            "Aktive Leads vs. abgeschlossene Deals",
            "Conversion Rate (Gewonnene/Gesamt-Leads) berechnen",
            "Durchschnittliche Deal-Größe und Verkaufszyklen"
          ]
        },
        {
          title: "Prognose & Planung",
          description: "Umsatzprognosen und strategische Pipeline-Planung",
          howTo: [
            "Monatliche/quartalsweise Umsatzprognosen",
            "Pipeline-Velocity (Geschwindigkeit) messen",
            "Bottleneck-Erkennung in Pipeline-Stages",
            "Provisionsberechnungen für Budgetplanung",
            "Deal-Prioritätenliste nach Wahrscheinlichkeit × Wert"
          ]
        },
        {
          title: "Action Management",
          description: "Systematische Verfolgung von Folgeaktivitäten",
          howTo: [
            "Nächste Aktionen pro Lead definieren",
            "Fälligkeitsdaten für Follow-ups setzen",
            "Überfällige Aktionen rot hervorheben",
            "Automatische Erinnerungen für wichtige Deadlines",
            "Aktions-Historie für jeden Lead dokumentieren"
          ]
        }
      ],
      quickActions: ["Neuen Lead hinzufügen", "Pipeline-Report generieren", "Überfällige Aktionen prüfen"],
      tips: [
        "Aktualisieren Sie Wahrscheinlichkeiten realistisch",
        "Verfolgen Sie Deal-Velocity für bessere Prognosen",
        "Konzentrieren Sie sich auf wenige, hochwertige Leads",
        "Nutzen Sie gewichteten Pipeline-Wert für Planung",
        "Setzen Sie konkrete Fälligkeitsdaten für alle Aktionen",
        "Analysieren Sie verlorene Deals für Verbesserungen",
        "Halten Sie Pipeline-Stages sauber und aktuell"
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Hilfe</h2>
              <p className="text-gray-600">Vollständige Anleitung für alle Dashboard-Funktionen</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="help-close-button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Bereiche</h3>
              <div className="space-y-1">
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      expandedSections.includes(section.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    data-testid={`help-section-${section.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {expandedSections.includes(section.id) ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {expandedSections.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">Wählen Sie einen Bereich</h3>
                  <p>Klicken Sie links auf einen Dashboard-Bereich, um detaillierte Hilfe zu erhalten.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {helpSections
                    .filter(section => expandedSections.includes(section.id))
                    .map((section) => (
                      <Card key={section.id} className="border-2 border-blue-100">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-3 text-xl">
                              <section.icon className="w-7 h-7 text-blue-600" />
                              <span>{section.title}</span>
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToTab(section.id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              data-testid={`navigate-to-${section.id}`}
                            >
                              Bereich öffnen
                            </Button>
                          </div>
                          <p className="text-gray-600 text-base">{section.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Features */}
                          <div className="space-y-4">
                            {section.features.map((feature, index) => (
                              <div key={index} className="border-l-4 border-blue-200 pl-4">
                                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                                <p className="text-gray-600 mb-3">{feature.description}</p>
                                <div className="space-y-1">
                                  <p className="font-medium text-sm text-gray-700">So funktioniert's:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {feature.howTo.map((step, stepIndex) => (
                                      <li key={stepIndex}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Actions */}
                          {section.quickActions && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Schnellaktionen</h4>
                              <div className="flex flex-wrap gap-2">
                                {section.quickActions.map((action, index) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tips */}
                          {section.tips && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">💡 Profi-Tipps</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {section.tips.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Bodensee Immobilien Müller - Admin Dashboard Hilfe</p>
            <div className="flex items-center space-x-4">
              <span>Drücken Sie <kbd className="px-2 py-1 bg-white rounded border text-xs">ESC</kbd> zum Schließen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}