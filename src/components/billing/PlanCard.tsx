'use client';

import {
  Card,
  Text,
  Button,
  Icon,
  List,
  Badge,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';

interface PlanCardProps {
  name: string;
  price: number;
  productLimit: number;
  features: string[];
  isCurrent: boolean;
  onSelect: () => void;
  loading: boolean;
}

function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}/mo`;
}

function formatProductLimit(limit: number): string {
  if (limit <= 0) return 'Unlimited products';
  return `Up to ${limit} products`;
}

function getCtaLabel(isCurrent: boolean, currentPrice: number, targetPrice: number): string {
  if (isCurrent) return 'Current Plan';
  if (targetPrice > currentPrice) return 'Upgrade';
  return 'Downgrade';
}

export function PlanCard({
  name,
  price,
  productLimit,
  features,
  isCurrent,
  onSelect,
  loading,
}: PlanCardProps) {
  return (
    <div
      style={{
        border: isCurrent ? '2px solid var(--p-color-border-info)' : '1px solid var(--p-color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1,
          }}
        >
          <Badge tone="info">Current</Badge>
        </div>
      )}
      <Card>
        <BlockStack gap="400">
          {/* Plan name */}
          <Text as="h2" variant="headingMd">
            {name}
          </Text>

          {/* Price */}
          <BlockStack gap="100">
            <Text as="p" variant="headingXl">
              {formatPrice(price)}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {formatProductLimit(productLimit)}
            </Text>
          </BlockStack>

          {/* Features */}
          <List>
            {features.map((feature) => (
              <List.Item key={feature}>
                <InlineStack gap="200" blockAlign="center" wrap={false}>
                  <div style={{ flexShrink: 0, color: 'var(--p-color-icon-success)' }}>
                    <Icon source={CheckIcon} />
                  </div>
                  <Text as="span" variant="bodySm">
                    {feature}
                  </Text>
                </InlineStack>
              </List.Item>
            ))}
          </List>

          {/* CTA */}
          <Button
            variant={isCurrent ? 'secondary' : 'primary'}
            onClick={onSelect}
            disabled={isCurrent}
            loading={loading}
            fullWidth
          >
            {getCtaLabel(isCurrent, isCurrent ? price : 0, price)}
          </Button>
        </BlockStack>
      </Card>
    </div>
  );
}
