import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { useAuth } from "@/lib/auth"; // REMOVED - causing AuthProvider conflicts
import {
  Building2,
  MessageSquare,
  Image,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  // const { user, isLoading } = useAuth(); // REMOVED - causing conflicts
  const user = { username: "Admin" }; // Static fallback

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bodensee Immobilien
            </h1>
            <p className="text-sm text-gray-600">
              Willkommen, {user?.username || "User"}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/api/logout")}
              data-testid="button-logout"
            >
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/properties">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Building2 className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Immobilien</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Immobilienangebote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" data-testid="button-properties">
                  Immobilien verwalten
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/inquiries">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Anfragen</CardTitle>
                <CardDescription>Bearbeiten Sie Kundenanfragen</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  data-testid="button-inquiries"
                >
                  Anfragen anzeigen
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/gallery">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Image className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Bildergalerie</CardTitle>
                <CardDescription>Verwalten Sie Ihre Bilder</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  data-testid="button-gallery"
                >
                  Galerie öffnen
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle>Analysen</CardTitle>
                <CardDescription>Statistiken und Berichte</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  data-testid="button-analytics"
                >
                  Analysen anzeigen
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/content">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                <CardTitle>Inhalte</CardTitle>
                <CardDescription>Website-Inhalte bearbeiten</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  data-testid="button-content"
                >
                  Inhalte verwalten
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Settings className="w-8 h-8 text-gray-600 mb-2" />
                <CardTitle>Einstellungen</CardTitle>
                <CardDescription>System-Einstellungen</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  data-testid="button-settings"
                >
                  Einstellungen
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
