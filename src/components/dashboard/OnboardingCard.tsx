'use client';

import { useCallback } from 'react';
import {
  Card,
  Button,
  Icon,
  InlineStack,
  BlockStack,
  Text,
  ProgressBar,
  Badge,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  ProductIcon,
  ChartVerticalFilledIcon,
  PaintBrushFlatIcon,
  ViewIcon,
} from '@shopify/polaris-icons';

interface OnboardingCardProps {
  currentStep: number;
  onSyncProducts: () => void;
  syncing: boolean;
  syncComplete: boolean;
}

interface StepConfig {
  title: string;
  description: string;
  icon: typeof ProductIcon;
}

const STEPS: StepConfig[] = [
  {
    title: 'Sync Your Products',
    description: 'Import your products from Shopify to start analyzing fit data.',
    icon: ProductIcon,
  },
  {
    title: 'Set Up Size Charts',
    description: 'Create or import size charts for your products.',
    icon: ChartVerticalFilledIcon,
  },
  {
    title: 'Configure Widget',
    description: 'Customize the size recommendation widget for your storefront.',
    icon: PaintBrushFlatIcon,
  },
  {
    title: 'Activate on Storefront',
    description:
      'Enable the SizeSignal app block in your theme editor to display the widget on product pages.',
    icon: ViewIcon,
  },
];

export function OnboardingCard({
  currentStep,
  onSyncProducts,
  syncing,
  syncComplete,
}: OnboardingCardProps) {
  const progressPercentage = (currentStep / 4) * 100;

  const renderStepAction = useCallback(
    (stepIndex: number) => {
      const isComplete = stepIndex < currentStep;

      if (isComplete) {
        return <Badge tone="success">Complete</Badge>;
      }

      switch (stepIndex) {
        case 0:
          return (
            <Button
              variant="primary"
              onClick={onSyncProducts}
              loading={syncing}
              disabled={syncComplete}
            >
              {syncComplete ? 'Synced' : 'Sync Products'}
            </Button>
          );
        case 1:
          return (
            <Button url="/dashboard/size-charts" variant="plain">
              Manage Size Charts
            </Button>
          );
        case 2:
          return (
            <Button url="/dashboard/widget-settings" variant="plain">
              Configure Widget
            </Button>
          );
        case 3:
          return (
            <Text as="span" variant="bodySm" tone="subdued">
              Open the Shopify theme editor and add the SizeSignal app block to
              your product page template.
            </Text>
          );
        default:
          return null;
      }
    },
    [currentStep, onSyncProducts, syncing, syncComplete],
  );

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Getting Started
          </Text>
          <Badge>
            {currentStep} of 4 complete
          </Badge>
        </InlineStack>

        <ProgressBar progress={progressPercentage} size="small" tone="primary" />

        <BlockStack gap="300">
          {STEPS.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={step.title}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isCurrent
                    ? 'var(--p-color-bg-surface-selected)'
                    : 'transparent',
                  opacity: !isComplete && !isCurrent ? 0.6 : 1,
                }}
              >
                <InlineStack gap="300" blockAlign="start" wrap={false}>
                  <div style={{ flexShrink: 0 }}>
                    {isComplete ? (
                      <Icon source={CheckCircleIcon} tone="success" />
                    ) : (
                      <Icon source={step.icon} tone={isCurrent ? 'info' : 'subdued'} />
                    )}
                  </div>
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text
                        as="span"
                        variant="bodyMd"
                        fontWeight={isCurrent ? 'semibold' : 'regular'}
                      >
                        {step.title}
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {step.description}
                    </Text>
                    {isCurrent && (
                      <div style={{ marginTop: '8px' }}>
                        {renderStepAction(index)}
                      </div>
                    )}
                  </BlockStack>
                </InlineStack>
              </div>
            );
          })}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
