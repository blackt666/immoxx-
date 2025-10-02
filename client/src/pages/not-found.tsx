import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundColor: "#f9fafb",
        color: "#111827",
        padding: "20px",
      }}
    >
      <Card
        className="w-full max-w-md mx-4"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent className="pt-6" style={{ padding: "24px" }}>
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8" style={{ color: "#ef4444" }} />
            <h1
              className="text-2xl font-bold"
              style={{
                color: "#111827",
                fontSize: "24px",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              404 - Seite nicht gefunden
            </h1>
          </div>

          <p
            className="mt-4 text-sm"
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginTop: "16px",
            }}
          >
            Die angeforderte Seite{" "}
            <code
              style={{
                backgroundColor: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
              }}
            >
              {location}
            </code>{" "}
            existiert nicht.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <Home className="w-4 h-4" />
              Zur Startseite
            </Button>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "16px",
              }}
            >
              <p style={{ margin: "0 0 8px 0" }}>Verfügbare Seiten:</p>
              <ul
                style={{ margin: 0, padding: "0 0 0 16px", listStyle: "disc" }}
              >
                <li>/ - Startseite</li>
                <li>/properties - Immobilien</li>
                <li>/ai-valuation - AI-Bewertung</li>
                <li>/admin - Admin Dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
