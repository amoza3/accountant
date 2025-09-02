
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/i18n/client';

export default function Home() {
  redirect(encodeURI(`/${DEFAULT_LOCALE}/dashboard`));
}
