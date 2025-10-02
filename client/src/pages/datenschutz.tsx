import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/landing/navigation";
import Footer from "@/components/landing/footer";

export default function Datenschutz() {
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
              Datenschutzerklärung
            </h1>
            <p className="text-lg text-gray-600">
              Informationen zur Verarbeitung Ihrer personenbezogenen Daten
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                1. Einleitung
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Diese Website wird betrieben von: Bodensee Immobilien Manfred
                  Müller.
                </p>
                <p className="text-gray-700">
                  Es ist uns sehr wichtig, mit den Daten unserer
                  Website-Besucher vertrauensvoll umzugehen und sie bestmöglich
                  zu schützen. Aus diesem Grund leisten wir alle Anstrengungen,
                  um die Anforderungen der DSGVO zu erfüllen.
                </p>
                <p className="text-gray-700">
                  Im Folgenden erläutern wir Ihnen, wie wir Ihre Daten auf
                  unserer Webseite verarbeiten. Dazu verwenden wir eine
                  möglichst klare und transparente Sprache, damit Sie wirklich
                  verstehen, was mit Ihren Daten passiert.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                2. Verantwortlicher
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Verantwortlicher im Sinne der Datenschutz-Grundverordnung
                  (DSGVO) ist:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
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
                    <br />
                    <strong>Telefon:</strong> 07541 / 371648
                    <br />
                    <strong>Fax:</strong> 07541 / 371649
                    <br />
                    <strong>Mobil:</strong> 0160 / 8066630
                    <br />
                    <strong>E-Mail:</strong>{" "}
                    <a
                      href="mailto:mueller@bimm-fn.de"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      mueller@bimm-fn.de
                    </a>
                    <br />
                    <strong>USt-IdNr.:</strong> UID Nr. 61178/42206
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                3. Allgemeine Informationen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.1 Verarbeitung von personenbezogenen Daten
                  </h3>
                  <p className="text-gray-700">
                    Datenschutz gilt bei der Verarbeitung von personenbezogenen
                    Daten. Personenbezogen meint alle Daten, mit denen Sie
                    persönlich identifiziert werden können. Das ist z.B. die
                    IP-Adresse des Geräts vor dem Sie gerade sitzen. Verarbeitet
                    werden solche Daten dann, wenn irgendetwas damit passiert.
                  </p>
                  <p className="text-gray-700 mt-2">
                    Diese und weitere gesetzlichen Definitionen sind in Art. 4
                    DSGVO zu finden.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.2 Anzuwendende Vorschriften/Gesetze
                  </h3>
                  <p className="text-gray-700">
                    Der Umfang des Datenschutzes wird durch Gesetze geregelt.
                    Das sind in diesem Fall die DSGVO
                    (Datenschutzgrundverordnung) als europäische Verordnung und
                    das BDSG (Bundesdatenschutzgesetz) als nationales Gesetz.
                  </p>
                  <p className="text-gray-700 mt-2">
                    Außerdem ergänzt das TTDSG die Vorschriften aus der DSGVO,
                    soweit es sich um den Einsatz von Cookies handelt.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    3.3 So werden Daten auf dieser Website verarbeitet
                  </h3>
                  <p className="text-gray-700">
                    Es gibt Daten (z.B. IP-Adresse) die automatisch erhoben
                    werden. Diese Daten werden überwiegend für die technische
                    Bereitstellung der Homepage benötigt. Soweit wir darüber
                    hinaus personenbezogene Daten verwenden oder andere Daten
                    erheben, klären wir Sie darüber auf bzw. fragen nach einer
                    Einwilligung.
                  </p>
                  <p className="text-gray-700 mt-2">
                    Andere personenbezogene Daten teilen Sie uns bewusst mit.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                4. Erhebung und Verarbeitung personenbezogener Daten
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    4.1 Arten der verarbeiteten Daten
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Wir verarbeiten folgende Kategorien personenbezogener Daten:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>
                      Kontaktdaten (Name, Anschrift, Telefonnummer,
                      E-Mail-Adresse)
                    </li>
                    <li>Immobilienanfragen und Bewertungsdaten</li>
                    <li>
                      Kommunikationsdaten (Nachrichten, Anfragen über
                      Kontaktformulare)
                    </li>
                    <li>
                      Nutzungsdaten (Besuchte Seiten, Verweildauer,
                      Klickverhalten)
                    </li>
                    <li>
                      Technische Daten (IP-Adresse, Browser-Typ, Betriebssystem)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    4.2 Zwecke der Datenverarbeitung
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Ihre personenbezogenen Daten werden zu folgenden Zwecken
                    verarbeitet:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>
                      Bearbeitung von Immobilienanfragen und Kontaktaufnahme
                    </li>
                    <li>Bereitstellung kostenloser Immobilienbewertungen</li>
                    <li>Terminvereinbarungen für Besichtigungen</li>
                    <li>Immobilienberatung und -vermittlung</li>
                    <li>
                      Newsletter-Versand (nur bei ausdrücklicher Einwilligung)
                    </li>
                    <li>Verbesserung unserer Website-Funktionalität</li>
                    <li>Kundenbetreuung und -service</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    4.3 Rechtsgrundlagen
                  </h3>
                  <p className="text-gray-700">
                    Die Verarbeitung personenbezogener Daten erfolgt auf
                    Grundlage von:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
                    <li>
                      Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung und
                      vorvertragliche Maßnahmen)
                    </li>
                    <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                5. Datenverarbeitung durch Nutzereingabe
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    5.1 Kontaktaufnahme
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">E-Mail</h4>
                      <p className="text-gray-700">
                        Wenn Sie per E-Mail mit uns in Kontakt treten,
                        verarbeiten wir Ihre E-Mail-Adresse und ggfs. weitere in
                        der Mail enthaltene Daten. Je nach Anliegen ist die
                        Rechtsgrundlage hierfür regelmäßig Art. 6 Abs. 1 lit. f
                        DSGVO oder Art. 6 Abs. 1 lit. b DSGVO. Die Daten werden
                        gelöscht, sobald der jeweilige Zweck entfällt.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Telefon
                      </h4>
                      <p className="text-gray-700">
                        Wenn Sie per Telefon mit uns in Kontakt treten, werden
                        während des Telefonats erhobene personenbezogene Daten
                        ausschließlich verarbeitet, um Ihre Anfrage zu
                        bearbeiten. Je nach Anliegen ist die Rechtsgrundlage
                        hierfür regelmäßig Art. 6 Abs. 1 lit. f DSGVO oder Art.
                        6 Abs. 1 lit. b DSGVO.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Kontaktformular und Immobilienbewertung
                      </h4>
                      <p className="text-gray-700">
                        Wir bieten verschiedene Kontaktformulare an,
                        einschließlich eines Formulars für kostenlose
                        Immobilienbewertungen. Hierbei verarbeiten wir in der
                        Regel Ihren Namen, Ihre Telefonnummer, Ihre
                        E-Mail-Adresse, sowie Angaben zur Immobilie und den
                        Inhalt Ihrer Nachricht.
                      </p>
                      <p className="text-gray-700 mt-2">
                        Die Rechtsgrundlage für die Datenverarbeitung ist Art. 6
                        Abs. 1 lit. f DSGVO, da wir ein berechtigtes Interesse
                        an der Beantwortung Ihres Anliegens haben. Zielt die
                        Kontaktaufnahme auf den Abschluss eines Vertrages ab, so
                        ist zusätzliche Rechtsgrundlage Art. 6 Abs. 1 lit. b
                        DSGVO.
                      </p>
                      <p className="text-gray-700 mt-2">
                        Wir löschen diese Daten spätestens 3 Jahre nach Erhalt,
                        es sei denn, sie werden für eine entstandene
                        Vertragsbeziehung benötigt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                6. Externe Dienstleister
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    6.1 Notion (Projektmanagement)
                  </h3>
                  <p className="text-gray-700">
                    Wir nutzen Notion Inc. für die Verwaltung von Kundenanfragen
                    und internen Prozessen. Dabei können Kontaktdaten und
                    Anfrageinhalte an Notion übertragen werden.
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Anbieter:</strong> Notion Labs, Inc., 2300 Harrison
                    Street, San Francisco, CA 94110, USA
                    <br />
                    <strong>Datenschutz:</strong>{" "}
                    <a
                      href="https://www.notion.so/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      https://www.notion.so/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    6.2 Google Maps
                  </h3>
                  <p className="text-gray-700">
                    Zur Darstellung von Immobilienstandorten verwenden wir
                    Google Maps. Dabei wird Ihre IP-Adresse an Google
                    übertragen.
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Anbieter:</strong> Google LLC, 1600 Amphitheatre
                    Parkway, Mountain View, CA 94043, USA
                    <br />
                    <strong>Datenschutz:</strong>{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      https://policies.google.com/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    6.3 OpenAI API (KI-gestützte Immobilienbewertung)
                  </h3>
                  <p className="text-gray-700">
                    Für unsere KI-gestützte Immobilienbewertung nutzen wir die
                    OpenAI API. Dabei werden Ihre Angaben zur Immobilie
                    verarbeitet, um eine automatisierte Bewertung zu erstellen.
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Anbieter:</strong> OpenAI Inc., 3180 18th Street,
                    San Francisco, California 94110, USA
                    <br />
                    <strong>Datenschutz:</strong>{" "}
                    <a
                      href="https://openai.com/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      https://openai.com/privacy/
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                7. Cookies und Tracking
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Unsere Website verwendet Cookies und ähnliche Technologien.
                  Cookies sind kleine Textdateien, die auf Ihrem Endgerät
                  gespeichert werden.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    7.1 Erforderliche Cookies
                  </h3>
                  <p className="text-gray-700">
                    Diese Cookies sind für das Funktionieren der Website
                    unbedingt erforderlich und können nicht deaktiviert werden.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    7.2 Funktionale Cookies
                  </h3>
                  <p className="text-gray-700">
                    Diese Cookies ermöglichen es uns, Ihre Präferenzen zu
                    speichern und Ihnen personalisierten Content anzubieten.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    7.3 Cookie-Einstellungen
                  </h3>
                  <p className="text-gray-700">
                    Sie können Ihre Cookie-Präferenzen jederzeit über unsere
                    Cookie-Einstellungen anpassen oder in Ihren
                    Browser-Einstellungen verwalten.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                8. Ihre Rechte
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Sie haben folgende Rechte bezüglich Ihrer personenbezogenen
                  Daten:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>
                    <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können
                    Auskunft über die von uns verarbeiteten personenbezogenen
                    Daten verlangen
                  </li>
                  <li>
                    <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie
                    können die Berichtigung unrichtiger Daten verlangen
                  </li>
                  <li>
                    <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können
                    die Löschung Ihrer Daten verlangen
                  </li>
                  <li>
                    <strong>
                      Einschränkung der Verarbeitung (Art. 18 DSGVO):
                    </strong>{" "}
                    Sie können eine Einschränkung der Verarbeitung verlangen
                  </li>
                  <li>
                    <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie
                    können Ihre Daten in einem strukturierten Format erhalten
                  </li>
                  <li>
                    <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie
                    können der Verarbeitung aus besonderen Gründen widersprechen
                  </li>
                  <li>
                    <strong>Widerruf der Einwilligung:</strong> Sie können eine
                    erteilte Einwilligung jederzeit widerrufen
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                9. Datenspeicherung und -löschung
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Wir speichern Ihre personenbezogenen Daten nur so lange, wie
                  es für die jeweiligen Zwecke erforderlich ist oder gesetzliche
                  Aufbewahrungsfristen bestehen.
                </p>

                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>
                    Kontaktanfragen und Immobilienbewertungen: 3 Jahre nach
                    letztem Kontakt
                  </li>
                  <li>Newsletter-Daten: Bis zum Widerruf der Einwilligung</li>
                  <li>
                    Vertragsrelevante Daten: 10 Jahre (steuerrechtliche
                    Aufbewahrungspflicht)
                  </li>
                  <li>Technische Daten (Logfiles): Maximal 14 Tage</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                10. Datensicherheit
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Wir treffen angemessene technische und organisatorische
                  Maßnahmen zum Schutz Ihrer personenbezogenen Daten vor
                  unbefugtem Zugriff, Verlust oder Missbrauch.
                </p>

                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>SSL-Verschlüsselung der Website</li>
                  <li>Sichere Server-Infrastruktur</li>
                  <li>Regelmäßige Sicherheitsupdates</li>
                  <li>Zugriffsbeschränkungen für Mitarbeiter</li>
                  <li>
                    Datenschutz durch Technikgestaltung und
                    datenschutzfreundliche Voreinstellungen
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                11. Beschwerderecht
              </h2>

              <p className="text-gray-700">
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
                über die Verarbeitung Ihrer personenbezogenen Daten zu
                beschweren:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>
                    Landesbeauftragte für den Datenschutz und die
                    Informationsfreiheit Baden-Württemberg
                  </strong>
                  <br />
                  Postfach 10 29 32
                  <br />
                  70025 Stuttgart
                  <br />
                  <strong>E-Mail:</strong>{" "}
                  <a
                    href="mailto:poststelle@lfdi.bwl.de"
                    className="text-[var(--arctic-blue)] hover:underline"
                  >
                    poststelle@lfdi.bwl.de
                  </a>
                  <br />
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://www.baden-wuerttemberg.datenschutz.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--arctic-blue)] hover:underline"
                  >
                    https://www.baden-wuerttemberg.datenschutz.de
                  </a>
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center pt-8 border-t border-gray-200">
              <p>Stand: {new Date().toLocaleDateString("de-DE")}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
