import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useThemeConfig } from "@/contexts/ThemeConfigContext";
import type { DesignSettings } from "@shared/schema";
import {
  Camera,
  Lock,
  Database,
  Upload,
  Download,
  Info,
  Eye,
  EyeOff,
  Palette,
  RefreshCw,
  Save,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newsletterConfirmations: true,
  });

  const { designSettings, isLoading: themeLoading, updateSettings, resetToDefaults } = useThemeConfig();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [tempSettings, setTempSettings] = useState<DesignSettings | null>(null);

  // Safe design settings with proper defaults to prevent null spread errors
  const safeDesignSettings = (designSettings || {
    light: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        foreground: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        baseSize: 16,
        lineHeight: 1.6,
        fontWeightNormal: 400,
        fontWeightBold: 600,
        scale: {
          h1: 2.25,
          h2: 1.875,
          h3: 1.5,
          h4: 1.25,
          h5: 1.125,
          h6: 1
        }
      }
    },
    dark: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#1f2937',
        foreground: '#ffffff'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        baseSize: 16,
        lineHeight: 1.6,
        fontWeightNormal: 400,
        fontWeightBold: 600,
        scale: {
          h1: 2.25,
          h2: 1.875,
          h3: 1.5,
          h4: 1.25,
          h5: 1.125,
          h6: 1
        }
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      await apiRequest(`/api/users/${user!.id}`, {
        method: "PUT",
        body: userData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profil aktualisiert",
        description: "Ihre Profildaten wurden erfolgreich gespeichert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Profildaten konnten nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("Passwörter stimmen nicht überein");
      }
      await apiRequest(`/api/auth/change-password`, {
        method: "PUT",
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      });
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich geändert",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description:
          error.message || "Das Passwort konnte nicht geändert werden",
        variant: "destructive",
      });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/backup', { method: 'POST' });
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Backup erstellt",
        description: "Das Backup wurde erfolgreich heruntergeladen",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Backup konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      await apiRequest(`/api/users/${user!.id}/profile-image`, {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profilbild aktualisiert",
        description: "Ihr Profilbild wurde erfolgreich hochgeladen",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Profilbild konnte nicht hochgeladen werden",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (field: string, value: string) => {
    if (value.trim() !== "") {
      updateUserMutation.mutate({ [field]: value });
    }
  };

  const handleProfileImageUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Nur JPG und PNG Dateien sind erlaubt",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 2MB groß sein",
        variant: "destructive",
      });
      return;
    }

    uploadProfileImageMutation.mutate(file);
  };

  const handlePasswordChange = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Einstellungen
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Settings */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profil-Einstellungen
                </h3>

                <div className="flex items-center space-x-6 mb-6">
                  <div className="w-20 h-20 bg-[var(--ruskin-blue)] rounded-full flex items-center justify-center text-white text-2xl font-medium">
                    {(user?.name || user?.username)?.charAt(0)?.toUpperCase() ||
                      "M"}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Profilbild ändern
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      JPG, PNG bis 2MB
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      id="profile-image-upload"
                      className="hidden"
                      aria-label="Profilbild hochladen"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProfileImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                      onClick={() =>
                        document.getElementById("profile-image-upload")?.click()
                      }
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Bild hochladen
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name || ""}
                      onBlur={(e) =>
                        handleProfileUpdate("name", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ""}
                      onBlur={(e) =>
                        handleProfileUpdate("email", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={user?.phone || ""}
                      onBlur={(e) =>
                        handleProfileUpdate("phone", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sicherheit
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2.5 right-2 h-8 px-2 opacity-50 hover:opacity-100"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2.5 right-2 h-8 px-2 opacity-50 hover:opacity-100"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2.5 right-2 h-8 px-2 opacity-50 hover:opacity-100"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending}
                    variant="destructive"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {changePasswordMutation.isPending
                      ? "Wird geändert..."
                      : "Passwort ändern"}
                  </Button>
                </div>
              </div>

              {/* Design & Theme Management - ALWAYS VISIBLE */}
              <div className="border border-gray-200 rounded-lg p-6" data-testid="design-theme-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Design & Theme
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewMode(previewMode === 'light' ? 'dark' : 'light')}
                      data-testid="button-toggle-preview-mode"
                    >
                      {previewMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="colors" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="colors" data-testid="tab-colors">Farben</TabsTrigger>
                    <TabsTrigger value="typography" data-testid="tab-typography">Typografie</TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primary-color">Primärfarbe</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              id="primary-color"
                              type="color"
                              defaultValue={safeDesignSettings.light.colors.primary}
                              className="w-16 h-10 p-1 border rounded"
                              data-testid="input-primary-color"
                              onChange={(e) => {
                                const newSettings = {
                                  ...safeDesignSettings,
                                  light: {
                                    ...safeDesignSettings.light,
                                    colors: {
                                      ...safeDesignSettings.light.colors,
                                      primary: e.target.value
                                    }
                                  }
                                } as DesignSettings;
                                setTempSettings(newSettings);
                              }}
                            />
                            <Input
                              type="text"
                              defaultValue={safeDesignSettings.light.colors.primary}
                              className="flex-1"
                              data-testid="input-primary-color-hex"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="secondary-color">Sekundärfarbe</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              id="secondary-color"
                              type="color"
                              defaultValue={safeDesignSettings.light.colors.secondary}
                              className="w-16 h-10 p-1 border rounded"
                              data-testid="input-secondary-color"
                              onChange={(e) => {
                                const newSettings = {
                                  ...safeDesignSettings,
                                  light: {
                                    ...safeDesignSettings.light,
                                    colors: {
                                      ...safeDesignSettings.light.colors,
                                      secondary: e.target.value
                                    }
                                  }
                                } as DesignSettings;
                                setTempSettings(newSettings);
                              }}
                            />
                            <Input
                              type="text"
                              defaultValue={safeDesignSettings.light.colors.secondary}
                              className="flex-1"
                              data-testid="input-secondary-color-hex"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="background-color">Hintergrundfarbe</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              id="background-color"
                              type="color"
                              defaultValue={safeDesignSettings.light.colors.background}
                              className="w-16 h-10 p-1 border rounded"
                              data-testid="input-background-color"
                            />
                            <Input
                              type="text"
                              defaultValue={safeDesignSettings.light.colors.background}
                              className="flex-1"
                              data-testid="input-background-color-hex"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="text-color">Textfarbe</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              id="text-color"
                              type="color"
                              defaultValue={safeDesignSettings.light.colors.foreground}
                              className="w-16 h-10 p-1 border rounded"
                              data-testid="input-text-color"
                            />
                            <Input
                              type="text"
                              defaultValue={safeDesignSettings.light.colors.foreground}
                              className="flex-1"
                              data-testid="input-text-color-hex"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="typography" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="font-family">Schriftart</Label>
                        <Select 
                          defaultValue={safeDesignSettings.light.typography.fontFamily}
                          data-testid="select-font-family"
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Schriftart auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                            <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                            <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                            <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                            <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                            <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                            <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="base-font-size">Basis Schriftgröße (px)</Label>
                          <div className="space-y-2 mt-1">
                            <Slider
                              id="base-font-size"
                              defaultValue={[safeDesignSettings.light.typography.baseSize]}
                              max={24}
                              min={12}
                              step={1}
                              data-testid="slider-base-font-size"
                            />
                            <div className="text-sm text-gray-600 text-center">
                              {safeDesignSettings.light.typography.baseSize}px
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="line-height">Zeilenhöhe</Label>
                          <div className="space-y-2 mt-1">
                            <Slider
                              id="line-height"
                              defaultValue={[safeDesignSettings.light.typography.lineHeight]}
                              max={2.5}
                              min={1.0}
                              step={0.1}
                              data-testid="slider-line-height"
                            />
                            <div className="text-sm text-gray-600 text-center">
                              {safeDesignSettings.light.typography.lineHeight}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="normal-weight">Normale Schriftstärke</Label>
                          <div className="space-y-2 mt-1">
                            <Slider
                              id="normal-weight"
                              defaultValue={[safeDesignSettings.light.typography.fontWeightNormal]}
                              max={700}
                              min={100}
                              step={100}
                              data-testid="slider-normal-weight"
                            />
                            <div className="text-sm text-gray-600 text-center">
                              {safeDesignSettings.light.typography.fontWeightNormal}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="bold-weight">Fette Schriftstärke</Label>
                          <div className="space-y-2 mt-1">
                            <Slider
                              id="bold-weight"
                              defaultValue={[safeDesignSettings.light.typography.fontWeightBold]}
                              max={900}
                              min={400}
                              step={100}
                              data-testid="slider-bold-weight"
                            />
                            <div className="text-sm text-gray-600 text-center">
                              {safeDesignSettings.light.typography.fontWeightBold}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Überschriften-Größen (rem)</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((heading) => (
                            <div key={heading} className="space-y-1">
                              <Label htmlFor={`${heading}-size`} className="text-xs">
                                {heading.toUpperCase()}
                              </Label>
                              <div className="space-y-1">
                                <Slider
                                  id={`${heading}-size`}
                                  defaultValue={[
                                    safeDesignSettings.light.typography.scale[heading]
                                  ]}
                                  max={3}
                                  min={0.8}
                                  step={0.125}
                                  data-testid={`slider-${heading}-size`}
                                />
                                <div className="text-xs text-gray-600 text-center">
                                  {safeDesignSettings.light.typography.scale[heading]}rem
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Live Preview */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Monitor className="w-4 h-4 mr-2" />
                    Live-Vorschau ({previewMode === 'light' ? 'Hell' : 'Dunkel'})
                  </h4>
                  <div 
                    className="p-4 bg-white border rounded space-y-3"
                    data-font-family={((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.typography?.fontFamily as string) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.typography.fontFamily as string)}
                    data-font-size={`${((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.typography?.baseSize as number) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.typography.baseSize as number)}px`}
                    data-line-height={((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.typography?.lineHeight as string) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.typography.lineHeight as string)}
                    data-bg-color={((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.colors?.background as string) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.colors.background as string)}
                    data-text-color={((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.colors?.foreground as string) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.colors.foreground as string)}
                    data-testid="preview-container"
                  >
                    <h1 className="font-bold" data-testid="preview-h1">Überschrift H1</h1>
                    <h2 className="font-bold" data-testid="preview-h2">Überschrift H2</h2>
                    <h3 className="font-bold" data-testid="preview-h3">Überschrift H3</h3>
                    <p data-testid="preview-paragraph">
                      Dies ist ein Beispieltext für die Live-Vorschau Ihrer Design-Einstellungen. 
                      Hier können Sie sehen, wie sich Änderungen an Farben und Typografie auswirken.
                    </p>
                    <Button 
                      style={{ 
                        backgroundColor: ((tempSettings as unknown as Record<string, Record<string, Record<string, unknown>>>)?.light?.colors?.primary as string) || ((safeDesignSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light.colors.primary as string),
                        color: 'white'
                      }}
                      data-testid="preview-button"
                    >
                      Beispiel Button
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={resetToDefaults}
                    data-testid="button-reset-design"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Zurücksetzen
                  </Button>
                  
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setTempSettings(null)}
                      data-testid="button-cancel-design"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={async () => {
                        if (tempSettings) {
                          try {
                            await updateSettings(tempSettings);
                            setTempSettings(null);
                            toast({
                              title: "Design gespeichert",
                              description: "Ihre Design-Einstellungen wurden erfolgreich gespeichert"
                            });
                          } catch {
                            toast({
                              title: "Fehler",
                              description: "Design konnte nicht gespeichert werden",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                      disabled={!tempSettings || themeLoading}
                      className="bg-[var(--bodensee-water)] hover:bg-[var(--bodensee-water)]/90"
                      data-testid="button-save-design"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {themeLoading ? "Wird gespeichert..." : "Speichern"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="space-y-6">
              {/* Notification Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Benachrichtigungen
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        E-Mail-Benachrichtigungen
                      </h4>
                      <p className="text-sm text-gray-600">
                        Bei neuen Anfragen benachrichtigen
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Push-Benachrichtigungen
                      </h4>
                      <p className="text-sm text-gray-600">
                        Browser-Benachrichtigungen aktivieren
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          pushNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Newsletter-Bestätigungen
                      </h4>
                      <p className="text-sm text-gray-600">
                        Versandbestätigungen erhalten
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newsletterConfirmations}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          newsletterConfirmations: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Backup & Export */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Backup & Export
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Letztes Backup
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date().toLocaleDateString("de-DE")} um 03:00 Uhr
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Herunterladen
                    </Button>
                  </div>

                  <Button
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                    className="w-full bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {createBackupMutation.isPending
                      ? "Wird erstellt..."
                      : "Manuelles Backup erstellen"}
                  </Button>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Backup wiederherstellen
                  </Button>
                </div>
              </div>

              {/* System Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  System Information
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">2.1.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Letztes Update:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speicher verwendet:</span>
                    <span className="font-medium">2.3 GB / 10 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Letzte Aktivität:</span>
                    <span className="font-medium">vor 5 Minuten</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-[var(--ruskin-blue)] text-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/5"
                >
                  <Info className="w-4 h-4 mr-2" />
                  System-Details anzeigen
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
