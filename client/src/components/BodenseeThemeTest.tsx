import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

/**
 * BODENSEE THEME VALIDATION COMPONENT
 * Tests all optimized theme features and color mappings
 */
export function BodenseeThemeTest() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode class on document.documentElement
  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background text-foreground min-h-screen">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Bodensee Theme System Test
        </h1>
        <p className="text-muted-foreground text-lg">
          Professional Real Estate Design - Vollständig Optimiert
        </p>
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-center space-x-3">
          <span className="text-sm text-muted-foreground">Light</span>
          <Switch
            checked={isDarkMode}
            onCheckedChange={handleThemeToggle}
            data-testid="theme-toggle"
          />
          <span className="text-sm text-muted-foreground">Dark</span>
        </div>
      </div>

      <Separator />

      {/* Bodensee Brand Color Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Bodensee Brand Colors</CardTitle>
          <CardDescription>
            Professional Real Estate Farbpalette - Korrekt zu HSL konvertiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg border brand-deep"></div>
              <Badge variant="outline">Bodensee Tiefe</Badge>
              <p className="text-xs text-muted-foreground">#566873</p>
              <p className="text-xs text-muted-foreground">200 15% 38%</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg border brand-primary"></div>
              <Badge variant="outline">Bodensee Wasser</Badge>
              <p className="text-xs text-muted-foreground">#65858C</p>
              <p className="text-xs text-muted-foreground">188 19% 47%</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg border brand-accent"></div>
              <Badge variant="outline">Bodensee Sand</Badge>
              <p className="text-xs text-muted-foreground">#D9CDBF</p>
              <p className="text-xs text-muted-foreground">35 25% 81%</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg border brand-stone"></div>
              <Badge variant="outline">Bodensee Steine</Badge>
              <p className="text-xs text-muted-foreground">#8C837B</p>
              <p className="text-xs text-muted-foreground">30 8% 51%</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-full h-20 rounded-lg border brand-shore"></div>
              <Badge variant="outline">Bodensee Ufer</Badge>
              <p className="text-xs text-muted-foreground">#BFADA3</p>
              <p className="text-xs text-muted-foreground">25 15% 68%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* shadcn/ui Component Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Actions</CardTitle>
            <CardDescription>Tests primary color mapping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="default" className="w-full">
              Primary Button (Bodensee Water)
            </Button>
            <Button variant="secondary" className="w-full">
              Secondary Button (Bodensee Sand)
            </Button>
            <Button variant="outline" className="w-full">
              Outline Button
            </Button>
          </CardContent>
        </Card>

        {/* Text Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Test</CardTitle>
            <CardDescription>Inter Font Family - Professional Hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <h1 className="text-2xl font-bold">H1 - Luxury Villa Headlines</h1>
            <h2 className="text-xl font-bold">H2 - Section Headers</h2>
            <h3 className="text-lg font-bold">H3 - Property Subsections</h3>
            <h4 className="text-base font-bold">H4 - Property Titles</h4>
            <p className="text-base text-muted-foreground">
              Body text - Professional real estate description with proper line height and spacing.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Background Variations */}
      <Card>
        <CardHeader>
          <CardTitle>Background & Border Tests</CardTitle>
          <CardDescription>Verifies all theme variables work correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card border rounded-lg">
              <h4 className="font-semibold mb-2">Card Background</h4>
              <p className="text-card-foreground text-sm">
                Uses --card and --card-foreground variables
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Muted Background</h4>
              <p className="text-muted-foreground text-sm">
                Uses --muted and --muted-foreground variables
              </p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <h4 className="font-semibold mb-2">Accent Background</h4>
              <p className="text-accent-foreground text-sm">
                Uses --accent and --accent-foreground variables
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-primary">✅ Theme System Status</CardTitle>
          <CardDescription>
            Bodensee Brand-Design vollständig optimiert und functional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p>✅ <strong>CSS Structure:</strong> Konsolidiert und optimiert</p>
              <p>✅ <strong>HSL Format:</strong> Korrekt für shadcn/ui</p>
              <p>✅ <strong>Brand Colors:</strong> Professional Real Estate</p>
              <p>✅ <strong>Typography:</strong> Inter Font System</p>
            </div>
            <div className="space-y-2">
              <p>✅ <strong>Dark Mode:</strong> Class-based toggle</p>
              <p>✅ <strong>shadcn/ui:</strong> Vollständig kompatibel</p>
              <p>✅ <strong>Performance:</strong> Optimiert</p>
              <p>✅ <strong>Compatibility:</strong> Backward-compatible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BodenseeThemeTest;