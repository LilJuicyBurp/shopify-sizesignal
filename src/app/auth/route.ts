import { NextResponse } from "next/server";
import crypto from "crypto";
import shopify from "@/lib/shopify";

const SHOP_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Missing shop parameter" },
        { status: 400 }
      );
    }

    if (!SHOP_DOMAIN_REGEX.test(shop)) {
      return NextResponse.json(
        { success: false, error: "Invalid shop domain. Must end in .myshopify.com" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SHOPIFY_API_KEY ?? "";
    const scopes = process.env.SHOPIFY_SCOPES ?? "";
    const appUrl = process.env.SHOPIFY_APP_URL ?? "";
    const redirectUri = `${appUrl}/auth/callback`;
    const nonce = crypto.randomBytes(16).toString("hex");

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set("client_id", apiKey);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", nonce);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Auth begin failed: ${message}` },
      { status: 500 }
    );
  }
}
