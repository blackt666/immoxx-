import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Share2,
  MessageCircle,
  Send,
  Mail,
  Link2,
  Copy,
  X,
} from "lucide-react";

interface SharePropertyProps {
  property: {
    id: string;
    title: string;
    price: string;
    location: string;
    description?: string;
  };
  trigger?: React.ReactNode;
}

export function ShareProperty({ property, trigger }: SharePropertyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const propertyUrl = `${window.location.origin}/property/${property.id}`;
  const shareTitle = `${property.title} - ${property.location}`;
  const shareText = `Schau dir diese tolle Immobilie an: ${shareTitle}\n\n${property.description?.substring(0, 150)}${property.description && property.description.length > 150 ? "..." : ""}\n\nPreis: ${property.price}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      toast({
        title: "Link kopiert!",
        description: "Der Link wurde in die Zwischenablage kopiert.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Fehler beim Kopieren:", error);
      toast({
        title: "Fehler",
        description: "Der Link konnte nicht kopiert werden.",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + propertyUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Immobilie: ${shareTitle}`);
    const body = encodeURIComponent(
      `${shareText}\n\nZur Immobilie: ${propertyUrl}\n\nViele Grüße`,
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const shareViaNavigator = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: propertyUrl,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Fehler beim Teilen:", error);
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      onClick: shareViaWhatsApp,
      color: "text-green-600 hover:bg-green-50",
      description: "Per WhatsApp teilen",
    },
    {
      name: "Telegram",
      icon: Send,
      onClick: shareViaTelegram,
      color: "text-blue-500 hover:bg-blue-50",
      description: "Per Telegram teilen",
    },
    {
      name: "E-Mail",
      icon: Mail,
      onClick: shareViaEmail,
      color: "text-gray-600 hover:bg-gray-50",
      description: "Per E-Mail teilen",
    },
    {
      name: "Link kopieren",
      icon: copied ? Copy : Link2,
      onClick: copyToClipboard,
      color: copied
        ? "text-green-600 hover:bg-green-50"
        : "text-[var(--arctic-blue)] hover:bg-blue-50",
      description: copied ? "Link kopiert!" : "Link in Zwischenablage kopieren",
    },
  ];

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Teilen
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[var(--arctic-blue)]" />
              Immobilie teilen
            </DialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              <p className="font-medium">{property.title}</p>
              <p className="text-gray-500">
                {property.location} • {property.price}
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Native Share API (falls verfügbar) */}
            {'share' in navigator && typeof navigator.share === 'function' && (
              <Button
                onClick={shareViaNavigator}
                className="w-full justify-start bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 text-white"
              >
                <Share2 className="w-5 h-5 mr-3" />
                Teilen...
              </Button>
            )}

            {/* Teilen-Optionen */}
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.name}
                    variant="outline"
                    onClick={option.onClick}
                    className={`h-20 flex-col gap-2 ${option.color} transition-all duration-200`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-sm font-medium">{option.name}</span>
                  </Button>
                );
              })}
            </div>

            {/* URL Anzeige */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Link zur Immobilie
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={propertyUrl}
                  readOnly
                  className="flex-1 text-sm bg-white border rounded px-3 py-2 text-gray-600 select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className={copied ? "text-green-600 border-green-300" : ""}
                >
                  {copied ? (
                    <Copy className="w-4 h-4" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ShareProperty;
