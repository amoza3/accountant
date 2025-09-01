'use client';

import { Languages } from 'lucide-react';
import { useChangeLocale, useCurrentLocale } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const changeLocale = useChangeLocale();
  const locale = useCurrentLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLocale('en')}
          disabled={locale === 'en'}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLocale('fa')}
          disabled={locale === 'fa'}
        >
          فارسی
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLocale('ar')}
          disabled={locale === 'ar'}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
