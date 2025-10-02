
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare,
  User,
  Home,
  Filter,
  Download,
  Eye
} from 'lucide-react';

export default function InquiriesSources() {
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['/api/inquiries', selectedSource],
    queryFn: () => {
      const params = selectedSource !== 'all' ? `?source=${selectedSource}` : '';
      return fetch(`/api/inquiries${params}`).then(res => res.json());
    }
  });

  const sources = [
    { key: 'ai_valuation', label: 'AI-Bewertung', icon: Bot, color: 'bg-purple-100 text-purple-800' },
    { key: 'contact_form', label: 'Kontaktformular', icon: Mail, color: 'bg-blue-100 text-blue-800' },
    { key: 'phone_call', label: 'Telefonanruf', icon: Phone, color: 'bg-green-100 text-green-800' },
    { key: 'property_inquiry', label: 'Immobilien-Anfrage', icon: Home, color: 'bg-orange-100 text-orange-800' },
    { key: 'appointment', label: 'Terminanfrage', icon: Calendar, color: 'bg-indigo-100 text-indigo-800' },
    { key: 'other', label: 'Sonstige', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anfragen nach Quelle</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Anfragen getrennt nach Herkunftsquelle
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV Export
        </Button>
      </div>

      {/* Source Filter Tabs */}
      <Tabs value={selectedSource} onValueChange={setSelectedSource} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Alle</TabsTrigger>
          {sources.map(source => (
            <TabsTrigger key={source.key} value={source.key}>
              <source.icon className="w-4 h-4 mr-2" />
              {source.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
            {sources.map(source => {
              const count = inquiries?.filter((inq: any) => inq.source === source.key)?.length || 0;
              return (
                <Card key={source.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <source.icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{source.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {sources.map(source => (
          <TabsContent key={source.key} value={source.key}>
            <div className="space-y-4">
              {inquiries
                ?.filter((inq: any) => inq.source === source.key)
                ?.map((inquiry: any) => (
                  <Card key={inquiry.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <source.icon className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">{inquiry.name}</h3>
                            <Badge className={source.color}>
                              {source.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{inquiry.email}</span>
                            </div>
                            {inquiry.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{inquiry.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(inquiry.createdAt).toLocaleDateString('de-DE')}</span>
                            </div>
                          </div>
                          
                          {inquiry.message && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-md">
                              <p className="text-sm text-muted-foreground">{inquiry.message}</p>
                            </div>
                          )}
                        </div>
                        
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
