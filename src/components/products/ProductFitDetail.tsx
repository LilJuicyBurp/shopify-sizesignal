'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Layout,
  Text,
  Badge,
  InlineStack,
  BlockStack,
  Spinner,
} from '@shopify/polaris';

interface VariantSizeData {
  size: string;
  inventory: number;
}

interface ReviewSentiment {
  label: string;
  count: number;
  color: string;
}

interface ReturnReasonEntry {
  reason: string;
  count: number;
}

interface SizeChartInfo {
  id: string;
  name: string;
}

interface ProductFitData {
  title: string;
  imageUrl: string | null;
  fitScore: number | null;
  fitConfusion: number | null;
  sizeDistribution: VariantSizeData[];
  reviewSentiment: ReviewSentiment[];
  returnReasons: ReturnReasonEntry[];
  sizeChart: SizeChartInfo | null;
  recommendedSize: string | null;
  confidence: number | null;
}

interface ProductFitDetailProps {
  productId: string;
  shopId: string;
}

export function ProductFitDetail({ productId, shopId }: ProductFitDetailProps) {
  const [data, setData] = useState<ProductFitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/products/${productId}/fit-detail?shopId=${encodeURIComponent(shopId)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load product fit data: ${response.statusText}`);
      }
      const json = (await response.json()) as { data: ProductFitData };
      setData(json.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId, shopId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <BlockStack gap="400" inlineAlign="center">
          <Spinner accessibilityLabel="Loading product fit data" size="large" />
          <Text as="p" variant="bodySm" tone="subdued">
            Loading product fit data...
          </Text>
        </BlockStack>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Product Fit Detail
          </Text>
          <Text as="p" tone="critical">
            {error ?? 'Failed to load product data.'}
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const maxInventory = Math.max(...data.sizeDistribution.map((v) => v.inventory), 1);
  const totalSentiment = data.reviewSentiment.reduce((sum, s) => sum + s.count, 0);

  return (
    <Layout>
      {/* Product Info */}
      <Layout.Section>
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              {data.title}
            </Text>
            <InlineStack gap="300">
              {data.fitScore !== null && (
                <InlineStack gap="100" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Fit Score:
                  </Text>
                  <Badge tone={data.fitScore >= 0.7 ? 'success' : data.fitScore >= 0.4 ? 'warning' : 'critical'}>
                    {(data.fitScore * 100).toFixed(0)}%
                  </Badge>
                </InlineStack>
              )}
              {data.fitConfusion !== null && (
                <InlineStack gap="100" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Fit Confusion:
                  </Text>
                  <Badge tone={data.fitConfusion > 0.7 ? 'critical' : data.fitConfusion > 0.4 ? 'warning' : 'success'}>
                    {(data.fitConfusion * 100).toFixed(0)}%
                  </Badge>
                </InlineStack>
              )}
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* Size Distribution */}
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Size Distribution
            </Text>
            {data.sizeDistribution.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                No variant data available.
              </Text>
            ) : (
              <BlockStack gap="200">
                {data.sizeDistribution.map((variant) => {
                  const barWidth = (variant.inventory / maxInventory) * 100;
                  return (
                    <InlineStack key={variant.size} gap="200" blockAlign="center" wrap={false}>
                      <div style={{ width: '40px', flexShrink: 0 }}>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          {variant.size}
                        </Text>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: '20px',
                          backgroundColor: 'var(--p-color-bg-surface-secondary)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: '100%',
                            backgroundColor: 'var(--p-color-bg-fill-info)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ width: '40px', textAlign: 'right', flexShrink: 0 }}>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {variant.inventory}
                        </Text>
                      </div>
                    </InlineStack>
                  );
                })}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* Review Sentiment */}
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Review Sentiment
            </Text>
            {data.reviewSentiment.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                No review data available.
              </Text>
            ) : (
              <BlockStack gap="200">
                {/* Pie-chart-like display */}
                <div
                  style={{
                    display: 'flex',
                    height: '24px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  {data.reviewSentiment.map((sentiment) => {
                    const widthPct = totalSentiment > 0 ? (sentiment.count / totalSentiment) * 100 : 0;
                    return (
                      <div
                        key={sentiment.label}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: sentiment.color,
                          minWidth: widthPct > 0 ? '4px' : '0',
                        }}
                        title={`${sentiment.label}: ${sentiment.count}`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <InlineStack gap="300" wrap>
                  {data.reviewSentiment.map((sentiment) => (
                    <InlineStack key={sentiment.label} gap="100" blockAlign="center">
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: sentiment.color,
                          flexShrink: 0,
                        }}
                      />
                      <Text as="span" variant="bodySm">
                        {sentiment.label}: {sentiment.count}
                      </Text>
                    </InlineStack>
                  ))}
                </InlineStack>
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* Return Reasons */}
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Return Reasons
            </Text>
            {data.returnReasons.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                No return data available.
              </Text>
            ) : (
              <BlockStack gap="200">
                {data.returnReasons.map((entry) => (
                  <InlineStack
                    key={entry.reason}
                    align="space-between"
                    blockAlign="center"
                  >
                    <Text as="span" variant="bodySm">
                      {entry.reason}
                    </Text>
                    <Badge>{String(entry.count)}</Badge>
                  </InlineStack>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* Size Chart Info */}
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Size Chart
            </Text>
            {data.sizeChart ? (
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="info">{data.sizeChart.name}</Badge>
                <Text as="span" variant="bodySm" tone="subdued">
                  (ID: {data.sizeChart.id})
                </Text>
              </InlineStack>
            ) : (
              <Text as="p" variant="bodySm" tone="subdued">
                No size chart assigned to this product.
              </Text>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* Fit Recommendation Preview */}
      <Layout.Section>
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Fit Recommendation Preview
            </Text>
            {data.recommendedSize ? (
              <InlineStack gap="300" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Recommended Size
                  </Text>
                  <Text as="span" variant="headingLg">
                    {data.recommendedSize}
                  </Text>
                </BlockStack>
                {data.confidence !== null && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Confidence
                    </Text>
                    <Badge tone={data.confidence >= 0.8 ? 'success' : data.confidence >= 0.5 ? 'warning' : 'critical'}>
                      {(data.confidence * 100).toFixed(0)}%
                    </Badge>
                  </BlockStack>
                )}
              </InlineStack>
            ) : (
              <Text as="p" variant="bodySm" tone="subdued">
                No recommendation data available yet. Ensure the product has a size
                chart and sufficient review data.
              </Text>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
