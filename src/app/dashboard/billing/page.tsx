'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Button,
  Badge,
  ProgressBar,
  Banner,
  Spinner,
  Icon,
  Divider,
  List,
} from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';
import type { BillingStatus, ApiResponse } from '@/types';

interface PlanInfo {
  key: string;
  name: string;
  price: number;
  productLimit: number;
  features: string[];
}

const PLANS: PlanInfo[] = [
  {
    key: 'FREE',
    name: 'Free',
    price: 0,
    productLimit: 50,
    features: [
      'Up to 50 products',
      'Basic size recommendations',
      'Standard widget',
      'Community support',
    ],
  },
  {
    key: 'STARTER',
    name: 'Starter',
    price: 14.99,
    productLimit: 500,
    features: [
      'Up to 500 products',
      'Advanced size recommendations',
      'Full analytics dashboard',
      'Review sentiment analysis',
      'Email support',
    ],
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    price: 39.99,
    productLimit: -1,
    features: [
      'Unlimited products',
      'AI-powered fit predictions',
      'Advanced analytics',
      'Custom widget styling',
      'Priority support',
      'Review sentiment analysis',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99.99,
    productLimit: -1,
    features: [
      'Everything in Growth',
      'API access',
      'White-label widget',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/billing');
      const result: ApiResponse<BillingStatus> = await response.json();

      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to load billing information');
        return;
      }

      setBilling(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load billing';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  const handleChangePlan = useCallback(
    async (planKey: string) => {
      try {
        setChangingPlan(planKey);
        setError(null);
        setSuccessMessage(null);

        const response = await fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planKey }),
        });

        const result: ApiResponse<{ confirmationUrl: string }> = await response.json();

        if (!result.success) {
          setError(result.error ?? 'Failed to change plan');
          return;
        }

        if (result.data?.confirmationUrl) {
          window.open(result.data.confirmationUrl, '_top');
        } else {
          setSuccessMessage(`Plan changed to ${planKey} successfully`);
          void fetchBilling();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to change plan';
        setError(message);
      } finally {
        setChangingPlan(null);
      }
    },
    [fetchBilling],
  );

  if (loading) {
    return (
      <Page title="Plans & Billing">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack align="center" inlineAlign="center">
                <Spinner accessibilityLabel="Loading billing" size="large" />
                <Text as="p" variant="bodyMd">
                  Loading billing information...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const currentPlanKey = billing?.currentPlan ?? 'FREE';
  const usagePercent =
    billing && billing.productLimit > 0
      ? Math.round((billing.productsUsed / billing.productLimit) * 100)
      : 0;

  return (
    <Page title="Plans & Billing">
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
                Current Plan
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="info">{currentPlanKey}</Badge>
                {billing?.subscriptionStatus && (
                  <Badge tone="success">{billing.subscriptionStatus}</Badge>
                )}
              </InlineStack>
              <Divider />
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Products used
                  </Text>
                  <Text as="p" variant="bodySm">
                    {billing?.productsUsed ?? 0} /{' '}
                    {billing?.productLimit === -1 ? 'Unlimited' : billing?.productLimit ?? 50}
                  </Text>
                </InlineStack>
                {billing && billing.productLimit > 0 && (
                  <ProgressBar
                    progress={Math.min(usagePercent, 100)}
                    size="small"
                    tone={usagePercent > 90 ? 'critical' : 'primary'}
                  />
                )}
                {usagePercent > 90 && billing && billing.productLimit > 0 && (
                  <Banner tone="warning">
                    <p>
                      You are using {usagePercent}% of your product limit. Consider upgrading your
                      plan.
                    </p>
                  </Banner>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Text as="h2" variant="headingMd">
            Available Plans
          </Text>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                isCurrent={currentPlanKey === plan.key}
                onSelect={handleChangePlan}
                loading={changingPlan === plan.key}
                currentPlanKey={currentPlanKey}
              />
            ))}
          </InlineGrid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  loading,
  currentPlanKey,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  onSelect: (key: string) => Promise<void>;
  loading: boolean;
  currentPlanKey: string;
}) {
  const handleClick = useCallback(() => {
    void onSelect(plan.key);
  }, [onSelect, plan.key]);

  const currentPlanIndex = PLANS.findIndex((p) => p.key === currentPlanKey);
  const thisPlanIndex = PLANS.findIndex((p) => p.key === plan.key);
  const isUpgrade = thisPlanIndex > currentPlanIndex;
  const isDowngrade = thisPlanIndex < currentPlanIndex;

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h3" variant="headingMd">
              {plan.name}
            </Text>
            {isCurrent && <Badge tone="success">Current</Badge>}
          </InlineStack>
          <InlineStack gap="100" blockAlign="baseline">
            <Text as="span" variant="headingXl">
              ${plan.price.toFixed(2)}
            </Text>
            <Text as="span" variant="bodySm" tone="subdued">
              /mo
            </Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            {plan.productLimit === -1
              ? 'Unlimited products'
              : `Up to ${plan.productLimit} products`}
          </Text>
        </BlockStack>

        <Divider />

        <List>
          {plan.features.map((feature) => (
            <List.Item key={feature}>
              <InlineStack gap="200" blockAlign="center">
                <Icon source={CheckIcon} tone="success" />
                <Text as="span" variant="bodySm">
                  {feature}
                </Text>
              </InlineStack>
            </List.Item>
          ))}
        </List>

        <Button
          variant={isCurrent ? undefined : isUpgrade ? 'primary' : undefined}
          disabled={isCurrent}
          onClick={handleClick}
          loading={loading}
          fullWidth
        >
          {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Select'}
        </Button>
      </BlockStack>
    </Card>
  );
}
