import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LanguageSelectorProps {
  isScrolled?: boolean;
}

export default function LanguageSelector({ isScrolled = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div data-testid="language-selector">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${
              isScrolled 
                ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            data-testid="button-language-selector"
            aria-label="Language"
          >
            <Globe className="w-4 h-4" />
            <span className="inline">{currentLanguage?.flag}</span>
            <span className="hidden sm:inline ml-1">{currentLanguage?.label}</span>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'de' | 'en')}
            className={`flex items-center gap-2 cursor-pointer ${
              language === lang.code ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
            data-testid={`menu-item-${lang.code}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}