import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/landing/navigation";
import Footer from "@/components/landing/footer";

export default function Widerrufsrecht() {
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
              Widerrufsrecht
            </h1>
            <p className="text-lg text-gray-600">
              Informationen zu Ihrem Widerrufsrecht bei Verbraucherverträgen
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Widerrufsbelehrung
              </h2>

              <div className="space-y-4">
                <div className="bg-[var(--arctic-blue)]/5 border-l-4 border-[var(--arctic-blue)] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Widerrufsrecht
                  </h3>
                  <p className="text-gray-700">
                    Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von
                    Gründen diesen Vertrag zu widerrufen.
                  </p>
                </div>

                <p className="text-gray-700">
                  Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
                  Vertragsabschlusses.
                </p>

                <p className="text-gray-700">
                  Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
                </p>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-gray-700">
                    <strong>Bodensee Immobilien Manfred Müller</strong>
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
                    <strong>E-Mail:</strong>{" "}
                    <a
                      href="mailto:mueller@bimm-fn.de"
                      className="text-[var(--arctic-blue)] hover:underline"
                    >
                      mueller@bimm-fn.de
                    </a>
                  </p>
                </div>

                <p className="text-gray-700">
                  mittels einer eindeutigen Erklärung (z.B. ein mit der Post
                  versandter Brief, Telefax oder E-Mail) über Ihren Entschluss,
                  diesen Vertrag zu widerrufen, informieren. Sie können dafür
                  das beigefügte Muster-Widerrufsformular verwenden, das jedoch
                  nicht vorgeschrieben ist.
                </p>

                <p className="text-gray-700">
                  Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
                  Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf
                  der Widerrufsfrist absenden.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Folgen des Widerrufs
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle
                  Zahlungen, die wir von Ihnen erhalten haben, einschließlich
                  der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die
                  sich daraus ergeben, dass Sie eine andere Art der Lieferung
                  als die von uns angebotene, günstigste Standardlieferung
                  gewählt haben), unverzüglich und spätestens binnen vierzehn
                  Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
                  Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
                </p>

                <p className="text-gray-700">
                  Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel,
                  das Sie bei der ursprünglichen Transaktion eingesetzt haben,
                  es sei denn, mit Ihnen wurde ausdrücklich etwas anderes
                  vereinbart; in keinem Fall werden Ihnen wegen dieser
                  Rückzahlung Entgelte berechnet.
                </p>

                <p className="text-gray-700">
                  Haben Sie verlangt, dass die Dienstleistungen während der
                  Widerrufsfrist beginnen soll, so haben Sie uns einen
                  angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
                  Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts
                  hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
                  Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag
                  vorgesehenen Dienstleistungen entspricht.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Besonderheiten bei Immobilienmaklerverträgen
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Ausschluss des Widerrufsrechts
                  </h3>
                  <p className="text-gray-700">
                    Das Widerrufsrecht besteht nicht bei Verträgen:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>
                      die nicht im Fernabsatz oder außerhalb von Geschäftsräumen
                      geschlossen wurden
                    </li>
                    <li>bei denen Sie als Unternehmer handeln</li>
                    <li>
                      zur Erbringung von Dienstleistungen, wenn der Unternehmer
                      diese vollständig erbracht hat und mit der Ausführung der
                      Dienstleistung erst begonnen hat, nachdem Sie dazu Ihre
                      ausdrückliche Zustimmung gegeben haben und gleichzeitig
                      Ihre Kenntnis davon bestätigt haben, dass Sie Ihr
                      Widerrufsrecht bei vollständiger Vertragserfüllung durch
                      den Unternehmer verlieren
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Vorzeitiges Erlöschen des Widerrufsrechts
                  </h3>
                  <p className="text-gray-700">
                    Ihr Widerrufsrecht erlischt vorzeitig, wenn:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>
                      Sie ausdrücklich zugestimmt haben, dass wir vor Ende der
                      Widerrufsfrist mit der Ausführung der Dienstleistung
                      beginnen
                    </li>
                    <li>
                      Sie zur Kenntnis genommen haben, dass Sie durch Ihre
                      Zustimmung zum vorzeitigen Beginn der Dienstleistung Ihr
                      Widerrufsrecht verlieren, sobald wir die Dienstleistung
                      vollständig erbracht haben
                    </li>
                    <li>wir die Dienstleistung vollständig erbracht haben</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Praktische Anwendung
                  </h3>
                  <p className="text-gray-700">
                    Bei Immobilienmaklerverträgen bedeutet dies konkret:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>
                      Beginnen wir vor Ablauf der Widerrufsfrist mit der
                      Vermarktung Ihrer Immobilie, erlischt das Widerrufsrecht
                      bei vollständiger Erbringung unserer Leistung
                    </li>
                    <li>
                      Die vollständige Erbringung liegt vor, wenn ein notariell
                      beurkundeter Kaufvertrag zustande gekommen ist
                    </li>
                    <li>
                      Bis zu diesem Zeitpunkt können Sie anteilige Kosten für
                      bereits erbrachte Teilleistungen schulden
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Muster-Widerrufsformular
              </h2>

              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  <em>
                    Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie
                    bitte dieses Formular aus und senden Sie es zurück:
                  </em>
                </p>

                <div className="border border-gray-300 p-6 bg-white rounded">
                  <p className="text-gray-700 mb-4">
                    <strong>An:</strong>
                    <br />
                    Bodensee Immobilien Manfred Müller
                    <br />
                    Seewiesenstr. 31/6
                    <br />
                    88048 Friedrichshafen
                    <br />
                    E-Mail: mueller@bimm-fn.de
                  </p>

                  <p className="text-gray-700 mb-4">
                    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
                    abgeschlossenen Vertrag über den Kauf der folgenden Waren
                    (*)/die Erbringung der folgenden Dienstleistung (*)
                  </p>

                  <div className="space-y-4 text-gray-700">
                    <p>
                      Bestellt am (*)/erhalten am (*): ________________________
                    </p>
                    <p>Name des/der Verbraucher(s): ________________________</p>
                    <p>
                      Anschrift des/der Verbraucher(s): ________________________
                    </p>
                    <p>________________________</p>
                    <p>________________________</p>
                    <p>
                      Unterschrift des/der Verbraucher(s) (nur bei Mitteilung
                      auf Papier): ________________________
                    </p>
                    <p>Datum: ________________________</p>
                  </div>

                  <p className="text-sm text-gray-600 mt-4">
                    <em>(*) Unzutreffendes streichen.</em>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Hinweise zur Ausübung des Widerrufsrechts
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Widerrufserklärung
                  </h3>
                  <p className="text-gray-700">
                    Die Widerrufserklärung muss eindeutig sein. Sie können:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>
                      Das oben stehende Muster-Widerrufsformular verwenden
                    </li>
                    <li>Eine andere eindeutige Erklärung abgeben</li>
                    <li>
                      Die Erklärung schriftlich, per E-Mail, Fax oder
                      telefonisch abgeben
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Fristwahrung
                  </h3>
                  <p className="text-gray-700">
                    Entscheidend für die Fristwahrung ist der Eingang der
                    Widerrufserklärung bei uns, nicht das Absendedatum. Wir
                    empfehlen daher:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                    <li>E-Mail für schnelle Übermittlung</li>
                    <li>Einschreiben bei Postversand</li>
                    <li>Fax mit Sendebestätigung</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Beratung
                  </h3>
                  <p className="text-gray-700">
                    Bei Fragen zum Widerrufsrecht stehen wir Ihnen gerne zur
                    Verfügung:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mt-3">
                    <p className="text-gray-700">
                      <strong>Telefon:</strong> 07541 / 371648
                      <br />
                      <strong>E-Mail:</strong>{" "}
                      <a
                        href="mailto:mueller@bimm-fn.de"
                        className="text-[var(--arctic-blue)] hover:underline"
                      >
                        mueller@bimm-fn.de
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Rechtliche Grundlagen
              </h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Das Widerrufsrecht bei Verbraucherverträgen ist in folgenden
                  Gesetzen geregelt:
                </p>

                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>§§ 312g, 355 ff. BGB (Bürgerliches Gesetzbuch)</li>
                  <li>§§ 312b ff. BGB (Fernabsatzverträge)</li>
                  <li>
                    §§ 312c ff. BGB (Außerhalb von Geschäftsräumen geschlossene
                    Verträge)
                  </li>
                  <li>
                    Art. 246a § 1 EGBGB (Informations- und Nachweispflichten)
                  </li>
                </ul>

                <p className="text-gray-700 mt-4">
                  Diese Bestimmungen dienen dem Verbraucherschutz und sollen
                  faire Geschäftsbeziehungen gewährleisten.
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
