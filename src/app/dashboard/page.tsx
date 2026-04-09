'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  ProgressBar,
  Button,
  BlockStack,
  InlineStack,
  InlineGrid,
  Banner,
  Spinner,
  Link,
  Badge,
  IndexTable,
  Thumbnail,
  useIndexResourceState,
} from '@shopify/polaris';
import type {
  DashboardMetrics,
  OnboardingStatus,
  ProductFitSummary,
  ApiResponse,
  AnalyticsSummary,
} from '@/types';

interface OnboardingStep {
  key: keyof Pick<OnboardingStatus, 'productsSynced' | 'sizeChartsCreated' | 'widgetConfigured' | 'widgetActivated'>;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string | null;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'productsSynced',
    title: 'Sync Products',
    description: 'Import your products from Shopify to start analyzing fit data.',
    actionLabel: 'Sync Now',
    actionUrl: null,
  },
  {
    key: 'sizeChartsCreated',
    title: 'Upload or Create Size Charts',
    description: 'Add size charts so we can provide accurate recommendations.',
    actionLabel: 'Manage Size Charts',
    actionUrl: '/dashboard/products',
  },
  {
    key: 'widgetConfigured',
    title: 'Configure Widget',
    description: 'Customize the look and behavior of your size recommendation widget.',
    actionLabel: 'Widget Settings',
    actionUrl: '/dashboard/widget-settings',
  },
  {
    key: 'widgetActivated',
    title: 'Activate on Storefront',
    description: 'Enable the widget on your storefront so customers can get recommendations.',
    actionLabel: 'View Instructions',
    actionUrl: '/dashboard/settings',
  },
];

