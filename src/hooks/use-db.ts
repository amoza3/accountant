'use client';

// This hook is deprecated. Please use useAppContext from @/components/app-provider.
// This file is kept for backward compatibility but will be removed in a future version.
import { useAppContext } from '@/components/app-provider';

/**
 * @deprecated Use `useAppContext` instead.
 */
export const useDb = useAppContext;
