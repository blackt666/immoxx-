import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/landing/navigation";
import Footer from "@/components/landing/footer";

export default function AGB() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Allgemeine Geschäftsbedingungen
            </h1>
            <p className="text-lg text-gray-600">
              Gültig für alle Geschäfte von Bodensee Immobilien Manfred Müller
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Geltungsbereich */}
            <div className="bg-gray-50 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                1. Geltungsbereich
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle
                  Geschäftsbeziehungen zwischen
                </p>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-gray-700">
                    <strong>Bodensee Immobilien Manfred Müller</strong>
                    <br />
                    Inhaber: Manfred Müller
                    <br />
                    Seewiesenstr. 31/6
                    <br />
                    88048 Friedrichshafen
                    <br />
                    Deutschland
                    <br />
                    (nachfolgend &quot;Makler&quot; genannt)
                  </p>
                </div>
                <p className="text-gray-700">
                  und dem Auftraggeber (nachfolgend &quot;Kunde&quot; genannt). Sie gelten
                  für Immobilienvermittlungsverträge, Beratungsverträge und
                  sonstige Dienstleistungen im Immobilienbereich.
                </p>
                <p className="text-gray-700">
                  Abweichende Bedingungen des Kunden werden nur wirksam, wenn
                  sie ausdrücklich schriftlich anerkannt werden.
                </p>
              </div>
            </div>

            {/* Vertragsabschluss */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                2. Vertragsabschluss und Leistungen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    2.1 Maklervertrag
                  </h3>
                  <p className="text-gray-700">
                    Der Maklervertrag kommt durch schriftliche Beauftragung oder
                    durch die Annahme unserer Leistungen zustande. Bei
                    Verkaufsaufträgen wird ein qualifizierter Alleinauftrag oder
                    einfacher Maklervertrag geschlossen.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    2.2 Leistungsumfang
                  </h3>
                  <p className="text-gray-700">
                    Unsere Leistungen umfassen insbesondere:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>Marktbewertung der Immobilie</li>
                    <li>Erstellung aussagekräftiger Exposés</li>
                    <li>
                      Vermarktung über verschiedene Kanäle (Internet,
                      Printmedien, Schaufenster)
                    </li>
                    <li>Vorqualifikation und Betreuung von Interessenten</li>
                    <li>Organisation und Durchführung von Besichtigungen</li>
                    <li>Verhandlungsunterstützung</li>
                    <li>
                      Unterstützung bei der Vertragsabwicklung bis zum
                      Notartermin
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    2.3 Suchauftrag
                  </h3>
                  <p className="text-gray-700">
                    Bei Suchaufträgen verpflichten wir uns, nach geeigneten
                    Objekten zu suchen und diese dem Kunden vorzustellen. Ein
                    Erfolgszwang besteht nicht.
                  </p>
                </div>
              </div>
            </div>

            {/* Provision */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                3. Provision und Zahlungsbedingungen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.1 Provisionsanspruch
                  </h3>
                  <p className="text-gray-700">
                    Der Provisionsanspruch entsteht mit dem rechtswirksamen
                    Abschluss des vermittelten Vertrages (Kauf-, Miet- oder
                    Pachtvertrag) gemäß § 652 BGB. Die Provision wird bei
                    Beurkundung des Kaufvertrages bzw. bei Unterzeichnung des
                    Mietvertrages fällig.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.2 Provisionshöhe
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-3">Die Provision beträgt:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li>
                        <strong>Verkauf:</strong> 7,14% (inkl. 19% MwSt.) des
                        Kaufpreises, aufgeteilt zwischen Käufer und Verkäufer
                        gemäß gesetzlicher Regelung
                      </li>
                      <li>
                        <strong>Vermietung:</strong> 2,38 Nettokaltmieten (inkl.
                        19% MwSt.)
                      </li>
                      <li>
                        <strong>Verpachtung:</strong> Nach Vereinbarung
                      </li>
                    </ul>
                  </div>
                  <p className="text-gray-700 mt-4">
                    Bei Verkaufsgeschäften gilt seit dem 23.12.2020 das
                    Bestellerprinzip gemäß § 656a BGB. Käufer und Verkäufer
                    tragen die Provision je zur Hälfte, sofern nichts anderes
                    vereinbart wird.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.3 Zahlungsbedingungen
                  </h3>
                  <p className="text-gray-700">
                    Die Provision ist bei Fälligkeit ohne Abzug zur Zahlung
                    fällig. Bei Zahlungsverzug werden Verzugszinsen in Höhe von
                    9 Prozentpunkten über dem Basiszinssatz berechnet.
                  </p>
                </div>
              </div>
            </div>

            {/* Pflichten der Vertragsparteien */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                4. Pflichten der Vertragsparteien
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    4.1 Pflichten des Maklers
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>
                      Sorgfältige Marktbearbeitung und professionelle
                      Vermarktung
                    </li>
                    <li>Sachkundige Beratung gemäß § 34c GewO</li>
                    <li>Wahrung der Vertraulichkeit und des Datenenschutzes</li>
                    <li>
                      Regelmäßige Berichterstattung über den
                      Vermarktungsfortschritt
                    </li>
                    <li>
                      Einhaltung der gesetzlichen Aufklärungs- und
                      Hinweispflichten
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    4.2 Pflichten des Auftraggebers
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>
                      Vollständige und wahrheitsgemäße Angaben über die
                      Immobilie
                    </li>
                    <li>
                      Bereitstellung aller erforderlichen Unterlagen (Grundriss,
                      Energieausweis, etc.)
                    </li>
                    <li>
                      Ermöglichung von Besichtigungen nach vorheriger
                      Terminabsprache
                    </li>
                    <li>
                      Unverzügliche Mitteilung bei Änderungen der
                      Verkaufs-/Vermietungsbereitschaft
                    </li>
                    <li>Information über parallele Vermarktungsaktivitäten</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Immobilienspezifische Bestimmungen */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                5. Immobilienspezifische Bestimmungen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    5.1 Energieausweis
                  </h3>
                  <p className="text-gray-700">
                    Gemäß Gebäudeenergiegesetz (GEG) ist bei der Vermietung oder
                    dem Verkauf von Immobilien ein gültiger Energieausweis
                    vorzulegen. Der Auftraggeber stellt diesen zur Verfügung.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    5.2 Maklermeldepflicht
                  </h3>
                  <p className="text-gray-700">
                    Gemäß § 11b GwG (Geldwäschegesetz) sind wir verpflichtet,
                    bei Immobiliengeschäften ab einem Wert von 10.000 Euro eine
                    Identitätsprüfung durchzuführen und diese zu dokumentieren.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    5.3 Widerrufsrecht
                  </h3>
                  <p className="text-gray-700">
                    Bei Verbraucherverträgen, die außerhalb der Geschäftsräume
                    geschlossen werden, besteht ein 14-tägiges Widerrufsrecht
                    gemäß § 312g BGB. Eine entsprechende Widerrufsbelehrung wird
                    erteilt.
                  </p>
                </div>
              </div>
            </div>

            {/* Datenschutz */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                6. Datenschutz und Vertraulichkeit
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Wir verpflichten uns zur Einhaltung der
                  Datenschutz-Grundverordnung (DSGVO) und des
                  Bundesdatenschutzgesetzes (BDSG). Alle uns anvertrauten Daten
                  werden vertraulich behandelt und nur zur Erfüllung des
                  Maklerauftrags verwendet.
                </p>
                <p className="text-gray-700">
                  Detaillierte Informationen zum Datenschutz finden Sie in
                  unserer
                  <Link href="/datenschutz">
                    <span className="text-[var(--arctic-blue)] hover:underline ml-1">
                      Datenschutzerklärung
                    </span>
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Haftung */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                7. Haftung und Gewährleistung
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    7.1 Haftungsbeschränkung
                  </h3>
                  <p className="text-gray-700">
                    Die Haftung beschränkt sich auf Vorsatz und grobe
                    Fahrlässigkeit. Bei leichter Fahrlässigkeit haften wir nur
                    bei Verletzung wesentlicher Vertragspflichten
                    (Kardinalspflichten) und nur bis zur Höhe des typischen,
                    vorhersehbaren Schadens.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    7.2 Angaben zu Immobilien
                  </h3>
                  <p className="text-gray-700">
                    Alle Angaben zu Immobilien beruhen auf Informationen der
                    Auftraggeber oder Dritter. Für die Richtigkeit und
                    Vollständigkeit dieser Angaben übernehmen wir keine Gewähr,
                    es sei denn, wir haben sie vorsätzlich oder grob fahrlässig
                    falsch übermittelt.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    7.3 Versicherung
                  </h3>
                  <p className="text-gray-700">
                    Wir verfügen über eine Berufshaftpflichtversicherung gemäß §
                    34c GewO mit einer Deckungssumme von mindestens 1.000.000
                    Euro.
                  </p>
                </div>
              </div>
            </div>

            {/* Vertragsbeendigung */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                8. Vertragsbeendigung
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    8.1 Kündigung
                  </h3>
                  <p className="text-gray-700">
                    Der Maklervertrag kann von beiden Seiten mit einer Frist von
                    4 Wochen zum Monatsende gekündigt werden, soweit nicht
                    anders vereinbart. Die Kündigung bedarf der Schriftform.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    8.2 Außerordentliche Kündigung
                  </h3>
                  <p className="text-gray-700">
                    Das Recht zur außerordentlichen Kündigung aus wichtigem
                    Grund bleibt unberührt. Ein wichtiger Grund liegt
                    insbesondere vor bei Verletzung wesentlicher
                    Vertragspflichten.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    8.3 Nachwirkung
                  </h3>
                  <p className="text-gray-700">
                    Wird ein Geschäft innerhalb von 12 Monaten nach
                    Vertragsbeendigung mit einem von uns nachgewiesenen
                    Interessenten abgeschlossen, besteht Anspruch auf die
                    vereinbarte Provision.
                  </p>
                </div>
              </div>
            </div>

            {/* Besondere Bestimmungen */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                9. Besondere Bestimmungen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    9.1 Gerichtsstand und anwendbares Recht
                  </h3>
                  <p className="text-gray-700">
                    Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist
                    Friedrichshafen, sofern der Kunde Kaufmann ist. Es gilt
                    deutsches Recht.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    9.2 Salvatorische Klausel
                  </h3>
                  <p className="text-gray-700">
                    Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
                    werden, berührt dies die Wirksamkeit der übrigen
                    Bestimmungen nicht. Unwirksame Bestimmungen sind durch
                    rechtswirksame zu ersetzen, die dem wirtschaftlichen Zweck
                    am nächsten kommen.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    9.3 Schriftformerfordernis
                  </h3>
                  <p className="text-gray-700">
                    Änderungen und Ergänzungen dieser AGB bedürfen der
                    Schriftform. Dies gilt auch für die Aufhebung des
                    Schriftformerfordernisses.
                  </p>
                </div>
              </div>
            </div>

            {/* Streitbeilegung */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                10. Streitbeilegung
              </h2>

              <div className="space-y-4">
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
                <p className="text-gray-700">
                  Wir sind nicht bereit oder verpflichtet, an
                  Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </div>

            {/* Gewerberechtliche Angaben */}
            <div className="bg-gray-50 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                11. Gewerberechtliche Angaben
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  <strong>Erlaubnis nach § 34c GewO:</strong> Bodensee
                  Immobilien Manfred Müller verfügt über die erforderliche
                  Erlaubnis zur Ausübung der Immobilienmakler- und
                  Immobilienverwaltertätigkeit gemäß § 34c der Gewerbeordnung.
                </p>
                <p className="text-gray-700">
                  <strong>Zuständige Behörde:</strong> Stadt Friedrichshafen,
                  Ordnungsamt
                </p>
                <p className="text-gray-700">
                  <strong>Berufsrechtliche Regelungen:</strong> § 34c
                  Gewerbeordnung (GewO), Makler- und Bauträgerverordnung (MaBV)
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center pt-8 border-t border-gray-200">
              <p>Stand: {new Date().toLocaleDateString("de-DE")}</p>
              <p className="mt-2">
                Bodensee Immobilien Manfred Müller | Seewiesenstr. 31/6 | 88048
                Friedrichshafen
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