export default function DashboardPage() {
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [confusedProducts, setConfusedProducts] = useState<ProductFitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics');
      const result: ApiResponse<AnalyticsSummary> = await response.json();

      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to load dashboard data');
        return;
      }

      const data = result.data;

      setMetrics({
        totalProducts: 0,
        totalRecommendations: data.totalRecommendations,
        returnRateReduction: data.returnRateImpact,
        widgetImpressions: data.widgetImpressions,
        clickThroughRate: data.clickThroughRate,
        acceptanceRate: data.acceptanceRate,
      });

      setConfusedProducts(data.topConfusedProducts);

      const completedSteps =
        (data.totalRecommendations > 0 ? 2 : 0) +
        (data.topConfusedProducts.length > 0 ? 1 : 0);

      setOnboarding({
        productsSynced: data.topConfusedProducts.length > 0 || data.totalRecommendations > 0,
        sizeChartsCreated: data.totalRecommendations > 0,
        widgetConfigured: data.widgetImpressions > 0,
        widgetActivated: data.widgetImpressions > 0,
        completedSteps,
        totalSteps: 4,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSyncProducts = useCallback(async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/products/sync', { method: 'POST' });
      const result = await response.json() as ApiResponse<{ productsCreated: number; productsUpdated: number }>;

      if (result.success) {
        setToastMessage('Products synced successfully');
        void fetchDashboardData();
      } else {
        setError(result.error ?? 'Sync failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
    } finally {
      setSyncing(false);
    }
  }, [fetchDashboardData]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const onboardingDone = onboarding !== null && onboarding.completedSteps >= onboarding.totalSteps;

  if (loading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack align="center" inlineAlign="center">
                <Spinner accessibilityLabel="Loading dashboard" size="large" />
                <Text as="p" variant="bodyMd">
                  Loading dashboard...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (!onboardingDone) {
    const progressPercent = onboarding
      ? Math.round((onboarding.completedSteps / onboarding.totalSteps) * 100)
      : 0;

    return (
      <Page title="Welcome to SizeSignal AI">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Get Started
                </Text>
                <Text as="p" variant="bodyMd">
                  Complete these steps to start providing intelligent size recommendations to your customers.
                </Text>
                <ProgressBar progress={progressPercent} size="small" tone="primary" />
                <Text as="p" variant="bodySm">
                  {onboarding?.completedSteps ?? 0} of {onboarding?.totalSteps ?? 4} steps completed
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = onboarding ? onboarding[step.key] : false;

            return (
              <Layout.Section key={step.key}>
                <Card>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={isComplete ? 'success' : undefined}>
                          Step {index + 1}
                        </Badge>
                        <Text as="h3" variant="headingSm">
                          {step.title}
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodyMd">
                        {step.description}
                      </Text>
                    </BlockStack>
                    {step.actionUrl ? (
                      <Link url={step.actionUrl}>
                        <Button disabled={isComplete}>{step.actionLabel}</Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={handleSyncProducts}
                        loading={syncing}
                        disabled={isComplete}
                      >
                        {step.actionLabel}
                      </Button>
                    )}
                  </InlineStack>
                </Card>
              </Layout.Section>
            );
          })}

          {toastMessage && (
            <Layout.Section>
              <Banner tone="success" onDismiss={dismissToast}>
                <p>{toastMessage}</p>
              </Banner>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Dashboard">
      <Layout>
        {toastMessage && (
          <Layout.Section>
            <Banner tone="success" onDismiss={dismissToast}>
              <p>{toastMessage}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            <MetricCard
              title="Products Synced"
              value={String(metrics?.totalProducts ?? 0)}
              description="Products with fit data"
            />
            <MetricCard
              title="Recommendations Made"
              value={String(metrics?.totalRecommendations ?? 0)}
              description="Size recommendations served"
            />
            <MetricCard
              title="Return Rate Reduction"
              value={`${((metrics?.returnRateReduction ?? 0) * 100).toFixed(1)}%`}
              description="Reduction in size-related returns"
            />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <FitConfusionTable products={confusedProducts} />
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <ReturnRiskCard
            returnRate={metrics?.returnRateReduction ?? 0}
            recommendations={metrics?.totalRecommendations ?? 0}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingXl">
          {value}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {description}
        </Text>
      </BlockStack>
    </Card>
  );
}

function FitConfusionTable({ products }: { products: ProductFitSummary[] }) {
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products, { resourceIDResolver: (p) => p.productId });

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row
      id={product.productId}
      key={product.productId}
      selected={selectedResources.includes(product.productId)}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center">
          {product.imageUrl && (
            <Thumbnail source={product.imageUrl} alt={product.title} size="small" />
          )}
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {product.title}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={getFitScoreTone(product.fitScore)}>
          {product.fitScore !== null ? `${Math.round(product.fitScore * 100)}%` : 'N/A'}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={getConfusionTone(product.fitConfusion)}>
          {product.fitConfusion !== null ? `${Math.round(product.fitConfusion * 100)}%` : 'N/A'}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {product.returnCount}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Products with Highest Fit Confusion
        </Text>
        <IndexTable
          resourceName={{ singular: 'product', plural: 'products' }}
          itemCount={products.length}
          selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: 'Product' },
            { title: 'Fit Score' },
            { title: 'Confusion' },
            { title: 'Returns' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </BlockStack>
    </Card>
  );
}

function ReturnRiskCard({
  returnRate,
  recommendations,
}: {
  returnRate: number;
  recommendations: number;
}) {
  const riskLevel = returnRate > 0.3 ? 'High' : returnRate > 0.15 ? 'Medium' : 'Low';
  const riskTone: 'critical' | 'warning' | 'success' =
    returnRate > 0.3 ? 'critical' : returnRate > 0.15 ? 'warning' : 'success';

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Return Risk Overview
        </Text>
        <InlineStack gap="200" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">
            Risk Level:
          </Text>
          <Badge tone={riskTone}>{riskLevel}</Badge>
        </InlineStack>
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Size-related return rate
          </Text>
          <ProgressBar
            progress={Math.round(returnRate * 100)}
            size="small"
            tone={riskTone === 'critical' ? 'critical' : 'primary'}
          />
          <Text as="p" variant="bodySm">
            {(returnRate * 100).toFixed(1)}% of returns are size-related
          </Text>
        </BlockStack>
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Recommendations served
          </Text>
          <Text as="p" variant="headingSm">
            {recommendations.toLocaleString()}
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

function getFitScoreTone(score: number | null): 'success' | 'warning' | 'critical' | undefined {
  if (score === null) return undefined;
  if (score >= 0.7) return 'success';
  if (score >= 0.4) return 'warning';
  return 'critical';
}

function getConfusionTone(score: number | null): 'success' | 'warning' | 'critical' | undefined {
  if (score === null) return undefined;
  if (score <= 0.2) return 'success';
  if (score <= 0.5) return 'warning';
  return 'critical';
}
