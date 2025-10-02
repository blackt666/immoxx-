import { useState } from 'react';
import { usePropertyValuation } from '../hooks/useDeepSeek';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function PropertyValuationAI() {
  const [formData, setFormData] = useState({
    address: '',
    propertyType: 'Wohnung',
    size: '',
    rooms: '',
    yearBuilt: '',
    condition: 'gut',
    features: [] as string[],
    city: 'Konstanz',
    region: 'Bodensee',
  });

  const { mutate: valuateProperty, data: valuation, isPending, error } = usePropertyValuation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    valuateProperty({
      address: formData.address,
      propertyType: formData.propertyType,
      size: parseInt(formData.size),
      rooms: parseInt(formData.rooms),
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
      condition: formData.condition,
      features: formData.features,
      location: {
        city: formData.city,
        region: formData.region,
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      low: { variant: 'secondary' as const, label: 'Niedrig' },
      medium: { variant: 'default' as const, label: 'Mittel' },
      high: { variant: 'default' as const, label: 'Hoch' },
    };
    return variants[confidence as keyof typeof variants];
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KI-Immobilienbewertung</CardTitle>
          <CardDescription>
            Erhalten Sie eine AI-gestützte Bewertung Ihrer Immobilie mit DeepSeek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="z.B. Seestraße 15, 78464 Konstanz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Immobilientyp *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wohnung">Wohnung</SelectItem>
                    <SelectItem value="Haus">Haus</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Grundstück">Grundstück</SelectItem>
                    <SelectItem value="Gewerbe">Gewerbe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Wohnfläche (m²) *</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="z.B. 120"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms">Zimmer *</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  placeholder="z.B. 3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Baujahr</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  placeholder="z.B. 2015"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Zustand</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuwertig">Neuwertig</SelectItem>
                    <SelectItem value="sehr gut">Sehr gut</SelectItem>
                    <SelectItem value="gut">Gut</SelectItem>
                    <SelectItem value="renovierungsbedürftig">Renovierungsbedürftig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="z.B. Konstanz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="z.B. Bodensee"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Bewertung läuft...' : 'Immobilie bewerten'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Fehler bei der Bewertung: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {valuation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Geschätzter Immobilienwert
                <Badge {...getConfidenceBadge(valuation.confidence)}>
                  Vertrauen: {getConfidenceBadge(valuation.confidence).label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Minimum</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(valuation.estimatedValue.min)}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <p className="text-sm text-gray-600">Durchschnitt</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(valuation.estimatedValue.average)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Maximum</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(valuation.estimatedValue.max)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Positive Faktoren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {valuation.factors.positive.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Negative Faktoren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {valuation.factors.negative.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 text-xs">!</span>
                      </div>
                      <span className="text-sm">{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Marktanalyse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {valuation.marketAnalysis}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empfehlungen</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {valuation.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              Erstellt am: {new Date(valuation.timestamp).toLocaleString('de-DE')}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
