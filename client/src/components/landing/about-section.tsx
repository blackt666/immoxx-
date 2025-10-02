
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Mail, MapPin, Award, Users, TrendingUp } from "lucide-react";

export default function AboutSection() {
  const { t } = useLanguage();
  
  return (
    <section id="about-section" className="py-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Profile Image & Info */}
          <div className="space-y-8">
            <div className="relative mx-auto lg:mx-0 w-80">
              <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/uploads/manfred-mueller-professional.png"
                  alt="Manfred Müller - Immobilienmakler"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Badge Overlay - Repositioned to bottom-right corner */}
              <div className="absolute bottom-2 right-2 p-3 rounded-xl shadow-lg" 
                   style={{backgroundColor: '#65858C'}}>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">20+</div>
                  <div className="text-xs text-white">{t('about.experience')}</div>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('about.contact.title')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[var(--ruskin-blue)]" />
                    <span className="text-gray-700">+49-7541-371648</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-[var(--ruskin-blue)]" />
                    <span className="text-gray-700">mueller@bimm-fn.de</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[var(--ruskin-blue)]" />
                    <span className="text-gray-700">Seewiesenstraße 31/6, 88046 Friedrichshafen</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90">
                  {t('about.contact.appointment')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-blue-100 text-[var(--ruskin-blue)] px-4 py-2">
                {t('about.badge')}
              </Badge>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-center lg:text-left" 
                  style={{color: '#566873'}}>
                {t('about.name')}
              </h2>
              
              <h3 className="text-xl text-[var(--ruskin-blue)] font-semibold">
                {t('about.subtitle')}
              </h3>
            </div>

            <div className="prose prose-lg text-gray-700 space-y-4">
              <p dangerouslySetInnerHTML={{ __html: t('about.intro') }} />
              
              <p>{t('about.support')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-2 bg-[var(--ruskin-blue)] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">3000+</div>
                <div className="text-sm text-gray-600">{t('about.stats.customers')}</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-2 bg-[var(--ruskin-blue)] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">{t('about.stats.success')}</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-2 bg-[var(--ruskin-blue)] rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">80+</div>
                <div className="text-sm text-gray-600">{t('about.stats.sold')}</div>
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('about.qualifications.title')}</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{t('about.qualifications.broker')}</Badge>
                <Badge variant="outline">{t('about.qualifications.ihk')}</Badge>
                <Badge variant="outline">{t('about.qualifications.valuation')}</Badge>
                <Badge variant="outline">{t('about.qualifications.specialist')}</Badge>
              </div>
            </div>

            {/* Opening Hours */}
            <Card className="bg-gray-50 border-0">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t('about.hours.title')}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('about.hours.weekdays')}</span>
                    <span>{t('about.hours.weekdays.value')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('about.hours.saturday')}</span>
                    <span>{t('about.hours.saturday.value')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('about.hours.sunday')}</span>
                    <span>{t('about.hours.sunday.value')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
