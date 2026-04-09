import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import {
  createSubscription,
  cancelSubscription,
  getActiveSubscription,
  PLANS,
} from "@/lib/billing";
import type { BillingStatus } from "@/types";

interface BillingAction {
  plan: string;
  action: "subscribe" | "cancel";
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

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const productCount = await prisma.product.count({
      where: { shopId: shop.id },
    });

    const planDetails = PLANS[shop.plan];
    let subscriptionStatus: string | null = null;

    if (shop.billingId) {
      const activeSub = await getActiveSubscription(
        shopAuth.shop,
        shopAuth.accessToken
      );
      subscriptionStatus = activeSub?.status ?? null;
    }

    const billingStatus: BillingStatus = {
      currentPlan: shop.plan,
      productsUsed: productCount,
      productLimit: planDetails?.productLimit ?? 0,
      billingId: shop.billingId,
      subscriptionStatus,
    };

    return NextResponse.json({ success: true, data: billingStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to get billing status: ${message}` },
      { status: 500 }
    );
  }
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

    const body: BillingAction = await request.json();

    if (!body.plan || !body.action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: plan, action" },
        { status: 400 }
      );
    }

    if (body.action !== "subscribe" && body.action !== "cancel") {
      return NextResponse.json(
        { success: false, error: "Action must be 'subscribe' or 'cancel'" },
        { status: 400 }
      );
    }

    if (body.action === "subscribe") {
      if (!PLANS[body.plan]) {
        return NextResponse.json(
          { success: false, error: `Unknown plan: ${body.plan}` },
          { status: 400 }
        );
      }

      const confirmationUrl = await createSubscription(
        shopAuth.shop,
        shopAuth.accessToken,
        body.plan
      );

      return NextResponse.json({
        success: true,
        data: { confirmationUrl },
      });
    }

    // Cancel subscription
    if (!shop.billingId) {
      return NextResponse.json(
        { success: false, error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    const cancelled = await cancelSubscription(
      shopAuth.shop,
      shopAuth.accessToken,
      shop.billingId
    );

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        plan: "FREE",
        billingId: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { plan: "FREE", message: "Subscription cancelled" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Billing action failed: ${message}` },
      { status: 500 }
    );
  }
}
