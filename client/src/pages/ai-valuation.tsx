import AIValuationTool from "@/components/landing/ai-valuation-tool";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AIValuationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,70%,50%)]/5 via-white to-[hsl(185,60%,45%)]/5">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(210,70%,50%)] to-[hsl(185,60%,45%)] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
          <div className="text-center px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              AI-Immobilienbewertung
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto px-2">
              Revolutionäre KI-Technologie für präzise Immobilienbewertungen in
              der Bodenseeregion
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIValuationTool />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Warum unsere AI-Bewertung?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modernste Technologie kombiniert mit lokaler Marktexpertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[var(--arctic-blue)]/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--arctic-blue)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Präzise Analyse
              </h3>
              <p className="text-gray-600">
                Berücksichtigung von über 50 Faktoren für maximale
                Bewertungsgenauigkeit
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[var(--bermuda-sand)]/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--ruskin-blue)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sofortiges Ergebnis
              </h3>
              <p className="text-gray-600">
                Bewertung in wenigen Sekunden statt Tagen oder Wochen
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[var(--ruskin-blue)]/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--ruskin-blue)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lokale Expertise
              </h3>
              <p className="text-gray-600">
                Speziell für die Bodenseeregion entwickelt und optimiert
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
