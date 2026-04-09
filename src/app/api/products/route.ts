import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import type { PaginatedResponse, ProductFitSummary } from "@/types";

interface ProductWithCounts {
  id: string;
  title: string;
  imageUrl: string | null;
  fitScore: number | null;
  fitConfusion: number | null;
  status: string;
  _count: {
    variants: number;
    reviews: number;
    returns: number;
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const shopAuth = await getShopFromRequest(request);

    if (!shopAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10))
    );
    const search = url.searchParams.get("search") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const minFitScore = url.searchParams.get("minFitScore")
      ? parseFloat(url.searchParams.get("minFitScore")!)
      : undefined;
    const maxFitScore = url.searchParams.get("maxFitScore")
      ? parseFloat(url.searchParams.get("maxFitScore")!)
      : undefined;

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const where: {
      shopId: string;
      title?: { contains: string; mode: "insensitive" };
      status?: string;
      fitScore?: { gte?: number; lte?: number };
    } = {
      shopId: shop.id,
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (minFitScore !== undefined || maxFitScore !== undefined) {
      where.fitScore = {};
      if (minFitScore !== undefined) {
        where.fitScore.gte = minFitScore;
      }
      if (maxFitScore !== undefined) {
        where.fitScore.lte = maxFitScore;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          _count: {
            select: {
              variants: true,
              reviews: true,
              returns: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const items: ProductFitSummary[] = (products as ProductWithCounts[]).map((product) => ({
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      variantCount: product._count.variants,
      fitScore: product.fitScore,
      fitConfusion: product.fitConfusion,
      returnCount: product._count.returns,
      reviewCount: product._count.reviews,
      status: product.status,
    }));

    const response: PaginatedResponse<ProductFitSummary> = {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch products: ${message}` },
      { status: 500 }
    );
  }
}
