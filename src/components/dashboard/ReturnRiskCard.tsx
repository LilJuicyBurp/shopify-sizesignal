'use client';

import {
  Card,
  Text,
  Badge,
  InlineStack,
  BlockStack,
} from '@shopify/polaris';

interface ReturnReason {
  reason: string;
  count: number;
  percentage: number;
}

interface ReturnRiskCardProps {
  returnRate: number;
  topReasons: ReturnReason[];
}

function getReturnRateTone(rate: number): 'critical' | 'warning' | 'success' {
  if (rate > 15) return 'critical';
  if (rate > 8) return 'warning';
  return 'success';
}

export function ReturnRiskCard({ returnRate, topReasons }: ReturnRiskCardProps) {
  const tone = getReturnRateTone(returnRate);
  const maxPercentage = Math.max(...topReasons.map((r) => r.percentage), 1);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Return Risk Overview
        </Text>

        <InlineStack gap="300" blockAlign="center">
          <Text as="span" variant="headingXl">
            {returnRate.toFixed(1)}%
          </Text>
          <Badge tone={tone}>
            {tone === 'critical'
              ? 'High Risk'
              : tone === 'warning'
                ? 'Moderate Risk'
                : 'Low Risk'}
          </Badge>
        </InlineStack>

        <Text as="p" variant="bodySm" tone="subdued">
          Overall return rate
        </Text>

        {topReasons.length > 0 && (
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Top Return Reasons
            </Text>
            {topReasons.map((reason) => {
              const barWidth = (reason.percentage / maxPercentage) * 100;

              return (
                <BlockStack key={reason.reason} gap="100">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodySm">
                      {reason.reason}
                    </Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {reason.count} ({reason.percentage.toFixed(1)}%)
                    </Text>
                  </InlineStack>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--p-color-bg-surface-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        backgroundColor:
                          tone === 'critical'
                            ? 'var(--p-color-bg-fill-critical)'
                            : tone === 'warning'
                              ? 'var(--p-color-bg-fill-warning)'
                              : 'var(--p-color-bg-fill-success)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </BlockStack>
              );
            })}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
