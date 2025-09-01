import fs from 'fs/promises';
import path from 'path';

export type TranslateFunction = (key: string, fallback?: string) => string;

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

async function loadTranslations(locale: string, ns = 'common'): Promise<Record<string, any>> {
  const file = path.join(process.cwd(), 'locales', locale, `${ns}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

async function loadNamespaces(locale: string, namespaces: string[] = ['common']) {
  const out: Record<string, any> = {};
  for (const ns of namespaces) {
    out[ns] = await loadTranslations(locale, ns);
  }
  return out;
}

export async function getI18n(
  locale: string,
  namespaces: string[] = ['common']
): Promise<{ t: TranslateFunction; locale: string }> {
  const dictionariesByNamespace = await loadNamespaces(locale, namespaces);

  const t: TranslateFunction = (key: string, fallback = '') => {
    for (const namespace of namespaces) {
      const dictionary = dictionariesByNamespace[namespace] ?? {};
      const value = getNestedValue(dictionary, key);
      if (typeof value === 'string') {
        return value;
      }
    }
    return fallback || key;
  };

  return { t, locale };
}

export default { getI18n };


