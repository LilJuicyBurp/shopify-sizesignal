import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import { getShopifyClient } from "@/lib/shopify";
import type { SyncResult } from "@/types";

interface ShopifyGraphQLProduct {
  id: string;
  title: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: string[];
  status: string;
  featuredImage: { url: string } | null;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string | null;
        price: string;
        inventoryQuantity: number;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
}

interface ProductsQueryResponse {
  products: {
    edges: Array<{ node: ShopifyGraphQLProduct; cursor: string }>;
    pageInfo: { hasNextPage: boolean };
  };
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          handle
          productType
          vendor
          tags
          status
          featuredImage {
            url
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryQuantity
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

function extractSize(
  selectedOptions: Array<{ name: string; value: string }>
): string | null {
  const sizeOption = selectedOptions.find(
    (opt) => opt.name.toLowerCase() === "size"
  );
  return sizeOption?.value ?? null;
}

function extractColor(
  selectedOptions: Array<{ name: string; value: string }>
): string | null {
  const colorOption = selectedOptions.find(
    (opt) => opt.name.toLowerCase() === "color" || opt.name.toLowerCase() === "colour"
  );
  return colorOption?.value ?? null;
}

function extractShopifyNumericId(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const shopAuth = await getShopFromRequest(request);

    if (!shopAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const client = getShopifyClient(shopAuth.shop, shopAuth.accessToken);

    const result: SyncResult = {
      productsCreated: 0,
      productsUpdated: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      errors: [],
    };

    let hasNextPage = true;
    let afterCursor: string | null = null;

    while (hasNextPage) {
      const variables: { first: number; after?: string } = { first: 50 };
      if (afterCursor) {
        variables.after = afterCursor;
      }

      const response = await client.request<ProductsQueryResponse>(PRODUCTS_QUERY, {
        variables,
      });

      const { edges, pageInfo } = response.data.products;

      for (const edge of edges) {
        const productNode = edge.node;
        const shopifyProductId = extractShopifyNumericId(productNode.id);

        try {
          const existingProduct = await prisma.product.findUnique({
            where: {
              shopId_shopifyId: {
                shopId: shop.id,
                shopifyId: shopifyProductId,
              },
            },
          });

          const productData = {
            title: productNode.title,
            handle: productNode.handle,
            productType: productNode.productType || null,
            vendor: productNode.vendor || null,
            tags: productNode.tags,
            imageUrl: productNode.featuredImage?.url ?? null,
            status: productNode.status.toLowerCase(),
            lastSyncedAt: new Date(),
          };

          const product = await prisma.product.upsert({
            where: {
              shopId_shopifyId: {
                shopId: shop.id,
                shopifyId: shopifyProductId,
              },
            },
            create: {
              shopId: shop.id,
              shopifyId: shopifyProductId,
              ...productData,
            },
            update: productData,
          });

          if (existingProduct) {
            result.productsUpdated++;
          } else {
            result.productsCreated++;
          }

          for (const variantEdge of productNode.variants.edges) {
            const variantNode = variantEdge.node;
            const shopifyVariantId = extractShopifyNumericId(variantNode.id);
            const size = extractSize(variantNode.selectedOptions);
            const color = extractColor(variantNode.selectedOptions);

            const existingVariant = await prisma.variant.findUnique({
              where: {
                productId_shopifyId: {
                  productId: product.id,
                  shopifyId: shopifyVariantId,
                },
              },
            });

            const variantData = {
              title: variantNode.title,
              size,
              color,
              sku: variantNode.sku ?? null,
              price: variantNode.price ? parseFloat(variantNode.price) : null,
              inventoryQty: variantNode.inventoryQuantity,
            };

            await prisma.variant.upsert({
              where: {
                productId_shopifyId: {
                  productId: product.id,
                  shopifyId: shopifyVariantId,
                },
              },
              create: {
                productId: product.id,
                shopifyId: shopifyVariantId,
                ...variantData,
              },
              update: variantData,
            });

            if (existingVariant) {
              result.variantsUpdated++;
            } else {
              result.variantsCreated++;
            }
          }
        } catch (productError) {
          const errMsg =
            productError instanceof Error
              ? productError.message
              : "Unknown error";
          result.errors.push(
            `Failed to sync product ${shopifyProductId}: ${errMsg}`
          );
        }
      }

      hasNextPage = pageInfo.hasNextPage;
      if (edges.length > 0) {
        afterCursor = edges[edges.length - 1].cursor;
      } else {
        hasNextPage = false;
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Product sync failed: ${message}` },
      { status: 500 }
    );
  }
}
