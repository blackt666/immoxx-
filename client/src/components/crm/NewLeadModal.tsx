import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface NewLeadData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  property_type?: string;
  preferred_location?: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
}

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewLeadData) => Promise<void>;
}

export function NewLeadModal({ open, onClose, onSubmit }: NewLeadModalProps) {
  const [formData, setFormData] = useState<NewLeadData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'website',
    property_type: '',
    preferred_location: '',
    budget_min: undefined,
    budget_max: undefined,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Vorname ist erforderlich';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Nachname ist erforderlich';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'website',
        property_type: '',
        preferred_location: '',
        budget_min: undefined,
        budget_max: undefined,
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--bodensee-deep)' }}>
            ➕ Neuer Lead
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Lead im CRM-System
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Persönliche Daten */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--bodensee-deep)' }}>Persönliche Daten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Vorname *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <Label htmlFor="last_name">Nachname *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 160 1234567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source">Quelle</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="phone">Telefon</SelectItem>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="referral">Empfehlung</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Immobilien-Präferenzen */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--bodensee-deep)' }}>Immobilien-Präferenzen</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_type">Immobilientyp</Label>
                <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wohnung">Wohnung</SelectItem>
                    <SelectItem value="Haus">Haus</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                    <SelectItem value="Grundstück">Grundstück</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferred_location">Bevorzugter Standort</Label>
                <Input
                  id="preferred_location"
                  value={formData.preferred_location}
                  onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                  placeholder="z.B. Konstanz"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">Budget von (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="300000"
                />
              </div>

              <div>
                <Label htmlFor="budget_max">Budget bis (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: 'var(--bodensee-water)', color: 'white' }}>
              {isSubmitting ? 'Wird erstellt...' : '✓ Lead erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
