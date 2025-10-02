
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bot, Mail, Phone, Users } from 'lucide-react';

interface InquirySource {
  id: string;
  type: 'ai-valuation' | 'contact-form' | 'phone' | 'email' | 'chat';
  title: string;
  count: number;
  lastActivity: string;
  status: 'active' | 'pending' | 'resolved';
}

export default function InquirySources() {
  const [sources] = useState<InquirySource[]>([
    {
      id: '1',
      type: 'ai-valuation',
      title: 'AI Immobilienbewertung',
      count: 23,
      lastActivity: '2 Min. ago',
      status: 'pending'
    },
    {
      id: '2',
      type: 'contact-form',
      title: 'Direktes Kontaktformular',
      count: 15,
      lastActivity: '5 Min. ago',
      status: 'active'
    },
    {
      id: '3',
      type: 'phone',
      title: 'Telefonanrufe',
      count: 8,
      lastActivity: '1 Std. ago',
      status: 'resolved'
    }
  ]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'ai-valuation': return <Bot className="w-4 h-4" />;
      case 'contact-form': return <MessageSquare className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Anfrage-Quellen</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="ai-valuation">AI Bewertungen</TabsTrigger>
          <TabsTrigger value="contact-form">Kontaktformular</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map(source => (
              <Card key={source.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getSourceIcon(source.type)}
                    {source.title}
                  </CardTitle>
                  <Badge variant={source.status === 'pending' ? 'destructive' : 'default'}>
                    {source.count}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Letzte Aktivität: {source.lastActivity}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 w-full">
                    Details anzeigen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-valuation">
          <Card>
            <CardHeader>
              <CardTitle>AI Bewertungs-Anfragen</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Hier werden alle Anfragen aus der AI Immobilienbewertung verwaltet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact-form">
          <Card>
            <CardHeader>
              <CardTitle>Direktkontakt-Anfragen</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Hier werden alle direkten Kontaktformular-Anfragen verwaltet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
