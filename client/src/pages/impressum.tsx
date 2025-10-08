import { useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default function Impressum() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Angaben gemäß § 5 TMG */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Angaben gemäß § 5 TMG
                </h2>
                <div className="space-y-2 text-gray-700">
                  <p className="font-semibold">
                    Bodensee Immobilien Manfred Müller
                  </p>
                  <p>Seewiesenstr 31/6</p>
                  <p>88048 Friedrichshafen</p>
                  <p>Deutschland</p>
                </div>
              </section>

              {/* Kontakt */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Kontakt
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[var(--arctic-blue)]" />
                    <span className="text-gray-700">07 54 1 / 37 16 48</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[var(--arctic-blue)]" />
                    <span className="text-gray-700">
                      Fax: 07 54 1 / 37 16 49
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[var(--arctic-blue)]" />
                    <span className="text-gray-700">
                      Mobil: 0160 / 80 666 30
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-[var(--arctic-blue)]" />
                    <a
                      href="mailto:mueller@bimm-fn.de"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      mueller@bimm-fn.de
                    </a>
                  </div>
                </div>
              </section>

              {/* Inhaber */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Inhaber
                </h2>
                <p className="text-gray-700">Manfred Müller</p>
              </section>

              {/* Rechtliche Angaben */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Rechtliche Angaben
                </h2>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>USt-IdNr.:</strong> UID Nr. 61178/42206
                  </p>
                </div>
              </section>

              {/* Verantwortlich für den Inhalt */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
                </h2>
                <div className="space-y-2 text-gray-700">
                  <p>Manfred Müller</p>
                  <p>Seewiesenstr 31/6</p>
                  <p>88048 Friedrichshafen</p>
                </div>
              </section>

              {/* EU-Streitschlichtung */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  EU-Streitschlichtung
                </h2>
                <p className="text-gray-700">
                  Die Europäische Kommission stellt eine Plattform zur
                  Online-Streitbeilegung (OS) bereit:
                  <a
                    href="https://ec.europa.eu/consumers/odr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--arctic-blue)] hover:underline ml-1"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
              </section>

              {/* Verbraucherstreitbeilegung */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Verbraucherstreitbeilegung/Universalschlichtungsstelle
                </h2>
                <p className="text-gray-700">
                  Wir sind nicht bereit oder verpflichtet, an
                  Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

              {/* Haftung für Inhalte */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Haftung für Inhalte
                </h2>
                <p className="text-gray-700">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene
                  Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                  verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                  Diensteanbieter jedoch nicht unter der Verpflichtung,
                  übermittelte oder gespeicherte fremde Informationen zu
                  überwachen oder nach Umständen zu forschen, die auf eine
                  rechtswidrige Tätigkeit hinweisen.
                </p>
                <p className="text-gray-700 mt-2">
                  Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
                  Informationen nach den allgemeinen Gesetzen bleiben hiervon
                  unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
                  Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
                  möglich. Bei Bekanntwerden von entsprechenden
                  Rechtsverletzungen werden wir diese Inhalte umgehend
                  entfernen.
                </p>
              </section>

              {/* Haftung für Links */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Haftung für Links
                </h2>
                <p className="text-gray-700">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf
                  deren Inhalte wir keinen Einfluss haben. Deshalb können wir
                  für diese fremden Inhalte auch keine Gewähr übernehmen. Für
                  die Inhalte der verlinkten Seiten ist stets der jeweilige
                  Anbieter oder Betreiber der Seiten verantwortlich. Die
                  verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
                  mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren
                  zum Zeitpunkt der Verlinkung nicht erkennbar.
                </p>
                <p className="text-gray-700 mt-2">
                  Eine permanente inhaltliche Kontrolle der verlinkten Seiten
                  ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung
                  nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
                  werden wir derartige Links umgehend entfernen.
                </p>
              </section>

              {/* Urheberrecht */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Urheberrecht
                </h2>
                <p className="text-gray-700">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
                  diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                  Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                  Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen
                  der schriftlichen Zustimmung des jeweiligen Autors bzw.
                  Erstellers. Downloads und Kopien dieser Seite sind nur für den
                  privaten, nicht kommerziellen Gebrauch gestattet.
                </p>
                <p className="text-gray-700 mt-2">
                  Soweit die Inhalte auf dieser Seite nicht vom Betreiber
                  erstellt wurden, werden die Urheberrechte Dritter beachtet.
                  Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
                  Sollten Sie trotzdem auf eine Urheberrechtsverletzung
                  aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
                  Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
                  Inhalte umgehend entfernen.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
