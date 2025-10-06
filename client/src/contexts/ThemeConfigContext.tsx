import React, { createContext, useContext, useEffect } from 'react';
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update design settings
  const updateMutation = useMutation({
    mutationFn: (settings: DesignSettings) => 
      apiRequest('/api/design-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-settings'] });
    },
    onError: (error) => {
      console.error('Error updating design settings:', error);
    },
  });

  // Apply theme to document
  const applyTheme = (settings: DesignSettings) => {
    if (!settings) return;

    // Apply colors directly from settings
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary', settings.primaryColor);
    }
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent', settings.accentColor);
    }

    // Apply font family
    if (settings.fontFamily) {
      document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    }
  };

  // Helper function to check if we have valid design settings
  const isValidDesignSettings = (settings: unknown): settings is DesignSettings => {
    return !!(settings && typeof settings === 'object' && 'theme' in settings);
  };

  // Apply theme when settings change
  useEffect(() => {
    if (isValidDesignSettings(designSettings)) {
      applyTheme(designSettings);
    }
  }, [designSettings]);

  const updateSettings = async (settings: DesignSettings) => {
    applyTheme(settings); // Apply immediately for preview
    await updateMutation.mutateAsync(settings);
  };

  const resetToDefaults = () => {
    // Reset to browser defaults
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--font-family');
    
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