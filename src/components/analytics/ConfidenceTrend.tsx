'use client';

import { useMemo } from 'react';
import {
  Card,
  Text,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';

interface ConfidenceDataPoint {
  date: string;
  avgConfidence: number;
  recommendations: number;
}

interface ConfidenceTrendProps {
  data: ConfidenceDataPoint[];
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

export function ConfidenceTrend({ data }: ConfidenceTrendProps) {
  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  const { polylinePath, points, maxConfidence, totalRecs } = useMemo(() => {
    if (data.length === 0) {
      return { polylinePath: '', points: [] as Array<{ x: number; y: number; point: ConfidenceDataPoint }>, maxConfidence: 100, totalRecs: 0 };
    }

    const maxConf = Math.max(...data.map((d) => d.avgConfidence), 1);
    const cappedMax = Math.min(Math.ceil(maxConf / 10) * 10, 100);

    const pts = data.map((point, index) => {
      const x = PADDING.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
      const y = PADDING.top + chartHeight - (point.avgConfidence / cappedMax) * chartHeight;
      return { x, y, point };
    });

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const total = data.reduce((sum, d) => sum + d.recommendations, 0);

    return { polylinePath: path, points: pts, maxConfidence: cappedMax, totalRecs: total };
  }, [data, chartWidth, chartHeight]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Confidence Trend
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            No confidence data available yet.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const avgConfidence = data.reduce((sum, d) => sum + d.avgConfidence, 0) / data.length;

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= maxConfidence);

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Confidence Trend
        </Text>

        {/* SVG Line Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{ width: '100%', maxWidth: `${SVG_WIDTH}px`, height: 'auto' }}
          >
            {/* Grid lines */}
            {yTicks.map((tick) => {
              const y = PADDING.top + chartHeight - (tick / maxConfidence) * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1={PADDING.left}
                    y1={y}
                    x2={PADDING.left + chartWidth}
                    y2={y}
                    stroke="#e0e0e0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PADDING.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#666"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* X-axis */}
            <line
              x1={PADDING.left}
              y1={PADDING.top + chartHeight}
              x2={PADDING.left + chartWidth}
              y2={PADDING.top + chartHeight}
              stroke="#ccc"
            />

            {/* X-axis labels */}
            {data.map((point, index) => {
              const showLabel = data.length <= 10 || index % Math.ceil(data.length / 10) === 0;
              if (!showLabel) return null;
              const x = PADDING.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
              return (
                <text
                  key={point.date}
                  x={x}
                  y={PADDING.top + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                >
                  {formatDate(point.date)}
                </text>
              );
            })}

            {/* Confidence line */}
            <path
              d={polylinePath}
              fill="none"
              stroke="#2C6ECB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Area fill under line */}
            {points.length > 0 && (
              <path
                d={`${polylinePath} L ${points[points.length - 1].x} ${PADDING.top + chartHeight} L ${points[0].x} ${PADDING.top + chartHeight} Z`}
                fill="#2C6ECB"
                fillOpacity="0.1"
              />
            )}

            {/* Data points */}
            {points.map((p) => (
              <g key={p.point.date}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#2C6ECB"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <title>
                  {formatDate(p.point.date)}: {p.point.avgConfidence.toFixed(1)}% confidence, {p.point.recommendations} recs
                </title>
              </g>
            ))}
          </svg>
        </div>

        {/* Summary metrics */}
        <InlineStack gap="400">
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Average Confidence
            </Text>
            <Text as="span" variant="headingSm">
              {avgConfidence.toFixed(1)}%
            </Text>
          </BlockStack>
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Total Recommendations
            </Text>
            <Text as="span" variant="headingSm">
              {totalRecs.toLocaleString()}
            </Text>
          </BlockStack>
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Latest Confidence
            </Text>
            <Text as="span" variant="headingSm">
              {data[data.length - 1].avgConfidence.toFixed(1)}%
            </Text>
          </BlockStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
