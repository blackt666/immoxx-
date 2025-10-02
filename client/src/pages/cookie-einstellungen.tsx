import { useState, useEffect } from "react";
import { ArrowLeft, Cookie, Shield, Settings, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/landing/navigation";
import Footer from "@/components/landing/footer";
import { useToast } from "@/hooks/use-toast";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieEinstellungen() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [hasChanged, setHasChanged] = useState(false);
  const { toast } = useToast();

  // Load saved preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("cookiePreferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...preferences, ...parsed });
      } catch (error) {
        console.error("Error parsing saved cookie preferences:", error);
      }
    }
  }, []);

  const handlePreferenceChange = (
    key: keyof CookiePreferences,
    value: boolean,
  ) => {
    if (key === "necessary") return; // Cannot disable necessary cookies

    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanged(true);
  };

  const savePreferences = () => {
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));

    // Set cookies based on preferences
    if (preferences.functional) {
      document.cookie = "functional-cookies=accepted; path=/; max-age=31536000";
    } else {
      document.cookie = "functional-cookies=rejected; path=/; max-age=31536000";
    }

    if (preferences.analytics) {
      document.cookie = "analytics-cookies=accepted; path=/; max-age=31536000";
    } else {
      document.cookie = "analytics-cookies=rejected; path=/; max-age=31536000";
    }

    if (preferences.marketing) {
      document.cookie = "marketing-cookies=accepted; path=/; max-age=31536000";
    } else {
      document.cookie = "marketing-cookies=rejected; path=/; max-age=31536000";
    }

    setHasChanged(false);
    toast({
      title: "Einstellungen gespeichert",
      description: "Ihre Cookie-Einstellungen wurden erfolgreich aktualisiert.",
    });
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));

    document.cookie = "functional-cookies=accepted; path=/; max-age=31536000";
    document.cookie = "analytics-cookies=accepted; path=/; max-age=31536000";
    document.cookie = "marketing-cookies=accepted; path=/; max-age=31536000";

    toast({
      title: "Alle Cookies akzeptiert",
      description: "Sie haben alle Cookie-Kategorien aktiviert.",
    });
    setHasChanged(false);
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem("cookiePreferences", JSON.stringify(onlyNecessary));

    document.cookie = "functional-cookies=rejected; path=/; max-age=31536000";
    document.cookie = "analytics-cookies=rejected; path=/; max-age=31536000";
    document.cookie = "marketing-cookies=rejected; path=/; max-age=31536000";

    toast({
      title: "Nur notwendige Cookies",
      description: "Nur erforderliche Cookies sind aktiviert.",
    });
    setHasChanged(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Startseite
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
              <Cookie className="w-10 h-10 mr-4 text-[var(--arctic-blue)]" />
              Cookie-Einstellungen
            </h1>
            <p className="text-lg text-gray-600">
              Verwalten Sie Ihre Cookie-Präferenzen und
              Datenschutz-Einstellungen
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 flex flex-wrap gap-4">
            <Button
              onClick={acceptAll}
              className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Alle akzeptieren
            </Button>
            <Button variant="outline" onClick={rejectAll}>
              Nur notwendige
            </Button>
            {hasChanged && (
              <Button variant="secondary" onClick={savePreferences}>
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </Button>
            )}
          </div>

          {/* Cookie Categories */}
          <div className="space-y-6">
            {/* Necessary Cookies */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-green-500" />
                    <span>Notwendige Cookies</span>
                    <span className="text-sm font-normal text-gray-500">
                      (Immer aktiviert)
                    </span>
                  </div>
                  <Switch
                    checked={preferences.necessary}
                    disabled={true}
                    className="data-[state=checked]:bg-green-500"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Diese Cookies sind für das Funktionieren der Website unbedingt
                  erforderlich und können nicht deaktiviert werden. Sie werden
                  normalerweise nur als Reaktion auf Ihre Aktionen gesetzt, die
                  einer Anfrage nach Diensten entsprechen.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verwendet für:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sitzungsverwaltung und Benutzeranmeldung</li>
                    <li>• Sicherheitsfeatures und Spam-Schutz</li>
                    <li>• Grundlegende Website-Funktionalität</li>
                    <li>• Cookie-Einstellungen speichern</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Functional Cookies */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-blue-500" />
                    <span>Funktionale Cookies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="functional-cookies">Aktivieren</Label>
                    <Switch
                      id="functional-cookies"
                      checked={preferences.functional}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("functional", checked)
                      }
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Diese Cookies ermöglichen erweiterte Funktionalitäten und
                  Personalisierung. Sie können von uns oder von Drittanbietern
                  gesetzt werden, deren Dienste wir zu unseren Seiten
                  hinzugefügt haben.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verwendet für:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Benutzereinstellungen speichern</li>
                    <li>• Immobilien-Favoriten merken</li>
                    <li>• Formular-Daten zwischen Sitzungen speichern</li>
                    <li>• Verbesserung der Benutzererfahrung</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    </div>
                    <span>Analyse Cookies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="analytics-cookies">Aktivieren</Label>
                    <Switch
                      id="analytics-cookies"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("analytics", checked)
                      }
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Diese Cookies helfen uns zu verstehen, wie Besucher mit der
                  Website interagieren, indem sie Informationen anonym sammeln
                  und weiterleiten. Alle Informationen werden aggregiert und
                  sind daher anonym.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verwendet für:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Besucherstatistiken und Seitenaufrufe</li>
                    <li>• Verbesserung der Website-Performance</li>
                    <li>• Verstehen des Nutzerverhaltens</li>
                    <li>• Identifikation beliebter Inhalte</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                    <span>Marketing Cookies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="marketing-cookies">Aktivieren</Label>
                    <Switch
                      id="marketing-cookies"
                      checked={preferences.marketing}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("marketing", checked)
                      }
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Diese Cookies werden verwendet, um Ihnen relevante Werbung zu
                  zeigen und zu messen, wie effektiv unsere Werbekampagnen sind.
                  Sie können von unseren Werbepartnern über unsere Website
                  gesetzt werden.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verwendet für:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Personalisierte Werbung anzeigen</li>
                    <li>• Werbekampagnen optimieren</li>
                    <li>• Retargeting von Website-Besuchern</li>
                    <li>• Messung der Werbeleistung</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Weitere Informationen
            </h3>
            <p className="text-blue-800 mb-4">
              Sie können Ihre Cookie-Einstellungen jederzeit über diese Seite
              ändern. Weitere Details zum Datenschutz finden Sie in unserer
              Datenschutzerklärung.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/datenschutz">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Datenschutzerklärung
                </Button>
              </Link>
              <Link href="/impressum">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Impressum
                </Button>
              </Link>
            </div>
          </div>

          {/* Save Button */}
          {hasChanged && (
            <div className="mt-8 text-center">
              <Button
                onClick={savePreferences}
                size="lg"
                className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 px-12"
              >
                <Settings className="w-5 h-5 mr-2" />
                Einstellungen speichern
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
