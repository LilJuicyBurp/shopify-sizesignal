# SizeSignal AI - Setup Guide

Complete instructions for setting up the SizeSignal AI development environment and deploying to production.

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **PostgreSQL 14+** (local install or hosted service)
- **Shopify Partner account** at [partners.shopify.com](https://partners.shopify.com)
- **ngrok** for local development tunneling ([ngrok.com](https://ngrok.com))

## 1. Clone and Install

```bash
git clone <repo-url>
cd shopify-sizesignal
npm install
```

This will install all dependencies and automatically run `prisma generate` via the `postinstall` script.

## 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and configure each variable:

```env
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/sizesignal

# Shopify app credentials (from Partners dashboard - see step 4)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# OAuth scopes your app requests
# Do not change unless you need additional permissions
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_customers

# Public URL of your app
# For local dev, this will be your ngrok URL (see step 5)
# For production, this will be your deployed URL
SHOPIFY_APP_URL=https://your-ngrok-subdomain.ngrok-free.app

# Secret used for session encryption
# Generate with: openssl rand -hex 32
NEXTAUTH_SECRET=your_random_secret
```

## 3. Database Setup

Create the PostgreSQL database:

```bash
createdb sizesignal
```

Run Prisma migrations to create all tables:

```bash
npx prisma migrate dev --name init
```

Generate the Prisma client:

```bash
npx prisma generate
```

Seed the database with sample development data:

```bash
npm run prisma:seed
```

The seed script (`prisma/seed.ts`) creates:
- A sample shop with session data
- Example products with size variants
- Sample size charts with measurements
- Mock review data with fit keywords
- Mock return data with reason codes

You can inspect the database at any time using Prisma Studio:

```bash
npm run prisma:studio
```

This opens a browser-based database viewer at `http://localhost:5555`.

## 4. Shopify App Creation

Create your app in the Shopify Partners dashboard:

1. Go to [partners.shopify.com](https://partners.shopify.com) and log in
2. Navigate to **Apps** in the sidebar
3. Click **Create app**
4. Choose **Create app manually**
5. Enter app name: `SizeSignal AI` (or your preferred name)
6. Set the **App URL** to your ngrok URL (e.g., `https://your-subdomain.ngrok-free.app`)
7. Set the **Allowed redirection URL(s)** to:
   ```
   https://your-subdomain.ngrok-free.app/auth/callback
   ```
8. Click **Create app**
9. In the app settings, go to **API credentials**
10. Copy the **API key** and **API secret key** into your `.env` file as `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`

### Configure App Scopes

In the app setup page, ensure the following scopes are selected:
- `read_products` -- Read product data
- `write_products` -- Update product metafields
- `read_orders` -- Access order data for return analysis
- `read_customers` -- Access customer profiles

### Create a Development Store

If you do not already have one:

1. In Partners dashboard, go to **Stores**
2. Click **Add store**
3. Choose **Development store**
4. Fill in the store details and create it

## 5. Local Development

Start ngrok to create a public tunnel to your local server:

```bash
ngrok http 3000
```

Copy the generated HTTPS URL (e.g., `https://abc123.ngrok-free.app`) and update your `.env`:

```env
SHOPIFY_APP_URL=https://abc123.ngrok-free.app
```

Also update the App URL and redirect URL in your Shopify Partners dashboard to match.

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Install on Development Store

1. Open your development store admin: `https://your-store.myshopify.com/admin`
2. Navigate to **Apps** > **App and sales channel settings**
3. Click **Develop apps** or visit:
   ```
   https://your-store.myshopify.com/admin/oauth/authorize?client_id=YOUR_API_KEY&scope=read_products,write_products,read_orders,read_customers&redirect_uri=https://your-ngrok-url.ngrok-free.app/auth/callback
   ```
4. Approve the OAuth permissions
5. You will be redirected to the SizeSignal dashboard

## 6. Theme Extension Deployment

The storefront widget is delivered as a Theme App Extension located in `extensions/size-widget/`.

Push the extension to Shopify:

```bash
npm run shopify extension push
```

If you do not have the Shopify CLI installed globally:

```bash
npx @shopify/cli extension push
```

### Add the Widget to Your Theme

1. In your development store admin, go to **Online Store** > **Themes**
2. Click **Customize** on your active theme
3. Navigate to a **Product page** template
4. Click **Add block** in the product section
5. Under **Apps**, select **SizeSignal Widget** (size-recommender block)
6. Position the block where you want the size recommendation to appear (typically below the size selector)
7. Save the theme

The widget files are:
- `extensions/size-widget/blocks/size-recommender.liquid` -- The Liquid template
- `extensions/size-widget/assets/size-widget.js` -- Client-side logic (fetches recommendations from `/api/widget`)
- `extensions/size-widget/assets/size-widget.css` -- Widget styles

## 7. Seed Data (Development)

The seed script provides realistic test data for development. After running `npm run prisma:seed`, you will have:

- **Products**: Sample apparel items with multiple size variants
- **Size Charts**: Measurement tables (chest, waist, hip, length) for each product
- **Reviews**: Mock reviews containing fit-related keywords that the fit engine can analyze
- **Returns**: Mock return records with size-related reason codes

To reset and re-seed the database:

```bash
npx prisma migrate reset
npm run prisma:seed
```

To explore and edit data directly:

```bash
npm run prisma:studio
```

## 8. Testing

### OAuth Flow

1. Open the app install URL in a browser (see step 5)
2. Verify you are redirected to Shopify for authorization
3. After approving, verify you land on the SizeSignal dashboard
4. Check the database for a new `Session` and `Shop` record

### Webhook Handling

1. In your Shopify Partners dashboard, go to your app's webhook settings
2. Register test webhooks for `APP_UNINSTALLED` and `PRODUCTS_UPDATE`
3. Use Shopify's **Send test webhook** feature
4. Verify the webhook is received and processed (check server logs)

### API Endpoints

Test the API routes using curl or a tool like Postman:

```bash
# List products (requires valid session)
curl -H "Authorization: Bearer <session_token>" \
  https://your-ngrok-url.ngrok-free.app/api/products

# Trigger product sync
curl -X POST -H "Authorization: Bearer <session_token>" \
  https://your-ngrok-url.ngrok-free.app/api/products/sync

# Get a fit recommendation
curl -X POST -H "Content-Type: application/json" \
  -d '{"productId": "123", "shopId": "your-shop.myshopify.com"}' \
  https://your-ngrok-url.ngrok-free.app/api/fit-engine

# Fetch widget data (public, no auth required)
curl "https://your-ngrok-url.ngrok-free.app/api/widget?shop=your-shop.myshopify.com&product=123"
```

### Widget

1. Visit a product page on your development store
2. Verify the SizeSignal Widget block appears
3. Interact with the fit quiz
4. Confirm a size recommendation is displayed

### Dashboard

1. Open the app from your store admin
2. Navigate through each dashboard section:
   - **Home**: Onboarding card, return risk, size chart health
   - **Products**: Product list, fit details, size chart editor
   - **Analytics**: Fit accuracy, confidence trends, return reasons
   - **Billing**: Plan selection and subscription management
   - **Settings**: App configuration
   - **Widget Settings**: Widget appearance customization

## 9. Production Deployment

### Vercel Deployment

1. Push your repository to GitHub

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Configure the environment variables in Vercel's project settings:
   - `DATABASE_URL` -- Your production PostgreSQL connection string
   - `SHOPIFY_API_KEY` -- Same as development (or a separate production app)
   - `SHOPIFY_API_SECRET` -- Same as development (or a separate production app)
   - `SHOPIFY_SCOPES` -- `read_products,write_products,read_orders,read_customers`
   - `SHOPIFY_APP_URL` -- Your Vercel deployment URL (e.g., `https://sizesignal.vercel.app`)
   - `NEXTAUTH_SECRET` -- A new secret for production (`openssl rand -hex 32`)

4. Deploy:
   ```bash
   vercel --prod
   ```

### Production Database

Use a managed PostgreSQL service:

- **Railway** ([railway.app](https://railway.app)) -- Quick setup, free tier available
- **Supabase** ([supabase.com](https://supabase.com)) -- Free tier with 500 MB storage
- **Neon** ([neon.tech](https://neon.tech)) -- Serverless Postgres, generous free tier
- **Amazon RDS** -- For larger-scale production workloads

After setting up your database:

```bash
# Set the production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/sizesignal_prod"

# Run migrations against production
npx prisma migrate deploy
```

### Update Shopify App URLs

In your Shopify Partners dashboard, update your app's URLs to point to the production deployment:

- **App URL**: `https://sizesignal.vercel.app`
- **Allowed redirection URL(s)**: `https://sizesignal.vercel.app/auth/callback`

### Push Theme Extension

Deploy the theme extension for production:

```bash
npm run shopify extension push
```

## 10. Troubleshooting

### OAuth redirect fails or loops

- Verify `SHOPIFY_APP_URL` in `.env` exactly matches the URL in your Partners dashboard
- Ensure the redirect URL includes `/auth/callback`
- Check that ngrok is running and the tunnel is active
- Look for CORS or cookie issues in the browser console

### Database connection errors

- Verify `DATABASE_URL` is correct and the database exists
- Ensure PostgreSQL is running: `pg_isready`
- Check that the database user has sufficient permissions
- For SSL connections (production), append `?sslmode=require` to the connection string

### Prisma migration fails

- Run `npx prisma migrate reset` to start fresh (development only -- this drops all data)
- Check for pending migrations: `npx prisma migrate status`
- Ensure your `schema.prisma` is valid: `npx prisma validate`

### Webhooks not received

- Verify your ngrok tunnel is running and the URL matches the Partners dashboard
- Check the webhook signature validation in `src/lib/webhooks.ts`
- Look at the Shopify Partners dashboard webhook delivery logs for error details
- Ensure the `SHOPIFY_API_SECRET` is correct (used for HMAC validation)

### Widget not appearing on storefront

- Confirm the Theme Extension has been pushed: `npm run shopify extension push`
- Check that the widget block has been added in the theme editor
- Verify the widget API endpoint is accessible: `curl https://your-url/api/widget?shop=...&product=...`
- Check the browser console on the storefront for JavaScript errors

### Build or type errors

- Run `npx prisma generate` to regenerate the Prisma client after schema changes
- Clear the Next.js cache: `rm -rf .next`
- Check for TypeScript errors: `npx tsc --noEmit`
- Run the linter: `npm run lint`

### ngrok tunnel keeps changing URL

- Use a reserved ngrok domain (requires a free ngrok account):
  ```bash
  ngrok http --domain=your-reserved-domain.ngrok-free.app 3000
  ```
- Remember to update `SHOPIFY_APP_URL` and the Partners dashboard URLs when the tunnel URL changes
