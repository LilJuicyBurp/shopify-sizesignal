import { getShopifyClient } from "./shopify";

interface PlanDetails {
  name: string;
  price: number;
  productLimit: number;
  features: string[];
}

export const PLANS: Record<string, PlanDetails> = {
  FREE: {
    name: "Free",
    price: 0,
    productLimit: 50,
    features: [
      "Up to 50 products",
      "Basic size chart",
      "Community support",
    ],
  },
  STARTER: {
    name: "Starter",
    price: 14.99,
    productLimit: 500,
    features: [
      "Up to 500 products",
      "Advanced size charts",
      "Fit recommendations",
      "Return analytics",
      "Email support",
    ],
  },
  GROWTH: {
    name: "Growth",
    price: 39.99,
    productLimit: -1,
    features: [
      "Unlimited products",
      "AI-powered fit predictions",
      "Advanced analytics dashboard",
      "Review sentiment analysis",
      "Custom widget branding",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99.99,
    productLimit: -1,
    features: [
      "Unlimited products",
      "AI-powered fit predictions",
      "Advanced analytics dashboard",
      "Review sentiment analysis",
      "Custom widget branding",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
} as const;

export async function createSubscription(
  shop: string,
  accessToken: string,
  plan: string
): Promise<string> {
  const planDetails = PLANS[plan];
  if (!planDetails) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  const client = getShopifyClient(shop, accessToken);

  const response = await client.request<{
    appSubscriptionCreate: {
      appSubscription: { id: string } | null;
      confirmationUrl: string | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
      appSubscriptionCreate(
        name: $name
        lineItems: $lineItems
        returnUrl: $returnUrl
        test: ${process.env.NODE_ENV !== "production"}
      ) {
        appSubscription {
          id
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        name: planDetails.name,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: planDetails.price, currencyCode: "USD" },
              },
            },
          },
        ],
        returnUrl: `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY ?? ""}`,
      },
    }
  );

  const { appSubscriptionCreate } = response.data;
  if (
    appSubscriptionCreate.userErrors.length > 0 ||
    !appSubscriptionCreate.confirmationUrl
  ) {
    const errors = appSubscriptionCreate.userErrors
      .map((e) => e.message)
      .join(", ");
    throw new Error(`Failed to create subscription: ${errors}`);
  }

  return appSubscriptionCreate.confirmationUrl;
}

export async function cancelSubscription(
  shop: string,
  accessToken: string,
  subscriptionId: string
): Promise<boolean> {
  const client = getShopifyClient(shop, accessToken);

  const response = await client.request<{
    appSubscriptionCancel: {
      appSubscription: { id: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation AppSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        id: subscriptionId,
      },
    }
  );

  const { appSubscriptionCancel } = response.data;
  return appSubscriptionCancel.userErrors.length === 0;
}

export async function getActiveSubscription(
  shop: string,
  accessToken: string
): Promise<{ id: string; name: string; status: string } | null> {
  const client = getShopifyClient(shop, accessToken);

  const response = await client.request<{
    currentAppInstallation: {
      activeSubscriptions: Array<{
        id: string;
        name: string;
        status: string;
      }>;
    };
  }>(
    `query GetActiveSubscription {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
        }
      }
    }`
  );

  const subscriptions =
    response.data.currentAppInstallation.activeSubscriptions;
  if (subscriptions.length === 0) {
    return null;
  }

  return subscriptions[0];
}
