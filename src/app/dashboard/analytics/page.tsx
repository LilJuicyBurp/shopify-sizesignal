'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Badge,
  Button,
  Banner,
  Spinner,
  IndexTable,
  Thumbnail,
  Divider,
  SkeletonBodyText,
} from '@shopify/polaris';
import type { AnalyticsSummary, ApiResponse, DailyMetric, ProductFitSummary } from '@/types';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDate(d);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result: ApiResponse<AnalyticsSummary> = await response.json();

      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to load analytics');
        return;
      }

      setData(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    setEndDate(value);
  }, []);

  const handleExportCsv = useCallback(async () => {
    if (!data) return;

    try {
      setExporting(true);
      setExportMessage(null);

      const headers = ['Date', 'Recommendations', 'Acceptances', 'Returns'];
      const rows = data.dailyMetrics.map((m) => [m.date, m.recommendations, m.acceptances, m.returns]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sizesignal-analytics-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage('CSV exported successfully');
    } catch {
      setExportMessage('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }, [data, startDate, endDate]);

  if (loading) {
    return (
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack align="center" inlineAlign="center">
                <Spinner accessibilityLabel="Loading analytics" size="large" />
                <Text as="p" variant="bodyMd">
                  Loading analytics...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Analytics">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {exportMessage && (
          <Layout.Section>
            <Banner
              tone={exportMessage.includes('success') ? 'success' : 'critical'}
              onDismiss={() => setExportMessage(null)}
            >
              <p>{exportMessage}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <InlineStack gap="400" align="start" blockAlign="end">
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                autoComplete="off"
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                autoComplete="off"
              />
              <Button onClick={handleExportCsv} loading={exporting}>
                Export CSV
              </Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <MetricCard
              title="Total Recommendations"
              value={data?.totalRecommendations.toLocaleString() ?? '0'}
            />
            <MetricCard
              title="Acceptance Rate"
              value={`${((data?.acceptanceRate ?? 0) * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Return Rate Impact"
              value={`${((data?.returnRateImpact ?? 0) * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Revenue Saved"
              value={`$${(data?.revenueSaved ?? 0).toLocaleString()}`}
            />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <FitAccuracyChart dailyMetrics={data?.dailyMetrics ?? []} />
        </Layout.Section>

        <Layout.Section>
          <ReturnReasonBreakdown breakdown={data?.returnReasonBreakdown ?? {}} />
        </Layout.Section>

        <Layout.Section>
          <TopConfusedProductsTable products={data?.topConfusedProducts ?? []} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingXl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

function FitAccuracyChart({ dailyMetrics }: { dailyMetrics: DailyMetric[] }) {
  if (dailyMetrics.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Fit Accuracy Trend
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            No data available for the selected date range.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const maxRecommendations = Math.max(...dailyMetrics.map((m) => m.recommendations), 1);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Fit Accuracy Trend
        </Text>
        <InlineStack gap="300" blockAlign="center">
          <InlineStack gap="100" blockAlign="center">
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#2c6ecb',
                borderRadius: '2px',
              }}
            />
            <Text as="span" variant="bodySm">
              Recommendations
            </Text>
          </InlineStack>
          <InlineStack gap="100" blockAlign="center">
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#29845a',
                borderRadius: '2px',
              }}
            />
            <Text as="span" variant="bodySm">
              Acceptances
            </Text>
          </InlineStack>
          <InlineStack gap="100" blockAlign="center">
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#d72c0d',
                borderRadius: '2px',
              }}
            />
            <Text as="span" variant="bodySm">
              Returns
            </Text>
          </InlineStack>
        </InlineStack>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '200px',
            borderBottom: '1px solid #e1e3e5',
            paddingBottom: '4px',
          }}
        >
          {dailyMetrics.map((metric) => {
            const recHeight = (metric.recommendations / maxRecommendations) * 180;
            const accHeight = (metric.acceptances / maxRecommendations) * 180;
            const retHeight = (metric.returns / maxRecommendations) * 180;

            return (
              <div
                key={metric.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  gap: '1px',
                  alignItems: 'flex-end',
                  minWidth: 0,
                }}
                title={`${metric.date}: ${metric.recommendations} recs, ${metric.acceptances} acc, ${metric.returns} ret`}
              >
                <div
                  style={{
                    flex: 1,
                    height: `${Math.max(recHeight, 1)}px`,
                    backgroundColor: '#2c6ecb',
                    borderRadius: '1px 1px 0 0',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: `${Math.max(accHeight, 1)}px`,
                    backgroundColor: '#29845a',
                    borderRadius: '1px 1px 0 0',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: `${Math.max(retHeight, 1)}px`,
                    backgroundColor: '#d72c0d',
                    borderRadius: '1px 1px 0 0',
                  }}
                />
              </div>
            );
          })}
        </div>
        <InlineStack align="space-between">
          <Text as="span" variant="bodySm" tone="subdued">
            {dailyMetrics[0]?.date ?? ''}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {dailyMetrics[dailyMetrics.length - 1]?.date ?? ''}
          </Text>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function ReturnReasonBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const maxCount = entries.length > 0 ? Math.max(...entries.map(([, count]) => count)) : 1;

  const reasonLabels: Record<string, string> = {
    TOO_SMALL: 'Too Small',
    TOO_LARGE: 'Too Large',
    FIT_ISSUE: 'Fit Issue',
    STYLE: 'Style',
    QUALITY: 'Quality',
    WRONG_ITEM: 'Wrong Item',
    OTHER: 'Other',
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Return Reason Breakdown
        </Text>
        {entries.length === 0 ? (
          <Text as="p" variant="bodySm" tone="subdued">
            No return data available for the selected period.
          </Text>
        ) : (
          <BlockStack gap="300">
            {entries.map(([reason, count]) => {
              const percentage = Math.round((count / maxCount) * 100);
              return (
                <InlineStack key={reason} gap="300" blockAlign="center">
                  <div style={{ minWidth: '100px' }}>
                    <Text as="span" variant="bodySm">
                      {reasonLabels[reason] ?? reason}
                    </Text>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div
                      style={{
                        height: '24px',
                        backgroundColor: '#e1e3e5',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor:
                            reason === 'TOO_SMALL' || reason === 'TOO_LARGE'
                              ? '#d72c0d'
                              : reason === 'FIT_ISSUE'
                                ? '#ffc453'
                                : '#8c9196',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ minWidth: '40px', textAlign: 'right' }}>
                    <Text as="span" variant="bodySm" fontWeight="semibold">
                      {count}
                    </Text>
                  </div>
                </InlineStack>
              );
            })}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}

function TopConfusedProductsTable({ products }: { products: ProductFitSummary[] }) {
  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row id={product.productId} key={product.productId} position={index}>
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
        <Badge
          tone={
            product.fitConfusion !== null && product.fitConfusion > 0.5
              ? 'critical'
              : product.fitConfusion !== null && product.fitConfusion > 0.2
                ? 'warning'
                : 'success'
          }
        >
          {product.fitConfusion !== null ? `${Math.round(product.fitConfusion * 100)}%` : 'N/A'}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {product.returnCount}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {product.reviewCount}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Top Confused Products
        </Text>
        {products.length === 0 ? (
          <Text as="p" variant="bodySm" tone="subdued">
            No confused products detected. This is great!
          </Text>
        ) : (
          <IndexTable
            resourceName={{ singular: 'product', plural: 'products' }}
            itemCount={products.length}
            headings={[
              { title: 'Product' },
              { title: 'Confusion Score' },
              { title: 'Returns' },
              { title: 'Reviews' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
        )}
      </BlockStack>
    </Card>
  );
}
