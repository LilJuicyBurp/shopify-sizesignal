'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Badge,
  Collapsible,
  List,
  Text,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';

interface SizeChartIssue {
  type: string;
  severity: string;
  message: string;
}

interface SizeChartEntry {
  id: string;
  name: string;
  healthScore: number | null;
  productCount: number;
  issues: SizeChartIssue[] | null;
}

interface SizeChartHealthProps {
  charts: SizeChartEntry[];
}

function getHealthBadge(score: number | null) {
  if (score === null) {
    return <Badge>N/A</Badge>;
  }
  if (score > 80) {
    return <Badge tone="success">{score}%</Badge>;
  }
  if (score > 60) {
    return <Badge tone="warning">{score}%</Badge>;
  }
  return <Badge tone="critical">{score}%</Badge>;
}

function getSeverityTone(severity: string): 'critical' | 'warning' | undefined {
  if (severity === 'error') return 'critical';
  if (severity === 'warning') return 'warning';
  return undefined;
}

export function SizeChartHealth({ charts }: SizeChartHealthProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Size Chart Health
        </Text>

        {charts.length === 0 ? (
          <Text as="p" variant="bodySm" tone="subdued">
            No size charts found. Create a size chart to see health insights.
          </Text>
        ) : (
          <ResourceList
            resourceName={{ singular: 'size chart', plural: 'size charts' }}
            items={charts}
            renderItem={(chart: SizeChartEntry) => {
              const issueCount = chart.issues?.length ?? 0;
              const isExpanded = expandedIds.has(chart.id);

              return (
                <ResourceItem
                  id={chart.id}
                  onClick={() => toggleExpanded(chart.id)}
                  accessibilityLabel={`View details for ${chart.name}`}
                >
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {chart.name}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {chart.productCount} product{chart.productCount !== 1 ? 's' : ''}
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        {issueCount > 0 && (
                          <Badge tone="attention">
                            {issueCount} issue{issueCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {getHealthBadge(chart.healthScore)}
                      </InlineStack>
                    </InlineStack>

                    <Collapsible
                      open={isExpanded}
                      id={`chart-issues-${chart.id}`}
                      transition={{
                        duration: '200ms',
                        timingFunction: 'ease-in-out',
                      }}
                    >
                      {chart.issues && chart.issues.length > 0 ? (
                        <div style={{ paddingTop: '8px' }}>
                          <List>
                            {chart.issues.map((issue, idx) => (
                              <List.Item key={`${chart.id}-issue-${idx}`}>
                                <InlineStack gap="200" blockAlign="center">
                                  <Badge tone={getSeverityTone(issue.severity)}>
                                    {issue.severity}
                                  </Badge>
                                  <Text as="span" variant="bodySm">
                                    {issue.message}
                                  </Text>
                                </InlineStack>
                              </List.Item>
                            ))}
                          </List>
                        </div>
                      ) : (
                        <div style={{ paddingTop: '8px' }}>
                          <Text as="p" variant="bodySm" tone="subdued">
                            No issues detected.
                          </Text>
                        </div>
                      )}
                    </Collapsible>
                  </BlockStack>
                </ResourceItem>
              );
            }}
          />
        )}
      </BlockStack>
    </Card>
  );
}
