'use client';

import {
  Card,
  Text,
  InlineStack,
  BlockStack,
} from '@shopify/polaris';

interface ReturnReasonBreakdownProps {
  data: Record<string, number>;
}

const SIZE_RELATED_KEYWORDS = [
  'too small',
  'too large',
  'too big',
  'too tight',
  'too loose',
  'wrong size',
  'size',
  'fit',
  'sizing',
  'length',
  'width',
];

function isSizeRelated(reason: string): boolean {
  const lower = reason.toLowerCase();
  return SIZE_RELATED_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function ReturnReasonBreakdown({ data }: ReturnReasonBreakdownProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const totalCount = entries.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = entries.length > 0 ? entries[0][1] : 1;

  if (entries.length === 0) {
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Return Reason Breakdown
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            No return reason data available yet.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Return Reason Breakdown
        </Text>

        <BlockStack gap="300">
          {entries.map(([reason, count]) => {
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const barWidth = (count / maxCount) * 100;
            const sizeRelated = isSizeRelated(reason);

            return (
              <BlockStack key={reason} gap="100">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">
                      {reason}
                    </Text>
                    {sizeRelated && (
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--p-color-bg-fill-critical-secondary)',
                          fontSize: '11px',
                          color: 'var(--p-color-text-critical)',
                        }}
                      >
                        Size-related
                      </div>
                    )}
                  </InlineStack>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {count} ({percentage.toFixed(1)}%)
                  </Text>
                </InlineStack>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: 'var(--p-color-bg-surface-secondary)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: sizeRelated
                        ? 'var(--p-color-bg-fill-critical)'
                        : 'var(--p-color-bg-fill-secondary)',
                      borderRadius: '5px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </BlockStack>
            );
          })}
        </BlockStack>

        {/* Summary */}
        <InlineStack gap="400">
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Total Returns
            </Text>
            <Text as="span" variant="headingSm">
              {totalCount}
            </Text>
          </BlockStack>
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Size-Related
            </Text>
            <Text as="span" variant="headingSm">
              {entries
                .filter(([reason]) => isSizeRelated(reason))
                .reduce((sum, [, count]) => sum + count, 0)}
            </Text>
          </BlockStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
