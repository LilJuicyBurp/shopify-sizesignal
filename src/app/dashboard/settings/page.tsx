'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Spinner,
  Divider,
  Badge,
} from '@shopify/polaris';
import type { ApiResponse } from '@/types';

interface ShopInfo {
  domain: string;
  plan: string;
  installedAt: string;
}

interface NotificationPrefs {
  emailOnReturn: boolean;
  emailOnHighConfusion: boolean;
  emailOnSyncComplete: boolean;
  emailWeeklyDigest: boolean;
}

interface SettingsState {
  shop: ShopInfo;
  syncSchedule: string;
  notifications: NotificationPrefs;
  webhookReviewUrl: string;
  webhookReturnUrl: string;
}

const SYNC_SCHEDULE_OPTIONS = [
  { label: 'Every 6 hours', value: '6h' },
  { label: 'Every 12 hours', value: '12h' },
  { label: 'Daily', value: '24h' },
  { label: 'Weekly', value: '168h' },
  { label: 'Manual only', value: 'manual' },
];

const DEFAULT_SETTINGS: SettingsState = {
  shop: {
    domain: '',
    plan: 'FREE',
    installedAt: '',
  },
  syncSchedule: '24h',
  notifications: {
    emailOnReturn: true,
    emailOnHighConfusion: true,
    emailOnSyncComplete: false,
    emailWeeklyDigest: true,
  },
  webhookReviewUrl: '',
  webhookReturnUrl: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/widget');
      const result: ApiResponse<{
        config: unknown;
        enabled: boolean;
        shop?: ShopInfo;
      }> = await response.json();

      if (result.success && result.data) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setSettings((prev) => ({
          ...prev,
          shop: result.data?.shop ?? prev.shop,
          webhookReviewUrl: `${baseUrl}/api/reviews`,
          webhookReturnUrl: `${baseUrl}/api/returns`,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSyncScheduleChange = useCallback((value: string) => {
    setSettings((prev) => ({ ...prev, syncSchedule: value }));
  }, []);

  const handleNotificationChange = useCallback(
    (key: keyof NotificationPrefs) => (checked: boolean) => {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: checked },
      }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/widget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncSchedule: settings.syncSchedule,
          notifications: settings.notifications,
        }),
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setSuccessMessage('Settings saved successfully');
      } else {
        setError(result.error ?? 'Failed to save settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [settings.syncSchedule, settings.notifications]);

  const handleManualSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/products/sync', { method: 'POST' });
      const result: ApiResponse<{ productsCreated: number; productsUpdated: number }> =
        await response.json();

      if (result.success) {
        setSuccessMessage(
          `Sync complete: ${result.data?.productsCreated ?? 0} created, ${result.data?.productsUpdated ?? 0} updated`,
        );
      } else {
        setError(result.error ?? 'Sync failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleResetData = useCallback(async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    try {
      setResetting(true);
      setError(null);

      const response = await fetch('/api/products', { method: 'DELETE' });
      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setSuccessMessage('All data has been reset');
        setResetConfirm(false);
      } else {
        setError(result.error ?? 'Failed to reset data');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset data';
      setError(message);
    } finally {
      setResetting(false);
    }
  }, [resetConfirm]);

  const handleCancelReset = useCallback(() => {
    setResetConfirm(false);
  }, []);

  const handleCopyUrl = useCallback(async (url: string, field: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, []);

  const handleCopyReviewUrl = useCallback(() => {
    void handleCopyUrl(settings.webhookReviewUrl, 'review');
  }, [handleCopyUrl, settings.webhookReviewUrl]);

  const handleCopyReturnUrl = useCallback(() => {
    void handleCopyUrl(settings.webhookReturnUrl, 'return');
  }, [handleCopyUrl, settings.webhookReturnUrl]);

  if (loading) {
    return (
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack align="center" inlineAlign="center">
                <Spinner accessibilityLabel="Loading settings" size="large" />
                <Text as="p" variant="bodyMd">
                  Loading settings...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Settings">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {successMessage && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccessMessage(null)}>
              <p>{successMessage}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Shop Information
              </Text>
              <FormLayout>
                <TextField
                  label="Domain"
                  value={settings.shop.domain || 'Not available'}
                  disabled
                  autoComplete="off"
                />
                <InlineStack gap="400">
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Current Plan
                    </Text>
                    <Badge tone="info">{settings.shop.plan || 'FREE'}</Badge>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Installed
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {settings.shop.installedAt
                        ? new Date(settings.shop.installedAt).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Data Sync
              </Text>
              <FormLayout>
                <Select
                  label="Sync Schedule"
                  options={SYNC_SCHEDULE_OPTIONS}
                  value={settings.syncSchedule}
                  onChange={handleSyncScheduleChange}
                  helpText="How often product data is automatically synced from your Shopify store."
                />
                <InlineStack gap="200">
                  <Button onClick={handleManualSync} loading={syncing}>
                    Sync Now
                  </Button>
                  <Text as="span" variant="bodySm" tone="subdued">
                    Manually trigger a full product sync.
                  </Text>
                </InlineStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Notification Preferences
              </Text>
              <FormLayout>
                <Checkbox
                  label="Email on new return"
                  helpText="Receive an email notification when a size-related return is reported."
                  checked={settings.notifications.emailOnReturn}
                  onChange={handleNotificationChange('emailOnReturn')}
                />
                <Checkbox
                  label="Email on high confusion detected"
                  helpText="Get notified when a product's fit confusion score exceeds the threshold."
                  checked={settings.notifications.emailOnHighConfusion}
                  onChange={handleNotificationChange('emailOnHighConfusion')}
                />
                <Checkbox
                  label="Email on sync complete"
                  helpText="Receive a confirmation email after each product sync completes."
                  checked={settings.notifications.emailOnSyncComplete}
                  onChange={handleNotificationChange('emailOnSyncComplete')}
                />
                <Checkbox
                  label="Weekly analytics digest"
                  helpText="Receive a weekly summary of your size recommendation analytics."
                  checked={settings.notifications.emailWeeklyDigest}
                  onChange={handleNotificationChange('emailWeeklyDigest')}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Integrations
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Use these webhook URLs to send review and return data from external services.
              </Text>
              <FormLayout>
                <BlockStack gap="200">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Review Ingestion Webhook
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        labelHidden
                        value={settings.webhookReviewUrl}
                        disabled
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={handleCopyReviewUrl} size="slim">
                      {copiedField === 'review' ? 'Copied!' : 'Copy'}
                    </Button>
                  </InlineStack>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Return Data Webhook
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        labelHidden
                        value={settings.webhookReturnUrl}
                        disabled
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={handleCopyReturnUrl} size="slim">
                      {copiedField === 'return' ? 'Copied!' : 'Copy'}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Save Changes
              </Text>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Save Settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h2" variant="headingMd" tone="critical">
                  Danger Zone
                </Text>
                <Badge tone="critical">Destructive</Badge>
              </InlineStack>

              <Divider />

              <BlockStack gap="300">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Reset All Data
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    This will permanently delete all synced products, size charts, analytics data,
                    and fit recommendations. This action cannot be undone.
                  </Text>
                  {resetConfirm ? (
                    <Banner tone="critical">
                      <BlockStack gap="200">
                        <p>
                          Are you sure? This will permanently delete all your data. This action
                          cannot be undone.
                        </p>
                        <InlineStack gap="200">
                          <Button tone="critical" onClick={handleResetData} loading={resetting}>
                            Yes, Reset Everything
                          </Button>
                          <Button onClick={handleCancelReset}>Cancel</Button>
                        </InlineStack>
                      </BlockStack>
                    </Banner>
                  ) : (
                    <Button tone="critical" onClick={handleResetData}>
                      Reset All Data
                    </Button>
                  )}
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Uninstall SizeSignal AI
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    To uninstall SizeSignal AI, go to your Shopify admin panel, navigate to{' '}
                    <strong>Settings &gt; Apps and sales channels</strong>, find SizeSignal AI, and
                    click <strong>Remove app</strong>. All data associated with your store will be
                    deleted after uninstallation.
                  </Text>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
