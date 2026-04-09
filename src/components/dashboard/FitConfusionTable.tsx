'use client';

import {
  Card,
  IndexTable,
  Thumbnail,
  Badge,
  Text,
  BlockStack,
  InlineStack,
  EmptyState,
} from '@shopify/polaris';
import type { IndexTableRowProps } from '@shopify/polaris';

interface FitConfusionProduct {
  id: string;
  title: string;
  fitConfusion: number | null;
  fitScore: number | null;
  returnCount: number;
  imageUrl: string | null;
}

interface FitConfusionTableProps {
  products: FitConfusionProduct[];
}

function getConfusionBadge(fitConfusion: number | null) {
  if (fitConfusion === null) {
    return <Badge>N/A</Badge>;
  }
  if (fitConfusion > 0.7) {
    return <Badge tone="critical">{(fitConfusion * 100).toFixed(0)}%</Badge>;
  }
  if (fitConfusion > 0.4) {
    return <Badge tone="warning">{(fitConfusion * 100).toFixed(0)}%</Badge>;
  }
  return <Badge tone="success">{(fitConfusion * 100).toFixed(0)}%</Badge>;
}

function getFitScoreBadge(fitScore: number | null) {
  if (fitScore === null) {
    return <Badge>N/A</Badge>;
  }
  return <Badge tone="info">{(fitScore * 100).toFixed(0)}%</Badge>;
}

export function FitConfusionTable({ products }: FitConfusionTableProps) {
  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a.fitConfusion ?? -1;
    const bVal = b.fitConfusion ?? -1;
    return bVal - aVal;
  });

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  if (sortedProducts.length === 0) {
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Products with Highest Fit Confusion
          </Text>
          <EmptyState
            heading="No fit confusion data yet"
            image=""
          >
            <p>
              Sync your products and reviews to see insights.
            </p>
          </EmptyState>
        </BlockStack>
      </Card>
    );
  }

  const rowMarkup = sortedProducts.map(
    (product, index) => {
      const rowProps: IndexTableRowProps = {
        id: product.id,
        position: index,
      };

      return (
        <IndexTable.Row key={product.id} {...rowProps}>
          <IndexTable.Cell>
            <InlineStack gap="300" blockAlign="center" wrap={false}>
              <Thumbnail
                source={product.imageUrl ?? ''}
                alt={product.title}
                size="small"
              />
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {product.title}
              </Text>
            </InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            {getConfusionBadge(product.fitConfusion)}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {getFitScoreBadge(product.fitScore)}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" variant="bodyMd">
              {product.returnCount}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Products with Highest Fit Confusion
        </Text>
        <IndexTable
          resourceName={resourceName}
          itemCount={sortedProducts.length}
          headings={[
            { title: 'Product' },
            { title: 'Fit Confusion' },
            { title: 'Fit Score' },
            { title: 'Returns' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </BlockStack>
    </Card>
  );
}
