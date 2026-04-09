# SizeSignal AI

**Intelligent size recommendations for Shopify apparel stores. Reduce returns, increase confidence, boost conversions.**

SizeSignal AI is a Shopify embedded app that uses multiple data signals -- product reviews, return patterns, size chart measurements, and customer body profiles -- to deliver accurate, per-product size recommendations directly on your storefront.

## Features

- **AI-powered size recommendations** based on product data, reviews, and return history
- **Fit engine** analyzing review corpus, return patterns, size charts, and customer measurements
- **Storefront widget** (Theme App Extension) with fit quiz and instant recommendations
- **Comprehensive analytics dashboard** with return rate tracking and revenue impact
- **Size chart management** with health scoring and issue detection
- **Shopify Billing API integration** with 4 plan tiers
- **Product sync** from Shopify Admin API
- **Review and return data ingestion** for continuous model improvement

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Shopify Polaris v12+** and **App Bridge v4+**
- **PostgreSQL** via **Prisma ORM**
- **Shopify OAuth** (online + offline tokens)
- **Shopify Billing API** (GraphQL)
- **Theme App Extension** (App Blocks)

## Screenshots

> Screenshots coming soon

## Architecture

```
+-------------------+       +-------------------+       +-------------------+
|   Shopify Store   | ----> | Theme Extension   | ----> |   Widget API      |
|  (Product Pages)  |       | (size-widget)     |       | GET /api/widget   |
+-------------------+       +-------------------+       +--------+----------+
                                                                 |
                                                                 v
                                                        +-------------------+
                                                        |   Fit Engine      |
                                                        | (analyzer, conf.) |
                                                        +--------+----------+
                                                                 |
                                                                 v
+-------------------+       +-------------------+       +-------------------+
|    Merchant       | ----> |   Dashboard       | ----> |   API Routes      |
| (Browser)         |       | (Next.js App)     |       | /api/*            |
+-------------------+       +-------------------+       +--------+----------+
                                                                 |
                                                                 v
+-------------------+       +-------------------+       +-------------------+
| Shopify Webhooks  | ----> | Webhook Handler   | ----> |   PostgreSQL      |
| (orders, products)|       | POST /api/webhooks|       |   (via Prisma)    |
+-------------------+       +-------------------+       +-------------------+
                                                                 ^
+-------------------+       +-------------------+                |
|  Product Sync     | ----> | Shopify Admin API | ---------------+
|  POST /api/sync   |       | (GraphQL)         |
+-------------------+       +-------------------+
```

## Getting Started

For full installation and configuration instructions, see **[SETUP.md](./SETUP.md)**.

Quick start:

```bash
git clone <repo-url>
cd shopify-sizesignal
npm install
cp .env.example .env   # fill in your values
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

## Project Structure

```
shopify-sizesignal/
├── extensions/
│   └── size-widget/                  # Theme App Extension
│       ├── assets/
│       │   ├── size-widget.css       # Widget styles
│       │   └── size-widget.js        # Widget client-side logic
│       ├── blocks/
│       │   └── size-recommender.liquid # App Block template
│       └── shopify.extension.toml    # Extension configuration
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Seed data for development
├── public/
│   └── logo.svg                      # App logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/route.ts    # Analytics data endpoint
│   │   │   ├── billing/route.ts      # Billing management
│   │   │   ├── fit-engine/route.ts   # Fit recommendation endpoint
│   │   │   ├── products/
│   │   │   │   ├── route.ts          # Product listing
│   │   │   │   └── sync/route.ts     # Shopify product sync
│   │   │   ├── returns/route.ts      # Return data ingestion
│   │   │   ├── reviews/route.ts      # Review data ingestion
│   │   │   ├── size-charts/route.ts  # Size chart CRUD
│   │   │   ├── webhooks/route.ts     # Shopify webhook handler
│   │   │   └── widget/route.ts       # Public widget data endpoint
│   │   ├── auth/
│   │   │   ├── callback/route.ts     # OAuth callback
│   │   │   └── route.ts             # OAuth initiation
│   │   ├── dashboard/
│   │   │   ├── analytics/page.tsx    # Analytics page
│   │   │   ├── billing/page.tsx      # Billing/plans page
│   │   │   ├── layout.tsx            # Dashboard layout (Polaris)
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── products/page.tsx     # Products management
│   │   │   ├── settings/page.tsx     # App settings
│   │   │   └── widget-settings/page.tsx # Widget customization
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing / app entry
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── ConfidenceTrend.tsx    # Confidence score over time
│   │   │   ├── FitAccuracyChart.tsx   # Fit accuracy visualization
│   │   │   └── ReturnReasonBreakdown.tsx # Return reasons chart
│   │   ├── billing/
│   │   │   └── PlanCard.tsx           # Billing plan card
│   │   ├── dashboard/
│   │   │   ├── FitConfusionTable.tsx  # Fit confusion matrix
│   │   │   ├── OnboardingCard.tsx     # Setup onboarding
│   │   │   ├── ReturnRiskCard.tsx     # Return risk indicator
│   │   │   └── SizeChartHealth.tsx    # Size chart health score
│   │   ├── products/
│   │   │   ├── ProductFitDetail.tsx   # Product fit details
│   │   │   ├── ProductList.tsx        # Product list view
│   │   │   └── SizeChartEditor.tsx    # Size chart editor
│   │   ├── providers/
│   │   │   └── AppBridgeProvider.tsx  # Shopify App Bridge provider
│   │   └── widget/
│   │       └── WidgetPreview.tsx      # Widget preview component
│   ├── lib/
│   │   ├── billing.ts                # Billing API utilities
│   │   ├── fit-engine/
│   │   │   ├── analyzer.ts           # Signal analysis logic
│   │   │   ├── confidence.ts         # Confidence scoring
│   │   │   ├── index.ts              # Fit engine entry point
│   │   │   └── types.ts              # Type definitions & weights
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── session.ts                # Session management
│   │   ├── shopify.ts                # Shopify API client setup
│   │   └── webhooks.ts               # Webhook processing
│   └── types/
│       └── index.ts                  # Shared type definitions
├── .env.example                      # Environment variable template
├── .eslintrc.json                    # ESLint configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── shopify.app.toml                  # Shopify app configuration
├── tsconfig.json                     # TypeScript configuration
└── tsconfig.tsbuildinfo              # TypeScript build info
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/sizesignal` |
| `SHOPIFY_API_KEY` | Shopify app API key (from Partners dashboard) | `your_api_key` |
| `SHOPIFY_API_SECRET` | Shopify app API secret | `your_api_secret` |
| `SHOPIFY_SCOPES` | OAuth permission scopes | `read_products,write_products,read_orders,read_customers` |
| `SHOPIFY_APP_URL` | Public URL of your app (ngrok for dev) | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret for session encryption | `your_random_secret` |

## API Documentation

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth` | Initiates the Shopify OAuth flow. Redirects the merchant to Shopify for authorization. |
| `GET` | `/auth/callback` | Handles the OAuth callback from Shopify. Exchanges the authorization code for access tokens and creates the shop session. |

### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/webhooks` | Receives and processes Shopify webhooks (e.g., `APP_UNINSTALLED`, `PRODUCTS_UPDATE`, `ORDERS_CREATE`). Validates HMAC signatures. |

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Lists all synced products for the authenticated shop with fit data summaries. |
| `POST` | `/api/products/sync` | Triggers a full product sync from the Shopify Admin API. Fetches product details, variants, and images. |

### Size Charts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/size-charts` | Returns all size charts for the authenticated shop. |
| `POST` | `/api/size-charts` | Creates or updates a size chart with measurement data for a product or category. |

### Data Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews` | Ingests product review data. Extracts fit-related keywords and sentiment for the fit engine. |
| `POST` | `/api/returns` | Ingests return data with reason codes. Tracks size-related return patterns per product. |

### Fit Engine

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/fit-engine` | Generates a size recommendation for a given product and optional customer profile. Returns recommended size, confidence score, fit prediction, and reasoning. |

### Widget

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/widget` | Public endpoint serving widget data for the storefront Theme Extension. Returns fit recommendation and display configuration. No authentication required. |

### Billing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/billing` | Returns the current billing plan and usage for the authenticated shop. |
| `POST` | `/api/billing` | Creates or updates a billing subscription via the Shopify Billing API (GraphQL `appSubscriptionCreate`). |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Returns analytics data including return rates, fit accuracy, confidence trends, and revenue impact metrics. |

## Fit Engine

The SizeSignal Fit Engine combines four independent signal sources to produce a size recommendation with a confidence score.

### Signal Sources and Weights

| Signal | Weight | Description |
|---|---|---|
| **Review Signal** | 30% | Natural language analysis of customer reviews. Extracts fit keywords (e.g., "runs small", "true to size", "size up") and aggregates sentiment per size. |
| **Return Signal** | 25% | Analysis of return patterns. Identifies sizes with elevated return rates and correlates return reason codes with fit issues. |
| **Measurement Match** | 30% | Compares customer body measurements against the product size chart. Finds the closest size by minimizing dimensional delta. |
| **Preference Adjustment** | 15% | Adjusts the recommendation based on the customer's stated fit preference (slim, regular, or relaxed). |

### Confidence Scoring

The confidence score (0.0 to 1.0) reflects how much data backs the recommendation:

- **0.8 - 1.0**: High confidence -- strong agreement across multiple signals with sufficient data
- **0.5 - 0.79**: Medium confidence -- reasonable data but some signals may conflict or be missing
- **Below 0.5**: Low confidence -- limited data; recommendation is a best guess

### Fit Prediction Scale

Each recommendation includes a fit prediction describing how the garment is expected to fit:

| Prediction | Meaning |
|---|---|
| `TIGHT` | Expected to fit tighter than standard |
| `SLIGHTLY_TIGHT` | May feel slightly snug |
| `TRUE_TO_SIZE` | Expected to match standard sizing |
| `SLIGHTLY_LOOSE` | May feel slightly roomy |
| `LOOSE` | Expected to fit looser than standard |

### Fit Keywords

The review analyzer recognizes these keyword categories:

- **Runs Small**: "runs small", "too small", "tight", "snug", "sizing up", "smaller than expected", "runs tight"
- **True to Size**: "true to size", "fits perfectly", "as expected", "fits great", "perfect fit", "tts", "spot on"
- **Runs Large**: "runs large", "too big", "oversized", "baggy", "sizing down", "larger than expected", "runs big"
- **Size Up**: "size up", "go up a size", "order larger", "get a bigger", "next size up"
- **Size Down**: "size down", "go down a size", "order smaller", "get a smaller", "next size down"

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following the existing code style
4. Run linting: `npm run lint`
5. Commit your changes (`git commit -m 'Add your feature'`)
6. Push to your branch (`git push origin feature/your-feature`)
7. Open a Pull Request

Please ensure:
- All TypeScript types are properly defined (no `any` without justification)
- New API routes include proper error handling and authentication checks
- Components follow Shopify Polaris design patterns
- Database changes include a Prisma migration

## License

MIT
