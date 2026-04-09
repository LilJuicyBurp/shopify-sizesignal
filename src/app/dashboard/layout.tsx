'use client';

import { type ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppProvider, Frame, Navigation } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import {
  HomeIcon,
  ProductIcon,
  PaintBrushIcon,
  ChartVerticalIcon,
  CreditCardIcon,
  SettingsIcon,
} from '@shopify/polaris-icons';
import AppBridgeProvider from '@/components/providers/AppBridgeProvider';

interface NavigationItem {
  url: string;
  label: string;
  icon: typeof HomeIcon;
}

const NAV_ITEMS: NavigationItem[] = [
  { url: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { url: '/dashboard/products', label: 'Products', icon: ProductIcon },
  { url: '/dashboard/widget-settings', label: 'Widget Settings', icon: PaintBrushIcon },
  { url: '/dashboard/analytics', label: 'Analytics', icon: ChartVerticalIcon },
  { url: '/dashboard/billing', label: 'Billing', icon: CreditCardIcon },
  { url: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={NAV_ITEMS.map((item) => ({
          url: item.url,
          label: item.label,
          icon: item.icon,
          selected: pathname === item.url,
          onClick: () => handleNavigate(item.url),
        }))}
      />
    </Navigation>
  );

  return (
    <AppBridgeProvider>
      <AppProvider i18n={enTranslations}>
        <Frame navigation={navigationMarkup}>{children}</Frame>
      </AppProvider>
    </AppBridgeProvider>
  );
}
