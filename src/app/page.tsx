
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/i18n/client';

export default function Home() {
  redirect(`/${DEFAULT_LOCALE}/dashboard`);
}
