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
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Spinner,
  Divider,
  Box,
} from '@shopify/polaris';
import type { WidgetConfig, ApiResponse } from '@/types';
import { DEFAULT_WIDGET_CONFIG } from '@/types';

type WidgetPosition = 'inline' | 'modal' | 'drawer';

const POSITION_OPTIONS = [
  { label: 'Inline (embedded in page)', value: 'inline' },
  { label: 'Modal (popup overlay)', value: 'modal' },
  { label: 'Drawer (slide-in panel)', value: 'drawer' },
];

export default function WidgetSettingsPage() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/widget');
      const result: ApiResponse<{ config: WidgetConfig; enabled: boolean }> =
        await response.json();

      if (result.success && result.data) {
        setConfig(result.data.config);
        setEnabled(result.data.enabled);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load widget settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/widget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, enabled }),
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setSuccessMessage('Widget settings saved successfully');
      } else {
        setError(result.error ?? 'Failed to save settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [config, enabled]);

  const handleEnabledChange = useCallback((checked: boolean) => {
    setEnabled(checked);
  }, []);

  const handlePrimaryColorChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, primaryColor: value }));
  }, []);

  const handleTextColorChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, textColor: value }));
  }, []);

  const handleBackgroundColorChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, backgroundColor: value }));
  }, []);

  const handlePositionChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, position: value as WidgetPosition }));
  }, []);

  const handleShowConfidenceChange = useCallback((checked: boolean) => {
    setConfig((prev) => ({ ...prev, showConfidence: checked }));
  }, []);

  const handleShowModelNotesChange = useCallback((checked: boolean) => {
    setConfig((prev) => ({ ...prev, showModelNotes: checked }));
  }, []);

  const handleShowFitPredictionChange = useCallback((checked: boolean) => {
    setConfig((prev) => ({ ...prev, showFitPrediction: checked }));
  }, []);

  const handleHeadingTextChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, headingText: value }));
  }, []);

  const handleButtonTextChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, buttonText: value }));
  }, []);

  const handleCustomCssChange = useCallback((value: string) => {
    setConfig((prev) => ({ ...prev, customCss: value }));
  }, []);

  if (loading) {
    return (
      <Page title="Widget Customization">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack align="center" inlineAlign="center">
                <Spinner accessibilityLabel="Loading settings" size="large" />
                <Text as="p" variant="bodyMd">
                  Loading widget settings...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Widget Customization">
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
                Widget Settings
              </Text>
              <FormLayout>
                <Checkbox
                  label="Enable size recommendation widget"
                  helpText="When enabled, the widget appears on your product pages."
                  checked={enabled}
                  onChange={handleEnabledChange}
                />

                <Divider />

                <Text as="h3" variant="headingSm">
                  Colors
                </Text>

                <FormLayout.Group>
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={config.primaryColor}
                    onChange={handlePrimaryColorChange}
                    autoComplete="off"
                  />
                  <TextField
                    label="Text Color"
                    type="color"
                    value={config.textColor}
                    onChange={handleTextColorChange}
                    autoComplete="off"
                  />
                  <TextField
                    label="Background Color"
                    type="color"
                    value={config.backgroundColor}
                    onChange={handleBackgroundColorChange}
                    autoComplete="off"
                  />
                </FormLayout.Group>

                <Divider />

                <Text as="h3" variant="headingSm">
                  Layout
                </Text>

                <Select
                  label="Widget Position"
                  options={POSITION_OPTIONS}
                  value={config.position}
                  onChange={handlePositionChange}
                  helpText="How the size recommendation widget is displayed on the product page."
                />

                <Divider />

                <Text as="h3" variant="headingSm">
                  Display Options
                </Text>

                <Checkbox
                  label="Show confidence badge"
                  helpText="Display the confidence level of the size recommendation."
                  checked={config.showConfidence}
                  onChange={handleShowConfidenceChange}
                />

                <Checkbox
                  label="Show model fit notes"
                  helpText="Display additional fit notes based on product and body type."
                  checked={config.showModelNotes}
                  onChange={handleShowModelNotesChange}
                />

                <Checkbox
                  label="Show size comparison"
                  helpText="Display how this product's sizing compares to other brands."
                  checked={config.showFitPrediction}
                  onChange={handleShowFitPredictionChange}
                />

                <Divider />

                <Text as="h3" variant="headingSm">
                  Text
                </Text>

                <TextField
                  label="Heading Text"
                  value={config.headingText}
                  onChange={handleHeadingTextChange}
                  autoComplete="off"
                  placeholder="Find Your Perfect Size"
                />

                <TextField
                  label="Button Text"
                  value={config.buttonText}
                  onChange={handleButtonTextChange}
                  autoComplete="off"
                  placeholder="Get My Size"
                />

                <Divider />

                <Text as="h3" variant="headingSm">
                  Advanced
                </Text>

                <TextField
                  label="Custom CSS"
                  value={config.customCss}
                  onChange={handleCustomCssChange}
                  multiline={6}
                  autoComplete="off"
                  helpText="Add custom CSS rules to further style the widget."
                  placeholder=".sizesignal-widget { /* your styles */ }"
                />

                <Button variant="primary" onClick={handleSave} loading={saving}>
                  Save Settings
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <WidgetPreview config={config} enabled={enabled} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function WidgetPreview({
  config,
  enabled,
}: {
  config: WidgetConfig;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Widget Preview
          </Text>
          <Banner tone="info">
            <p>The widget is currently disabled. Enable it to see a preview.</p>
          </Banner>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Widget Preview
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          This is an approximate preview of how the widget will appear on your storefront.
        </Text>
        <Box
          padding="400"
          borderWidth="025"
          borderColor="border"
          borderRadius="200"
          background="bg-surface"
        >
          <div
            style={{
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              fontFamily: 'inherit',
            }}
          >
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                <span style={{ color: config.textColor }}>
                  {config.headingText || 'Find Your Perfect Size'}
                </span>
              </Text>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <div
                    key={size}
                    style={{
                      padding: '6px 14px',
                      border: `1px solid ${config.primaryColor}`,
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: size === 'M' ? config.backgroundColor : config.textColor,
                      backgroundColor: size === 'M' ? config.primaryColor : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {size}
                  </div>
                ))}
              </div>

              {config.showConfidence && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: `${config.primaryColor}15`,
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: config.primaryColor, fontWeight: 600 }}>
                    92% confidence
                  </span>
                </div>
              )}

              {config.showModelNotes && (
                <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
                  This item runs slightly small. Consider sizing up if you prefer a relaxed fit.
                </p>
              )}

              {config.showFitPrediction && (
                <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
                  Compared to similar brands, this fits true to size.
                </p>
              )}

              <button
                type="button"
                style={{
                  backgroundColor: config.primaryColor,
                  color: config.backgroundColor,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '100%',
                }}
              >
                {config.buttonText || 'Get My Size'}
              </button>
            </BlockStack>
          </div>
        </Box>
        <Text as="p" variant="bodySm" tone="subdued">
          Position: {config.position}
        </Text>
      </BlockStack>
    </Card>
  );
}
