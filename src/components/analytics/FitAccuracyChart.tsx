'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Text,
  Tooltip,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';

interface FitAccuracyDataPoint {
  date: string;
  accuracy: number;
}

interface FitAccuracyChartProps {
  data: FitAccuracyDataPoint[];
}

const CHART_HEIGHT = 200;
const BAR_GAP = 4;

export function FitAccuracyChart({ data }: FitAccuracyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxAccuracy = 100;
  const barWidth = useMemo(() => {
    if (data.length === 0) return 0;
    const availableWidth = 100;
    return Math.max((availableWidth - data.length * BAR_GAP) / data.length, 2);
  }, [data.length]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Fit Accuracy Over Time
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            No accuracy data available yet.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Fit Accuracy Over Time
        </Text>

        <div style={{ position: 'relative', width: '100%' }}>
          {/* Y-axis labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 24,
              width: '40px',
              height: `${CHART_HEIGHT}px`,
            }}
          >
            {[100, 75, 50, 25, 0].map((val) => (
              <Text key={val} as="span" variant="bodySm" tone="subdued">
                {val}%
              </Text>
            ))}
          </div>

          {/* Chart area */}
          <div
            style={{
              marginLeft: '48px',
              height: `${CHART_HEIGHT}px`,
              display: 'flex',
              alignItems: 'flex-end',
              gap: `${BAR_GAP}px`,
              borderBottom: '1px solid var(--p-color-border-secondary)',
              borderLeft: '1px solid var(--p-color-border-secondary)',
              padding: '0 4px',
              position: 'relative',
            }}
          >
            {/* Grid lines */}
            {[25, 50, 75].map((val) => (
              <div
                key={val}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${(val / maxAccuracy) * 100}%`,
                  borderBottom: '1px dashed var(--p-color-border-secondary)',
                  opacity: 0.5,
                }}
              />
            ))}

            {data.map((point, index) => {
              const barHeight = (point.accuracy / maxAccuracy) * CHART_HEIGHT;
              const isHovered = hoveredIndex === index;

              return (
                <Tooltip
                  key={point.date}
                  content={`${formatDate(point.date)}: ${point.accuracy.toFixed(1)}%`}
                >
                  <div
                    style={{
                      flex: `0 0 ${barWidth}%`,
                      height: `${barHeight}px`,
                      backgroundColor: isHovered
                        ? 'var(--p-color-bg-fill-info-active)'
                        : 'var(--p-color-bg-fill-info)',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease, height 0.3s ease',
                      minWidth: '8px',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </Tooltip>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div
            style={{
              marginLeft: '48px',
              display: 'flex',
              gap: `${BAR_GAP}px`,
              padding: '4px 4px 0',
            }}
          >
            {data.map((point, index) => {
              const showLabel = data.length <= 10 || index % Math.ceil(data.length / 10) === 0;
              return (
                <div
                  key={point.date}
                  style={{
                    flex: `0 0 ${barWidth}%`,
                    minWidth: '8px',
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {showLabel && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      {formatDate(point.date)}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <InlineStack gap="400">
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Latest
            </Text>
            <Text as="span" variant="headingSm">
              {data[data.length - 1].accuracy.toFixed(1)}%
            </Text>
          </BlockStack>
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Average
            </Text>
            <Text as="span" variant="headingSm">
              {(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length).toFixed(1)}%
            </Text>
          </BlockStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
