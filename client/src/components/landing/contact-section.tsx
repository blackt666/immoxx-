import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Mail, MapPin, Clock, Send, User, Calendar, Home, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactSection() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const requiredFields = ["name", "email", "subject", "message"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData],
    );

    if (missingFields.length > 0) {
      toast({
        title: t('contact.toast.missing.title'),
        description: t('contact.toast.missing.description'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Here you would normally send to your API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      toast({
        title: t('contact.toast.success.title'),
        description: t('contact.toast.success.description'),
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: t('contact.toast.error.title'),
        description: t('contact.toast.error.description'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      type: "phone",
      title: t('contact.info.phone'),
      details: ["07541 / 371648", "0160 / 8066630"],
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      icon: Mail,
      type: "email",
      title: t('contact.info.email'),
      details: ["mueller@bimm-fn.de"],
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: MapPin,
      type: "address",
      title: t('contact.info.address'),
      details: ["Seewiesenstraße 31/6", "88046 Friedrichshafen"],
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      icon: Clock,
      type: "hours",
      title: t('contact.info.hours'),
      details: [t('contact.info.hours.weekdays'), t('contact.info.hours.saturday')],
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <section
      id="contact"
      className="py-12 bg-gradient-to-br from-[var(--ruskin-blue)]/10 via-[var(--arctic-blue)]/10 to-[var(--bermuda-sand)]/20"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Human Consultation Focus */}
        <div
          className={`text-center mb-16 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Service Type Indicator */}
          <div className="inline-flex items-center space-x-2 bg-orange-100 rounded-full px-6 py-3 text-sm font-medium text-orange-800 mb-6">
            <User className="w-5 h-5" />
            <span>{t('contact.human.title', '👤 Persönliche Beratung')}</span>
            <Calendar className="w-4 h-4" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('contact.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t('contact.subtitle')}
          </p>
          
          {/* Human Service Benefits */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <Home className="w-4 h-4 text-blue-500" />
              <span>Vor-Ort-Termine</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <Star className="w-4 h-4 text-green-500" />
              <span>20+ Jahre Erfahrung</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <User className="w-4 h-4 text-purple-500" />
              <span>Persönliche Betreuung</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card
                  key={info.title}
                  className={`group hover:shadow-lg transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 transform hover:-translate-y-1 ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`${info.bg} p-3 rounded-xl`}>
                        <Icon className={`w-6 h-6 ${info.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[var(--arctic-blue)] transition-colors">
                          {info.title}
                        </h3>
                        {info.details.map((detail, detailIndex) => {
                          // Special handling for phone and email to make them clickable
                          if (info.type === "phone") {
                            return (
                              <p
                                key={detailIndex}
                                className="text-gray-600 text-sm"
                              >
                                <a
                                  href={`tel:${detail.replace(/[^0-9+]/g, "")}`}
                                  className="hover:text-[var(--arctic-blue)] transition-colors"
                                >
                                  {detail}
                                </a>
                              </p>
                            );
                          } else if (info.type === "email") {
                            return (
                              <p
                                key={detailIndex}
                                className="text-gray-600 text-sm"
                              >
                                <a
                                  href={`mailto:${detail}`}
                                  className="hover:text-[var(--arctic-blue)] transition-colors"
                                >
                                  {detail}
                                </a>
                              </p>
                            );
                          }
                          // For other details like address and hours, display as is
                          return (
                            <p
                              key={detailIndex}
                              className="text-gray-600 text-sm"
                            >
                              {detail}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card
              className={`shadow-2xl border-0 bg-white/90 backdrop-blur-sm transform transition-all duration-700 delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t('contact.form.title')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('contact.human.subtitle', 'Individuelle Betreuung • Terminvereinbarung • Vor-Ort-Service')}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-semibold flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span>{t('contact.form.name')}</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder={t('contact.form.name.placeholder')}
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="h-12"
                        data-testid="input-contact-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-base font-semibold flex items-center space-x-2"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span>{t('contact.form.email')}</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('contact.form.email.placeholder')}
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="h-12"
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="subject"
                      className="text-base font-semibold flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span>{t('contact.form.subject')}</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder={t('contact.form.subject.placeholder')}
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      className="h-12"
                      data-testid="input-contact-subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-base font-semibold flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4 text-gray-600" />
                      <span>{t('contact.form.message')}</span>
                    </Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder={t('contact.form.consultation.placeholder', 'Beschreiben Sie Ihr Anliegen oder gewünschte Leistungen...')}
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      className="resize-none"
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-white text-[var(--ruskin-blue)] hover:bg-gray-50 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[var(--ruskin-blue)] mr-1 sm:mr-2"></div>
                        <span className="text-xs sm:text-base">
{t('contact.form.sending')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-base">
{t('contact.form.submit')}
                        </span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
