"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';

export type Locale = string;
export const DEFAULT_LOCALE: Locale = 'fa';

function getNestedValue(source: Record<string, any>, keyPath: string): unknown {
  const segments = keyPath.split('.');
  let current: any = source;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

async function fetchTranslations(locale: string, namespaces: string[] = ['common']) {
  const dictionaries: Record<string, any> = {};
  for (const ns of namespaces) {
    try {
      const res = await fetch(`/locales/${locale}/${ns}.json`, { cache: 'force-cache' });
      if (res.ok) {
        dictionaries[ns] = await res.json();
      } else {
        dictionaries[ns] = {};
      }
    } catch {
      dictionaries[ns] = {};
    }
  }
  return dictionaries;
}

export function useCurrentLocale(): string {
  const params = useParams();
  const localeFromParams = (params?.locale as string) || DEFAULT_LOCALE;
  return localeFromParams;
}

export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (nextLocale: string) => {
    const currentLocale = params.locale as string;
    // Replace the current locale in the pathname with the next one
    const newPathname = pathname.replace(`/${currentLocale}`, `/${nextLocale}`);
    router.push(encodeURI(newPathname));
  };
}

export function useI18n(namespaces: string[] = ['common']) {
  const locale = useCurrentLocale();
  const [dicts, setDicts] = useState<Record<string, any>>({});

  useEffect(() => {
    let cancelled = false;
    fetchTranslations(locale, namespaces).then((d) => {
      if (!cancelled) setDicts(d);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, JSON.stringify(namespaces)]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, any>) => {
      for (const ns of namespaces) {
        const value = getNestedValue(dicts[ns] || {}, key);
        if (typeof value === 'string') {
          if (params) {
            return value.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : ''));
          }
          return value;
        }
      }
      return key;
    };
  }, [dicts, JSON.stringify(namespaces)]);

  return { t, locale };
}

export default {
  DEFAULT_LOCALE,
  useI18n,
  useCurrentLocale,
  useChangeLocale,
};
