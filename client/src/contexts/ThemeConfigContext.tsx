import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { DesignSettings } from '@shared/schema';

interface ThemeConfigContextType {
  designSettings: DesignSettings | null;
  isLoading: boolean;
  applyTheme: (settings: DesignSettings) => void;
  updateSettings: (settings: DesignSettings) => Promise<void>;
  resetToDefaults: () => void;
}

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider');
  }
  return context;
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch design settings
  const { data: designSettings, isLoading } = useQuery({
    queryKey: ['/api/design-settings'],
    queryFn: () => apiRequest('/api/design-settings'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (settings: DesignSettings) => {
      return apiRequest('/api/design-settings', {
        method: 'PUT',
        body: settings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-settings'] });
    },
  });

  // Apply theme to document
  const applyTheme = (settings: DesignSettings) => {
    if (!settings || !settings.light || !settings.dark) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const currentTheme = isDarkMode ? settings.dark : settings.light;

    // Apply colors
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });

    // Apply typography with proper fallbacks
    const baseTypography = settings.light.typography;
    const currentTypography = currentTheme.typography;
    
    // Use current theme typography or fallback to light theme typography
    const fontFamily = currentTypography?.fontFamily ?? baseTypography.fontFamily;
    const baseSize = currentTypography?.baseSize ?? baseTypography.baseSize;
    const lineHeight = currentTypography?.lineHeight ?? baseTypography.lineHeight;
    const letterSpacing = currentTypography?.letterSpacing ?? baseTypography.letterSpacing;
    const fontWeightNormal = currentTypography?.fontWeightNormal ?? baseTypography.fontWeightNormal;
    const fontWeightBold = currentTypography?.fontWeightBold ?? baseTypography.fontWeightBold;
    const scale = currentTypography?.scale ?? baseTypography.scale;

    document.documentElement.style.setProperty('--font-family-base', fontFamily);
    document.documentElement.style.setProperty('--font-size-base', `${baseSize}px`);
    document.documentElement.style.setProperty('--line-height-base', lineHeight.toString());
    document.documentElement.style.setProperty('--letter-spacing-base', `${letterSpacing}px`);
    document.documentElement.style.setProperty('--font-weight-normal', fontWeightNormal.toString());
    document.documentElement.style.setProperty('--font-weight-bold', fontWeightBold.toString());

    // Apply heading scales with proper type safety
    if (scale) {
      Object.entries(scale).forEach(([heading, scaleValue]) => {
        if (scaleValue !== undefined) {
          document.documentElement.style.setProperty(`--font-size-${heading}`, `${scaleValue}rem`);
        }
      });
    }
  };

  // Helper function to check if we have valid design settings
  const isValidDesignSettings = (settings: any): settings is DesignSettings => {
    return settings && 
           settings.light && 
           settings.dark && 
           settings.light.colors && 
           settings.light.typography &&
           settings.dark.colors;
  };

  // Apply theme when settings or dark mode changes
  useEffect(() => {
    if (isValidDesignSettings(designSettings)) {
      applyTheme(designSettings);
    }
  }, [designSettings]);

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (isValidDesignSettings(designSettings)) {
            applyTheme(designSettings);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [designSettings]);

  const updateSettings = async (settings: DesignSettings) => {
    applyTheme(settings); // Apply immediately for preview
    await updateMutation.mutateAsync(settings);
  };

  const resetToDefaults = () => {
    // Reset to browser defaults
    const root = document.documentElement;
    root.style.removeProperty('--font-family-base');
    root.style.removeProperty('--font-size-base');
    root.style.removeProperty('--line-height-base');
    root.style.removeProperty('--letter-spacing-base');
    
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['/api/design-settings'] });
  };

  return (
    <ThemeConfigContext.Provider
      value={{
        designSettings: isValidDesignSettings(designSettings) ? designSettings : null,
        isLoading,
        applyTheme,
        updateSettings,
        resetToDefaults,
      }}
    >
      {children}
    </ThemeConfigContext.Provider>
  );
}