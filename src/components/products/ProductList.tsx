'use client';

import {
  Card,
  IndexTable,
  Thumbnail,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  SkeletonBodyText,
  EmptyState,
} from '@shopify/polaris';
import type { IndexTableRowProps } from '@shopify/polaris';

interface ProductEntry {
  id: string;
  title: string;
  imageUrl: string | null;
  variantCount: number;
  fitScore: number | null;
  fitConfusion: number | null;
  returnCount: number;
  status: string;
}

interface ProductListProps {
  products: ProductEntry[];
  onSelect: (id: string) => void;
  loading: boolean;
}

function getFitScoreBadge(score: number | null) {
  if (score === null) return <Badge>N/A</Badge>;
  const pct = (score * 100).toFixed(0);
  if (score >= 0.8) return <Badge tone="success">{pct}%</Badge>;
  if (score >= 0.5) return <Badge tone="warning">{pct}%</Badge>;
  return <Badge tone="critical">{pct}%</Badge>;
}

function getConfusionBadge(confusion: number | null) {
  if (confusion === null) return <Badge>N/A</Badge>;
  const pct = (confusion * 100).toFixed(0);
  if (confusion > 0.7) return <Badge tone="critical">{pct}%</Badge>;
  if (confusion > 0.4) return <Badge tone="warning">{pct}%</Badge>;
  return <Badge tone="success">{pct}%</Badge>;
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return <Badge tone="success">Active</Badge>;
    case 'draft':
      return <Badge>Draft</Badge>;
    case 'archived':
      return <Badge tone="info">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function ProductList({ products, onSelect, loading }: ProductListProps) {
  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  if (loading) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Products
          </Text>
          <SkeletonBodyText lines={8} />
        </BlockStack>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No products found"
          image=""
        >
          <p>
            Sync your Shopify products to start tracking fit data and size
            recommendations.
          </p>
        </EmptyState>
      </Card>
    );
  }

  const rowMarkup = products.map((product, index) => {
    const rowProps: IndexTableRowProps = {
      id: product.id,
      position: index,
      onClick: () => onSelect(product.id),
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
          <Text as="span" variant="bodyMd">
            {product.variantCount}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {getFitScoreBadge(product.fitScore)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {getConfusionBadge(product.fitConfusion)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {product.returnCount}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {getStatusBadge(product.status)}
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Products
        </Text>
        <IndexTable
          resourceName={resourceName}
          itemCount={products.length}
          headings={[
            { title: 'Product' },
            { title: 'Variants' },
            { title: 'Fit Score' },
            { title: 'Confusion' },
            { title: 'Returns' },
            { title: 'Status' },
          ]}
          selectable={true}
        >
          {rowMarkup}
        </IndexTable>
      </BlockStack>
    </Card>
  );
}
