'use client';

import { type ReactNode, useMemo } from 'react';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';

interface AppBridgeProviderProps {
  children: ReactNode;
}

export default function AppBridgeWrapper({ children }: AppBridgeProviderProps) {
  const config = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? '';
    const host =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('host') ?? ''
        : '';

    return { apiKey, host, forceRedirect: true };
  }, []);

  return <AppBridgeProvider config={config}>{children}</AppBridgeProvider>;
}
