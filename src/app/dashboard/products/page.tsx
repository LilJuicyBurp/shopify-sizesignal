'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Select,
  IndexTable,
  Thumbnail,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  Button,
  Pagination,
  Spinner,
  Banner,
  Modal,
  ProgressBar,
  Divider,
  SkeletonBodyText,
} from '@shopify/polaris';
import type {
  ProductFitSummary,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

type StatusFilter = '' | 'active' | 'draft' | 'archived';

interface ProductFilters {
  search: string;
  status: StatusFilter;
  minFitScore: string;
  maxFitScore: string;
}

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductFitSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductFitSummary | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    status: '',
    minFitScore: '',
    maxFitScore: '',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.minFitScore) params.set('minFitScore', filters.minFitScore);
      if (filters.maxFitScore) params.set('maxFitScore', filters.maxFitScore);

      const response = await fetch(`/api/products?${params.toString()}`);
      const result: ApiResponse<PaginatedResponse<ProductFitSummary>> = await response.json();

      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to load products');
        return;
      }

      setProducts(result.data.items);
      setTotal(result.data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value as StatusFilter }));
    setPage(1);
  }, []);

  const handleMinFitScoreChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, minFitScore: value }));
    setPage(1);
  }, []);

  const handleMaxFitScoreChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, maxFitScore: value }));
    setPage(1);
  }, []);

  const handleProductClick = useCallback((product: ProductFitSummary) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row
      id={product.productId}
      key={product.productId}
      position={index}
      onClick={() => handleProductClick(product)}
    >
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center">
          <Thumbnail
            source={product.imageUrl ?? 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'}
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
        <FitScoreBadge score={product.fitScore} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <ConfusionBadge score={product.fitConfusion} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {product.returnCount}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={product.status === 'active' ? 'success' : undefined}>
          {product.status}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Product Fit Dashboard">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="start">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Search products"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="Search by product title..."
                    autoComplete="off"
                    clearButton
                    onClearButtonClick={() => handleSearchChange('')}
                  />
                </div>
                <div style={{ minWidth: '160px' }}>
                  <Select
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={handleStatusChange}
                  />
                </div>
                <div style={{ minWidth: '120px' }}>
                  <TextField
                    label="Min Fit Score"
                    type="number"
                    value={filters.minFitScore}
                    onChange={handleMinFitScoreChange}
                    placeholder="0"
                    autoComplete="off"
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
                <div style={{ minWidth: '120px' }}>
                  <TextField
                    label="Max Fit Score"
                    type="number"
                    value={filters.maxFitScore}
                    onChange={handleMaxFitScoreChange}
                    placeholder="1"
                    autoComplete="off"
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {loading ? (
              <BlockStack gap="400">
                <SkeletonBodyText lines={5} />
                <BlockStack align="center" inlineAlign="center">
                  <Spinner accessibilityLabel="Loading products" size="large" />
                </BlockStack>
              </BlockStack>
            ) : (
              <BlockStack gap="400">
                <IndexTable
                  resourceName={{ singular: 'product', plural: 'products' }}
                  itemCount={products.length}
                  headings={[
                    { title: 'Product' },
                    { title: 'Variants' },
                    { title: 'Fit Score' },
                    { title: 'Confusion Score' },
                    { title: 'Returns' },
                    { title: 'Status' },
                  ]}
                  selectable={false}
                >
                  {rowMarkup}
                </IndexTable>
                <InlineStack align="center">
                  <Pagination
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    onPrevious={handlePreviousPage}
                    onNext={handleNextPage}
                  />
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} products
                </Text>
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={detailModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </Page>
  );
}

function ProductDetailModal({
  product,
  open,
  onClose,
}: {
  product: ProductFitSummary;
  open: boolean;
  onClose: () => void;
}) {
  const sizeDistribution = [
    { size: 'XS', percentage: 8 },
    { size: 'S', percentage: 18 },
    { size: 'M', percentage: 32 },
    { size: 'L', percentage: 25 },
    { size: 'XL', percentage: 12 },
    { size: 'XXL', percentage: 5 },
  ];

  const sentimentBreakdown = [
    { label: 'Runs Small', percentage: 35, tone: 'warning' as const },
    { label: 'True to Size', percentage: 45, tone: 'success' as const },
    { label: 'Runs Large', percentage: 20, tone: 'info' as const },
  ];

  const returnReasons = [
    { reason: 'Too Small', count: 12 },
    { reason: 'Too Large', count: 8 },
    { reason: 'Fit Issue', count: 5 },
    { reason: 'Style', count: 3 },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.title}
      large
    >
      <Modal.Section>
        <BlockStack gap="600">
          <InlineStack gap="400">
            {product.imageUrl && (
              <Thumbnail source={product.imageUrl} alt={product.title} size="large" />
            )}
            <BlockStack gap="200">
              <InlineStack gap="200">
                <Text as="span" variant="bodySm" tone="subdued">
                  Fit Score:
                </Text>
                <FitScoreBadge score={product.fitScore} />
              </InlineStack>
              <InlineStack gap="200">
                <Text as="span" variant="bodySm" tone="subdued">
                  Confusion:
                </Text>
                <ConfusionBadge score={product.fitConfusion} />
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {product.variantCount} variants | {product.returnCount} returns | {product.reviewCount} reviews
              </Text>
            </BlockStack>
          </InlineStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Size Distribution
            </Text>
            {sizeDistribution.map((item) => (
              <InlineStack key={item.size} gap="300" blockAlign="center">
                <div style={{ minWidth: '40px' }}>
                  <Text as="span" variant="bodySm">
                    {item.size}
                  </Text>
                </div>
                <div style={{ flex: 1 }}>
                  <ProgressBar progress={item.percentage} size="small" />
                </div>
                <div style={{ minWidth: '40px' }}>
                  <Text as="span" variant="bodySm">
                    {item.percentage}%
                  </Text>
                </div>
              </InlineStack>
            ))}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Review Sentiment
            </Text>
            {sentimentBreakdown.map((item) => (
              <InlineStack key={item.label} gap="300" blockAlign="center">
                <div style={{ minWidth: '120px' }}>
                  <Badge tone={item.tone}>{item.label}</Badge>
                </div>
                <div style={{ flex: 1 }}>
                  <ProgressBar progress={item.percentage} size="small" />
                </div>
                <div style={{ minWidth: '40px' }}>
                  <Text as="span" variant="bodySm">
                    {item.percentage}%
                  </Text>
                </div>
              </InlineStack>
            ))}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Return Reasons
            </Text>
            {returnReasons.map((item) => (
              <InlineStack key={item.reason} gap="300" align="space-between">
                <Text as="span" variant="bodyMd">
                  {item.reason}
                </Text>
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  {item.count}
                </Text>
              </InlineStack>
            ))}
          </BlockStack>

          <Divider />

          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              Size Chart Assignment
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              No size chart assigned. Assign a size chart to improve fit recommendations.
            </Text>
            <Button url="/dashboard/products">Manage Size Charts</Button>
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge>N/A</Badge>;
  }
  const percentage = Math.round(score * 100);
  const tone: 'success' | 'warning' | 'critical' =
    score >= 0.7 ? 'success' : score >= 0.4 ? 'warning' : 'critical';
  return <Badge tone={tone}>{percentage}%</Badge>;
}

function ConfusionBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge>N/A</Badge>;
  }
  const percentage = Math.round(score * 100);
  const tone: 'success' | 'warning' | 'critical' =
    score <= 0.2 ? 'success' : score <= 0.5 ? 'warning' : 'critical';
  return <Badge tone={tone}>{percentage}%</Badge>;
}
