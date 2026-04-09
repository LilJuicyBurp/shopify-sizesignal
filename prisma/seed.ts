import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface VariantInput {
  shopifyId: string;
  title: string;
  size: string;
  sku: string;
  price: number;
  inventoryQty: number;
}

interface ProductInput {
  shopifyId: string;
  title: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: string[];
  imageUrl: string;
  fitScore: number;
  fitConfusion: number;
  variants: VariantInput[];
}

interface ReviewInput {
  productIndex: number;
  rating: number;
  body: string;
  author: string;
  fitMention:
    | "RUNS_SMALL"
    | "TRUE_TO_SIZE"
    | "RUNS_LARGE"
    | "TIGHT_FIT"
    | "LOOSE_FIT"
    | "SIZE_UP"
    | "SIZE_DOWN"
    | null;
  sizeMention: string | null;
  sentiment: string;
}

interface ReturnInput {
  productIndex: number;
  orderId: string;
  reason:
    | "TOO_SMALL"
    | "TOO_LARGE"
    | "FIT_ISSUE"
    | "STYLE_DIFFERENT"
    | "QUALITY_ISSUE"
    | "OTHER";
  sizeOrdered: string;
  sizeExchanged: string | null;
  notes: string | null;
}

interface ProfileInput {
  customerId: string;
  sessionId: string;
  height: number;
  weight: number;
  preferredFit: string;
  bodyType: string;
  measurements: Record<string, number>;
}

interface RecommendationInput {
  profileIndex: number;
  productIndex: number;
  recommendedSize: string;
  confidence: number;
  fitPrediction:
    | "TIGHT"
    | "SLIGHTLY_TIGHT"
    | "TRUE_TO_SIZE"
    | "SLIGHTLY_LOOSE"
    | "LOOSE";
  reasoning: Record<string, string>;
  modelFitNotes: string | null;
}

interface AnalyticsInput {
  eventType: string;
  productIndex: number | null;
  metadata: Record<string, string | number | boolean>;
}

// ── T-shirts (5) ──────────────────────────────────────────────────────────────

const topSizes = ["XS", "S", "M", "L", "XL", "XXL"];

function topVariants(
  baseVariantId: number,
  skuPrefix: string,
  price: number
): VariantInput[] {
  return topSizes.map((size, i) => ({
    shopifyId: `gid://shopify/ProductVariant/${baseVariantId + i}`,
    title: size,
    size,
    sku: `${skuPrefix}-${size}`,
    price,
    inventoryQty: Math.floor(Math.random() * 80) + 10,
  }));
}

const tShirts: ProductInput[] = [
  {
    shopifyId: "gid://shopify/Product/1001",
    title: "Classic Cotton Crew Tee",
    handle: "classic-cotton-crew-tee",
    productType: "T-Shirt",
    vendor: "Urban Thread Co",
    tags: ["cotton", "basics", "crew-neck", "unisex"],
    imageUrl: "https://cdn.shopify.com/s/demo/classic-crew-tee.jpg",
    fitScore: 4.2,
    fitConfusion: 0.12,
    variants: topVariants(2001, "UT-CCT", 29.99),
  },
  {
    shopifyId: "gid://shopify/Product/1002",
    title: "Vintage Washed V-Neck",
    handle: "vintage-washed-v-neck",
    productType: "T-Shirt",
    vendor: "Urban Thread Co",
    tags: ["vintage", "v-neck", "soft-wash", "relaxed"],
    imageUrl: "https://cdn.shopify.com/s/demo/vintage-vneck.jpg",
    fitScore: 3.8,
    fitConfusion: 0.25,
    variants: topVariants(2101, "UT-VVN", 34.99),
  },
  {
    shopifyId: "gid://shopify/Product/1003",
    title: "Performance Dry-Fit Tee",
    handle: "performance-dry-fit-tee",
    productType: "T-Shirt",
    vendor: "ActiveWear Labs",
    tags: ["athletic", "moisture-wicking", "slim-fit", "performance"],
    imageUrl: "https://cdn.shopify.com/s/demo/dryfit-tee.jpg",
    fitScore: 3.5,
    fitConfusion: 0.38,
    variants: topVariants(2201, "AWL-DFT", 44.99),
  },
  {
    shopifyId: "gid://shopify/Product/1004",
    title: "Oversized Graphic Tee - Mountain Edition",
    handle: "oversized-graphic-tee-mountain",
    productType: "T-Shirt",
    vendor: "Nomad Apparel",
    tags: ["oversized", "graphic", "streetwear", "cotton"],
    imageUrl: "https://cdn.shopify.com/s/demo/graphic-mountain.jpg",
    fitScore: 3.9,
    fitConfusion: 0.30,
    variants: topVariants(2301, "NA-OGT", 39.99),
  },
  {
    shopifyId: "gid://shopify/Product/1005",
    title: "Pima Cotton Essential Tee",
    handle: "pima-cotton-essential-tee",
    productType: "T-Shirt",
    vendor: "Luxe Basics",
    tags: ["pima-cotton", "premium", "everyday", "fitted"],
    imageUrl: "https://cdn.shopify.com/s/demo/pima-essential.jpg",
    fitScore: 4.5,
    fitConfusion: 0.08,
    variants: topVariants(2401, "LB-PCT", 54.99),
  },
];

// ── Jeans (3) ─────────────────────────────────────────────────────────────────

const jeanWaists = ["28", "30", "32", "34", "36", "38"];

function jeanVariants(
  baseVariantId: number,
  skuPrefix: string,
  price: number
): VariantInput[] {
  return jeanWaists.map((waist, i) => ({
    shopifyId: `gid://shopify/ProductVariant/${baseVariantId + i}`,
    title: `${waist}W x 32L`,
    size: waist,
    sku: `${skuPrefix}-${waist}`,
    price,
    inventoryQty: Math.floor(Math.random() * 50) + 5,
  }));
}

const jeans: ProductInput[] = [
  {
    shopifyId: "gid://shopify/Product/1006",
    title: "Slim Straight Selvedge Jeans",
    handle: "slim-straight-selvedge-jeans",
    productType: "Jeans",
    vendor: "Denim Works",
    tags: ["selvedge", "slim-straight", "raw-denim", "japanese-denim"],
    imageUrl: "https://cdn.shopify.com/s/demo/selvedge-jeans.jpg",
    fitScore: 3.6,
    fitConfusion: 0.42,
    variants: jeanVariants(3001, "DW-SSJ", 128.0),
  },
  {
    shopifyId: "gid://shopify/Product/1007",
    title: "Relaxed Tapered Comfort Jeans",
    handle: "relaxed-tapered-comfort-jeans",
    productType: "Jeans",
    vendor: "Denim Works",
    tags: ["relaxed", "tapered", "stretch", "comfort"],
    imageUrl: "https://cdn.shopify.com/s/demo/relaxed-jeans.jpg",
    fitScore: 4.1,
    fitConfusion: 0.18,
    variants: jeanVariants(3101, "DW-RTC", 98.0),
  },
  {
    shopifyId: "gid://shopify/Product/1008",
    title: "High-Rise Skinny Jeans",
    handle: "high-rise-skinny-jeans",
    productType: "Jeans",
    vendor: "Denim Works",
    tags: ["high-rise", "skinny", "stretch", "women"],
    imageUrl: "https://cdn.shopify.com/s/demo/highrise-skinny.jpg",
    fitScore: 3.3,
    fitConfusion: 0.48,
    variants: jeanVariants(3201, "DW-HRS", 110.0),
  },
];

// ── Dresses (3) ───────────────────────────────────────────────────────────────

const dressSizes = ["0", "2", "4", "6", "8", "10", "12", "14"];

function dressVariants(
  baseVariantId: number,
  skuPrefix: string,
  price: number
): VariantInput[] {
  return dressSizes.map((size, i) => ({
    shopifyId: `gid://shopify/ProductVariant/${baseVariantId + i}`,
    title: `Size ${size}`,
    size,
    sku: `${skuPrefix}-${size}`,
    price,
    inventoryQty: Math.floor(Math.random() * 30) + 3,
  }));
}

const dresses: ProductInput[] = [
  {
    shopifyId: "gid://shopify/Product/1009",
    title: "Wrap Midi Dress - Floral Print",
    handle: "wrap-midi-dress-floral",
    productType: "Dress",
    vendor: "Sage & Bloom",
    tags: ["wrap", "midi", "floral", "occasion"],
    imageUrl: "https://cdn.shopify.com/s/demo/wrap-midi-floral.jpg",
    fitScore: 3.7,
    fitConfusion: 0.35,
    variants: dressVariants(4001, "SB-WMD", 89.0),
  },
  {
    shopifyId: "gid://shopify/Product/1010",
    title: "Bodycon Ribbed Knit Dress",
    handle: "bodycon-ribbed-knit-dress",
    productType: "Dress",
    vendor: "Sage & Bloom",
    tags: ["bodycon", "knit", "ribbed", "fitted"],
    imageUrl: "https://cdn.shopify.com/s/demo/bodycon-knit.jpg",
    fitScore: 3.2,
    fitConfusion: 0.52,
    variants: dressVariants(4101, "SB-BRK", 64.0),
  },
  {
    shopifyId: "gid://shopify/Product/1011",
    title: "A-Line Shirt Dress",
    handle: "a-line-shirt-dress",
    productType: "Dress",
    vendor: "Sage & Bloom",
    tags: ["a-line", "shirt-dress", "casual", "cotton"],
    imageUrl: "https://cdn.shopify.com/s/demo/aline-shirt.jpg",
    fitScore: 4.0,
    fitConfusion: 0.15,
    variants: dressVariants(4201, "SB-ASD", 75.0),
  },
];

// ── Hoodies (2) ───────────────────────────────────────────────────────────────

const hoodies: ProductInput[] = [
  {
    shopifyId: "gid://shopify/Product/1012",
    title: "Heavyweight Pullover Hoodie",
    handle: "heavyweight-pullover-hoodie",
    productType: "Hoodie",
    vendor: "Urban Thread Co",
    tags: ["heavyweight", "pullover", "fleece", "unisex"],
    imageUrl: "https://cdn.shopify.com/s/demo/heavyweight-hoodie.jpg",
    fitScore: 4.3,
    fitConfusion: 0.10,
    variants: topVariants(5001, "UT-HPH", 68.0),
  },
  {
    shopifyId: "gid://shopify/Product/1013",
    title: "Zip-Up Tech Fleece Hoodie",
    handle: "zip-up-tech-fleece-hoodie",
    productType: "Hoodie",
    vendor: "ActiveWear Labs",
    tags: ["zip-up", "tech-fleece", "athletic", "performance"],
    imageUrl: "https://cdn.shopify.com/s/demo/tech-fleece-zip.jpg",
    fitScore: 3.9,
    fitConfusion: 0.22,
    variants: topVariants(5101, "AWL-ZTF", 85.0),
  },
];

// ── Jackets (2) ───────────────────────────────────────────────────────────────

const jackets: ProductInput[] = [
  {
    shopifyId: "gid://shopify/Product/1014",
    title: "Quilted Puffer Jacket",
    handle: "quilted-puffer-jacket",
    productType: "Jacket",
    vendor: "Nomad Apparel",
    tags: ["puffer", "quilted", "winter", "insulated"],
    imageUrl: "https://cdn.shopify.com/s/demo/puffer-jacket.jpg",
    fitScore: 3.4,
    fitConfusion: 0.40,
    variants: topVariants(6001, "NA-QPJ", 149.0),
  },
  {
    shopifyId: "gid://shopify/Product/1015",
    title: "Classic Denim Trucker Jacket",
    handle: "classic-denim-trucker-jacket",
    productType: "Jacket",
    vendor: "Denim Works",
    tags: ["denim", "trucker", "classic", "layering"],
    imageUrl: "https://cdn.shopify.com/s/demo/denim-trucker.jpg",
    fitScore: 3.7,
    fitConfusion: 0.33,
    variants: topVariants(6101, "DW-DTJ", 118.0),
  },
];

const allProducts: ProductInput[] = [
  ...tShirts,
  ...jeans,
  ...dresses,
  ...hoodies,
  ...jackets,
];

// ── Size Charts ───────────────────────────────────────────────────────────────

const topsSizeChart = {
  name: "Tops Size Chart",
  productType: "Tops",
  measurements: {
    XS: { chest: 34, waist: 28, length: 26 },
    S: { chest: 36, waist: 30, length: 27 },
    M: { chest: 38, waist: 32, length: 28 },
    L: { chest: 40, waist: 34, length: 29 },
    XL: { chest: 42, waist: 36, length: 30 },
    XXL: { chest: 44, waist: 38, length: 31 },
  },
  unit: "in",
  isDefault: true,
  healthScore: 0.92,
  issues: null,
};

const bottomsSizeChart = {
  name: "Bottoms Size Chart",
  productType: "Bottoms",
  measurements: {
    "28": { waist: 28, hip: 34, inseam: 30 },
    "30": { waist: 30, hip: 36, inseam: 30 },
    "32": { waist: 32, hip: 38, inseam: 32 },
    "34": { waist: 34, hip: 40, inseam: 32 },
    "36": { waist: 36, hip: 42, inseam: 32 },
    "38": { waist: 38, hip: 44, inseam: 32 },
  },
  unit: "in",
  isDefault: false,
  healthScore: 0.88,
  issues: null,
};

const dressesSizeChart = {
  name: "Dresses Size Chart",
  productType: "Dresses",
  measurements: {
    "0": { bust: 31, waist: 24, hip: 34, length: 35 },
    "2": { bust: 32, waist: 25, hip: 35, length: 35.5 },
    "4": { bust: 33, waist: 26, hip: 36, length: 36 },
    "6": { bust: 34, waist: 27, hip: 37, length: 36.5 },
    "8": { bust: 35, waist: 28, hip: 38, length: 37 },
    "10": { bust: 36.5, waist: 29.5, hip: 39.5, length: 37.5 },
    "12": { bust: 38, waist: 31, hip: 41, length: 38 },
    "14": { bust: 39.5, waist: 32.5, hip: 42.5, length: 38.5 },
  },
  unit: "in",
  isDefault: false,
  healthScore: 0.95,
  issues: null,
};

// ── Reviews (50) ──────────────────────────────────────────────────────────────

const reviews: ReviewInput[] = [
  // Classic Cotton Crew Tee (index 0)
  { productIndex: 0, rating: 5, body: "Fits perfectly true to size. I ordered my usual M and it was spot on. Great quality cotton too.", author: "Mike T.", fitMention: "TRUE_TO_SIZE", sizeMention: "M", sentiment: "positive" },
  { productIndex: 0, rating: 4, body: "Good basic tee. Fits as expected, maybe slightly slim through the shoulders.", author: "Sarah K.", fitMention: "TRUE_TO_SIZE", sizeMention: null, sentiment: "positive" },
  { productIndex: 0, rating: 5, body: "Perfect everyday tee. The sizing is consistent which I appreciate. Bought three more.", author: "James L.", fitMention: "TRUE_TO_SIZE", sizeMention: null, sentiment: "positive" },
  { productIndex: 0, rating: 3, body: "Decent shirt but runs a bit small in the chest. Had to exchange for a size up.", author: "David R.", fitMention: "RUNS_SMALL", sizeMention: "L to XL", sentiment: "neutral" },

  // Vintage Washed V-Neck (index 1)
  { productIndex: 1, rating: 4, body: "Love the washed look. Runs slightly large which I expected from the vintage fit description.", author: "Jessica M.", fitMention: "RUNS_LARGE", sizeMention: "M", sentiment: "positive" },
  { productIndex: 1, rating: 3, body: "The v-neck is deeper than expected. Sizing is weird - ordered an S and it fits like an M.", author: "Amanda P.", fitMention: "RUNS_LARGE", sizeMention: "S", sentiment: "neutral" },
  { productIndex: 1, rating: 5, body: "Sized down per reviews and it fits great. Super soft fabric, love the relaxed vibe.", author: "Chris B.", fitMention: "SIZE_DOWN", sizeMention: "M to S", sentiment: "positive" },
  { productIndex: 1, rating: 2, body: "Way too boxy for me. I usually wear M in everything but this was huge. Size down for sure.", author: "Ryan W.", fitMention: "SIZE_DOWN", sizeMention: "M", sentiment: "negative" },

  // Performance Dry-Fit Tee (index 2)
  { productIndex: 2, rating: 4, body: "Great for the gym. Runs tight through the arms which is good for muscle fit. Went with my regular L.", author: "Brandon S.", fitMention: "TIGHT_FIT", sizeMention: "L", sentiment: "positive" },
  { productIndex: 2, rating: 2, body: "Runs really small. I normally wear a medium and this was skin-tight. Had to size up twice.", author: "Tom H.", fitMention: "RUNS_SMALL", sizeMention: "M to XL", sentiment: "negative" },
  { productIndex: 2, rating: 3, body: "The fit is snug. If you're between sizes, definitely go up. Material is nice though.", author: "Kevin D.", fitMention: "SIZE_UP", sizeMention: null, sentiment: "neutral" },
  { productIndex: 2, rating: 5, body: "I sized up to L based on reviews and it fits perfectly. Excellent moisture wicking.", author: "Alex N.", fitMention: "SIZE_UP", sizeMention: "M to L", sentiment: "positive" },

  // Oversized Graphic Tee (index 3)
  { productIndex: 3, rating: 5, body: "The oversized fit is intentional and looks great. I got my normal size and it drapes perfectly.", author: "Zoe L.", fitMention: "TRUE_TO_SIZE", sizeMention: "S", sentiment: "positive" },
  { productIndex: 3, rating: 4, body: "It's supposed to be oversized but I still sized down for a less baggy look. Works well.", author: "Mia C.", fitMention: "SIZE_DOWN", sizeMention: "M to S", sentiment: "positive" },
  { productIndex: 3, rating: 3, body: "Cool design but this runs large even for oversized. The XS fits like a normal M on me.", author: "Taylor J.", fitMention: "RUNS_LARGE", sizeMention: "XS", sentiment: "neutral" },

  // Pima Cotton Essential Tee (index 4)
  { productIndex: 4, rating: 5, body: "The most consistently sized tee I've found. True to size in every dimension. Premium feel.", author: "Rachel G.", fitMention: "TRUE_TO_SIZE", sizeMention: "S", sentiment: "positive" },
  { productIndex: 4, rating: 5, body: "Worth every penny. Fits like a glove in my usual size M. The pima cotton is incredibly soft.", author: "Daniel F.", fitMention: "TRUE_TO_SIZE", sizeMention: "M", sentiment: "positive" },
  { productIndex: 4, rating: 4, body: "Great quality and consistent sizing. Ordered L as always and it fits perfectly.", author: "Nathan P.", fitMention: "TRUE_TO_SIZE", sizeMention: "L", sentiment: "positive" },
  { productIndex: 4, rating: 4, body: "Slightly fitted compared to their other tees but I like it. Stayed with my usual size.", author: "Olivia S.", fitMention: "TIGHT_FIT", sizeMention: "M", sentiment: "positive" },

  // Slim Straight Selvedge Jeans (index 5)
  { productIndex: 5, rating: 4, body: "Beautiful denim but runs small in the waist. I'm a true 32 and needed the 34.", author: "Marcus V.", fitMention: "RUNS_SMALL", sizeMention: "32 to 34", sentiment: "positive" },
  { productIndex: 5, rating: 3, body: "The raw denim is stiff at first and fits very tight. Size up at least one. They stretch over time.", author: "Josh A.", fitMention: "SIZE_UP", sizeMention: "30 to 32", sentiment: "neutral" },
  { productIndex: 5, rating: 2, body: "Ordered my usual 30 and couldn't even button them. These run at least a full size small.", author: "Eric T.", fitMention: "RUNS_SMALL", sizeMention: "30", sentiment: "negative" },
  { productIndex: 5, rating: 5, body: "Once you find the right size, these are incredible. I went up 2 inches from my usual and they fit perfectly after a week.", author: "Will K.", fitMention: "SIZE_UP", sizeMention: "32 to 34", sentiment: "positive" },

  // Relaxed Tapered Comfort Jeans (index 6)
  { productIndex: 6, rating: 5, body: "Finally jeans that fit true to size! My usual 34 waist is perfect. Love the stretch.", author: "Greg M.", fitMention: "TRUE_TO_SIZE", sizeMention: "34", sentiment: "positive" },
  { productIndex: 6, rating: 4, body: "Comfortable and fits as expected. The tapered leg is flattering. Ordered 32 and it's right on.", author: "Sean O.", fitMention: "TRUE_TO_SIZE", sizeMention: "32", sentiment: "positive" },
  { productIndex: 6, rating: 4, body: "Nice relaxed fit. A touch loose in the waist but nothing a belt can't fix.", author: "Paul R.", fitMention: "LOOSE_FIT", sizeMention: "36", sentiment: "positive" },

  // High-Rise Skinny Jeans (index 7)
  { productIndex: 7, rating: 3, body: "These run really small in the hips. I'm usually a 30 and had to exchange for 32.", author: "Lindsay H.", fitMention: "RUNS_SMALL", sizeMention: "30 to 32", sentiment: "neutral" },
  { productIndex: 7, rating: 2, body: "Size chart is misleading. Ordered a 28 based on measurements and they were way too tight in the thighs.", author: "Courtney B.", fitMention: "TIGHT_FIT", sizeMention: "28", sentiment: "negative" },
  { productIndex: 7, rating: 4, body: "Sized up one and they fit great. The high rise is super flattering. Just know they run small.", author: "Lauren D.", fitMention: "SIZE_UP", sizeMention: "30 to 32", sentiment: "positive" },
  { productIndex: 7, rating: 1, body: "Terrible sizing. Nothing about these matches the size chart. Had to return.", author: "Katie W.", fitMention: "RUNS_SMALL", sizeMention: "28", sentiment: "negative" },

  // Wrap Midi Dress - Floral (index 8)
  { productIndex: 8, rating: 5, body: "The wrap style is forgiving on sizing. I'm between a 6 and 8, went with 6 and it's perfect.", author: "Emily R.", fitMention: "TRUE_TO_SIZE", sizeMention: "6", sentiment: "positive" },
  { productIndex: 8, rating: 4, body: "Runs a little large in the bust area. I'm usually a 4 and could have gone with a 2.", author: "Sophia T.", fitMention: "RUNS_LARGE", sizeMention: "4", sentiment: "positive" },
  { productIndex: 8, rating: 3, body: "Pretty dress but the sizing is inconsistent. The waist is tight but bust is loose in size 8.", author: "Nicole F.", fitMention: "FIT_ISSUE" as ReviewInput["fitMention"], sizeMention: "8", sentiment: "neutral" },

  // Bodycon Ribbed Knit Dress (index 9)
  { productIndex: 9, rating: 3, body: "This dress runs very small. I normally wear a 6 and had to exchange for a 10. Very tight through the hips.", author: "Brittany C.", fitMention: "RUNS_SMALL", sizeMention: "6 to 10", sentiment: "neutral" },
  { productIndex: 9, rating: 2, body: "Size chart says I'm a 4 but it was skin tight. Bodycon or not, this runs at least 2 sizes small.", author: "Ashley M.", fitMention: "RUNS_SMALL", sizeMention: "4", sentiment: "negative" },
  { productIndex: 9, rating: 4, body: "I sized up to 8 from my usual 4 and it fits well. The ribbed knit is stretchy and comfortable.", author: "Jennifer L.", fitMention: "SIZE_UP", sizeMention: "4 to 8", sentiment: "positive" },
  { productIndex: 9, rating: 5, body: "Ordered two sizes up based on reviews and it's perfect. Hugs in all the right places.", author: "Samantha J.", fitMention: "SIZE_UP", sizeMention: "8 to 12", sentiment: "positive" },

  // A-Line Shirt Dress (index 10)
  { productIndex: 10, rating: 5, body: "True to size and so flattering. The A-line silhouette is forgiving. Size 6 fits my measurements exactly.", author: "Michelle K.", fitMention: "TRUE_TO_SIZE", sizeMention: "6", sentiment: "positive" },
  { productIndex: 10, rating: 4, body: "Cute dress! A little roomy in the shoulders but overall fits well in my usual size 8.", author: "Andrea N.", fitMention: "LOOSE_FIT", sizeMention: "8", sentiment: "positive" },
  { productIndex: 10, rating: 4, body: "Ordered my standard size 4 and it fits perfectly. Great everyday dress.", author: "Christina P.", fitMention: "TRUE_TO_SIZE", sizeMention: "4", sentiment: "positive" },

  // Heavyweight Pullover Hoodie (index 11)
  { productIndex: 11, rating: 5, body: "Absolute unit of a hoodie. True to size, I got L and it's perfect - not too tight, not too baggy.", author: "Derek J.", fitMention: "TRUE_TO_SIZE", sizeMention: "L", sentiment: "positive" },
  { productIndex: 11, rating: 5, body: "This hoodie is incredible. Heavyweight feel, fits perfectly in XL. Best hoodie I've owned.", author: "Matt B.", fitMention: "TRUE_TO_SIZE", sizeMention: "XL", sentiment: "positive" },
  { productIndex: 11, rating: 4, body: "Ordered my usual M and it was perfect. Slightly boxy cut which is what I wanted for layering.", author: "Cody R.", fitMention: "TRUE_TO_SIZE", sizeMention: "M", sentiment: "positive" },

  // Zip-Up Tech Fleece Hoodie (index 12)
  { productIndex: 12, rating: 4, body: "Great for workouts. Runs a bit slim through the torso. Went up to XL from my usual L.", author: "Jason P.", fitMention: "RUNS_SMALL", sizeMention: "L to XL", sentiment: "positive" },
  { productIndex: 12, rating: 3, body: "Nice quality but tight in the arms. Athletic fit means you should size up if you have broad shoulders.", author: "Tyler M.", fitMention: "TIGHT_FIT", sizeMention: "L", sentiment: "neutral" },

  // Quilted Puffer Jacket (index 13)
  { productIndex: 13, rating: 3, body: "Warm jacket but runs small. I wear M in most things and this M was too tight to layer over a sweater. Sized up to L.", author: "Patrick D.", fitMention: "RUNS_SMALL", sizeMention: "M to L", sentiment: "neutral" },
  { productIndex: 13, rating: 4, body: "Sized up one for layering room and it's perfect. Very warm, great puffer.", author: "Steven C.", fitMention: "SIZE_UP", sizeMention: "L to XL", sentiment: "positive" },
  { productIndex: 13, rating: 2, body: "The arms are way too short for the body size. An XL fits my torso but the sleeves are like an L.", author: "Brian F.", fitMention: "RUNS_SMALL", sizeMention: "XL", sentiment: "negative" },

  // Classic Denim Trucker Jacket (index 14)
  { productIndex: 14, rating: 4, body: "Classic fit. Ordered my usual size and it fits just right - not too tight, room for a tee underneath.", author: "Andrew H.", fitMention: "TRUE_TO_SIZE", sizeMention: "M", sentiment: "positive" },
  { productIndex: 14, rating: 3, body: "A little boxy in the waist area but the shoulders fit well in L. Typical trucker jacket fit.", author: "Nick G.", fitMention: "LOOSE_FIT", sizeMention: "L", sentiment: "neutral" },
  { productIndex: 14, rating: 5, body: "Perfect denim jacket. True to size and looks great. The denim quality is outstanding.", author: "Robert E.", fitMention: "TRUE_TO_SIZE", sizeMention: "M", sentiment: "positive" },
];

// Fix the one review that used an invalid fitMention value
// Re-map it to null since FIT_ISSUE is not in the enum
const sanitizedReviews: ReviewInput[] = reviews.map((r) => ({
  ...r,
  fitMention:
    r.fitMention === ("FIT_ISSUE" as ReviewInput["fitMention"])
      ? null
      : r.fitMention,
}));

// ── Returns (20) ──────────────────────────────────────────────────────────────

const returns: ReturnInput[] = [
  { productIndex: 2, orderId: "ORD-10001", reason: "TOO_SMALL", sizeOrdered: "M", sizeExchanged: "XL", notes: "Customer found the athletic fit too restrictive" },
  { productIndex: 5, orderId: "ORD-10002", reason: "TOO_SMALL", sizeOrdered: "30", sizeExchanged: "32", notes: "Raw denim runs small, customer exchanged up" },
  { productIndex: 5, orderId: "ORD-10003", reason: "TOO_SMALL", sizeOrdered: "32", sizeExchanged: "34", notes: null },
  { productIndex: 7, orderId: "ORD-10004", reason: "TOO_SMALL", sizeOrdered: "28", sizeExchanged: "30", notes: "Tight in the hips, customer sized up" },
  { productIndex: 7, orderId: "ORD-10005", reason: "FIT_ISSUE", sizeOrdered: "30", sizeExchanged: null, notes: "Waist fit but thighs were too tight. Full refund." },
  { productIndex: 9, orderId: "ORD-10006", reason: "TOO_SMALL", sizeOrdered: "4", sizeExchanged: "8", notes: "Bodycon runs very small, needed two sizes up" },
  { productIndex: 9, orderId: "ORD-10007", reason: "TOO_SMALL", sizeOrdered: "6", sizeExchanged: "10", notes: "Tight through the hips" },
  { productIndex: 13, orderId: "ORD-10008", reason: "TOO_SMALL", sizeOrdered: "M", sizeExchanged: "L", notes: "Could not layer sweater underneath" },
  { productIndex: 13, orderId: "ORD-10009", reason: "FIT_ISSUE", sizeOrdered: "XL", sizeExchanged: null, notes: "Arms too short relative to body, full refund" },
  { productIndex: 1, orderId: "ORD-10010", reason: "TOO_LARGE", sizeOrdered: "M", sizeExchanged: "S", notes: "Vintage fit ran larger than expected" },
  { productIndex: 3, orderId: "ORD-10011", reason: "TOO_LARGE", sizeOrdered: "L", sizeExchanged: "M", notes: "Oversized style was too much for customer's frame" },
  { productIndex: 6, orderId: "ORD-10012", reason: "TOO_LARGE", sizeOrdered: "36", sizeExchanged: "34", notes: "Relaxed fit was looser than expected" },
  { productIndex: 8, orderId: "ORD-10013", reason: "TOO_LARGE", sizeOrdered: "8", sizeExchanged: "6", notes: "Wrap style ran big in the bust" },
  { productIndex: 0, orderId: "ORD-10014", reason: "STYLE_DIFFERENT", sizeOrdered: "L", sizeExchanged: null, notes: "Color was different from the website photo" },
  { productIndex: 4, orderId: "ORD-10015", reason: "QUALITY_ISSUE", sizeOrdered: "M", sizeExchanged: null, notes: "Small hole found near seam after first wash" },
  { productIndex: 10, orderId: "ORD-10016", reason: "STYLE_DIFFERENT", sizeOrdered: "6", sizeExchanged: null, notes: "Fabric was thinner than expected from photos" },
  { productIndex: 12, orderId: "ORD-10017", reason: "TOO_SMALL", sizeOrdered: "L", sizeExchanged: "XL", notes: "Athletic fit too slim in the arms" },
  { productIndex: 14, orderId: "ORD-10018", reason: "OTHER", sizeOrdered: "M", sizeExchanged: null, notes: "Customer changed their mind" },
  { productIndex: 11, orderId: "ORD-10019", reason: "TOO_LARGE", sizeOrdered: "XL", sizeExchanged: "L", notes: "Boxy cut was too much, sized down" },
  { productIndex: 2, orderId: "ORD-10020", reason: "FIT_ISSUE", sizeOrdered: "S", sizeExchanged: null, notes: "Chest fit but arms were too tight. Returned." },
];

// ── Customer Fit Profiles (5) ─────────────────────────────────────────────────

const profiles: ProfileInput[] = [
  {
    customerId: "cust_001",
    sessionId: "sess_a1b2c3",
    height: 70,
    weight: 180,
    preferredFit: "regular",
    bodyType: "athletic",
    measurements: { chest: 40, waist: 33, hips: 38, inseam: 32 },
  },
  {
    customerId: "cust_002",
    sessionId: "sess_d4e5f6",
    height: 64,
    weight: 135,
    preferredFit: "fitted",
    bodyType: "hourglass",
    measurements: { bust: 35, waist: 27, hips: 37, inseam: 29 },
  },
  {
    customerId: "cust_003",
    sessionId: "sess_g7h8i9",
    height: 74,
    weight: 220,
    preferredFit: "relaxed",
    bodyType: "broad",
    measurements: { chest: 44, waist: 38, hips: 42, inseam: 34 },
  },
  {
    customerId: "cust_004",
    sessionId: "sess_j0k1l2",
    height: 62,
    weight: 120,
    preferredFit: "fitted",
    bodyType: "petite",
    measurements: { bust: 32, waist: 25, hips: 34, inseam: 27 },
  },
  {
    customerId: "cust_005",
    sessionId: "sess_m3n4o5",
    height: 68,
    weight: 165,
    preferredFit: "regular",
    bodyType: "average",
    measurements: { chest: 38, waist: 32, hips: 37, inseam: 31 },
  },
];

// ── Fit Recommendations ───────────────────────────────────────────────────────

const recommendations: RecommendationInput[] = [
  // Profile 0 (athletic, regular fit)
  { profileIndex: 0, productIndex: 0, recommendedSize: "L", confidence: 0.92, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Chest 40in maps to L in size chart", fitPreference: "Regular fit aligns with standard sizing" }, modelFitNotes: null },
  { profileIndex: 0, productIndex: 5, recommendedSize: "34", confidence: 0.78, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Waist 33in, raw denim runs small", fitPreference: "Size up one from true waist for selvedge" }, modelFitNotes: "Raw denim stretches 1-2 inches after break-in" },
  { profileIndex: 0, productIndex: 11, recommendedSize: "L", confidence: 0.95, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Chest 40in fits L perfectly", fitPreference: "Regular fit matches hoodie cut" }, modelFitNotes: null },

  // Profile 1 (hourglass, fitted)
  { profileIndex: 1, productIndex: 8, recommendedSize: "6", confidence: 0.88, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Bust 35in and waist 27in align with size 6", fitPreference: "Wrap style accommodates hourglass shape" }, modelFitNotes: null },
  { profileIndex: 1, productIndex: 9, recommendedSize: "8", confidence: 0.72, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Hip measurement 37in suggests size 8 in bodycon", fitPreference: "Bodycon runs small, sizing up recommended" }, modelFitNotes: "Review data confirms this style runs 1-2 sizes small" },
  { profileIndex: 1, productIndex: 7, recommendedSize: "30", confidence: 0.80, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Waist 27in maps to 28 but hip 37in needs 30", fitPreference: "Hip-driven sizing for high-rise fit" }, modelFitNotes: "Consider stretch factor in high-rise style" },

  // Profile 2 (broad, relaxed)
  { profileIndex: 2, productIndex: 0, recommendedSize: "XXL", confidence: 0.85, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Chest 44in maps to XXL", fitPreference: "Relaxed preference met by standard XXL" }, modelFitNotes: null },
  { profileIndex: 2, productIndex: 6, recommendedSize: "38", confidence: 0.90, fitPrediction: "SLIGHTLY_LOOSE", reasoning: { basis: "Waist 38in is top of range", fitPreference: "Relaxed fit preference adds comfort" }, modelFitNotes: "Stretch denim provides extra room" },
  { profileIndex: 2, productIndex: 13, recommendedSize: "XXL", confidence: 0.70, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Chest 44in at XXL limit", fitPreference: "Puffer may be snug for layering" }, modelFitNotes: "Recommend trying on with intended layering pieces" },

  // Profile 3 (petite, fitted)
  { profileIndex: 3, productIndex: 10, recommendedSize: "2", confidence: 0.91, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Bust 32in and waist 25in map to size 2", fitPreference: "A-line is forgiving for petite frames" }, modelFitNotes: null },
  { profileIndex: 3, productIndex: 4, recommendedSize: "XS", confidence: 0.88, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Bust 32in and frame align with XS", fitPreference: "Fitted preference matches this style" }, modelFitNotes: null },

  // Profile 4 (average, regular)
  { profileIndex: 4, productIndex: 2, recommendedSize: "L", confidence: 0.74, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Chest 38in is M but athletic fit runs small", fitPreference: "Size up for comfort in performance fabric" }, modelFitNotes: "Review consensus: size up one in this style" },
  { profileIndex: 4, productIndex: 14, recommendedSize: "M", confidence: 0.89, fitPrediction: "TRUE_TO_SIZE", reasoning: { basis: "Chest 38in fits M in standard trucker cut", fitPreference: "Regular preference aligns with classic fit" }, modelFitNotes: null },
  { profileIndex: 4, productIndex: 12, recommendedSize: "L", confidence: 0.76, fitPrediction: "SLIGHTLY_TIGHT", reasoning: { basis: "Chest 38in is M but athletic cut is slim", fitPreference: "Size up for zip-up comfort" }, modelFitNotes: "Tech fleece has minimal stretch" },
];

// ── Analytics Events (~30) ────────────────────────────────────────────────────

const analyticsEvents: AnalyticsInput[] = [
  { eventType: "widget_view", productIndex: 0, metadata: { page: "product", viewDuration: 12 } },
  { eventType: "widget_view", productIndex: 0, metadata: { page: "product", viewDuration: 8 } },
  { eventType: "widget_view", productIndex: 1, metadata: { page: "product", viewDuration: 15 } },
  { eventType: "widget_view", productIndex: 2, metadata: { page: "product", viewDuration: 22 } },
  { eventType: "widget_view", productIndex: 3, metadata: { page: "product", viewDuration: 6 } },
  { eventType: "widget_view", productIndex: 5, metadata: { page: "product", viewDuration: 30 } },
  { eventType: "widget_view", productIndex: 7, metadata: { page: "product", viewDuration: 18 } },
  { eventType: "widget_view", productIndex: 8, metadata: { page: "product", viewDuration: 25 } },
  { eventType: "widget_view", productIndex: 9, metadata: { page: "product", viewDuration: 20 } },
  { eventType: "widget_view", productIndex: 11, metadata: { page: "product", viewDuration: 10 } },
  { eventType: "widget_view", productIndex: 13, metadata: { page: "product", viewDuration: 14 } },
  { eventType: "widget_view", productIndex: 14, metadata: { page: "product", viewDuration: 9 } },
  { eventType: "recommendation_click", productIndex: 0, metadata: { recommendedSize: "M", clicked: true } },
  { eventType: "recommendation_click", productIndex: 2, metadata: { recommendedSize: "L", clicked: true } },
  { eventType: "recommendation_click", productIndex: 5, metadata: { recommendedSize: "34", clicked: true } },
  { eventType: "recommendation_click", productIndex: 7, metadata: { recommendedSize: "30", clicked: true } },
  { eventType: "recommendation_click", productIndex: 8, metadata: { recommendedSize: "6", clicked: true } },
  { eventType: "recommendation_click", productIndex: 9, metadata: { recommendedSize: "8", clicked: true } },
  { eventType: "recommendation_click", productIndex: 11, metadata: { recommendedSize: "L", clicked: true } },
  { eventType: "recommendation_click", productIndex: 13, metadata: { recommendedSize: "XL", clicked: true } },
  { eventType: "size_selected", productIndex: 0, metadata: { size: "M", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 0, metadata: { size: "L", source: "manual" } },
  { eventType: "size_selected", productIndex: 2, metadata: { size: "L", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 5, metadata: { size: "34", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 5, metadata: { size: "32", source: "manual" } },
  { eventType: "size_selected", productIndex: 7, metadata: { size: "30", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 8, metadata: { size: "6", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 9, metadata: { size: "10", source: "manual" } },
  { eventType: "size_selected", productIndex: 11, metadata: { size: "L", source: "recommendation" } },
  { eventType: "size_selected", productIndex: 14, metadata: { size: "M", source: "recommendation" } },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.analyticsEvent.deleteMany();
  await prisma.fitRecommendation.deleteMany();
  await prisma.customerFitProfile.deleteMany();
  await prisma.return.deleteMany();
  await prisma.review.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sizeChart.deleteMany();
  await prisma.shop.deleteMany();

  console.log("Cleared existing data.");

  // Create shop
  const shop = await prisma.shop.create({
    data: {
      shopDomain: "demo-apparel.myshopify.com",
      accessToken: "shpat_demo_token_xxxxx",
      scope:
        "read_products,write_products,read_orders,read_customers",
      onboardingDone: true,
      plan: "STARTER",
      widgetEnabled: true,
      widgetConfig: {
        primaryColor: "#2D3748",
        position: "bottom-right",
        showConfidence: true,
        language: "en",
      },
    },
  });
  console.log(`Created shop: ${shop.shopDomain}`);

  // Create size charts
  const topsChart = await prisma.sizeChart.create({
    data: {
      shopId: shop.id,
      name: topsSizeChart.name,
      productType: topsSizeChart.productType,
      measurements: topsSizeChart.measurements,
      unit: topsSizeChart.unit,
      isDefault: topsSizeChart.isDefault,
      healthScore: topsSizeChart.healthScore,
      issues: topsSizeChart.issues,
    },
  });

  const bottomsChart = await prisma.sizeChart.create({
    data: {
      shopId: shop.id,
      name: bottomsSizeChart.name,
      productType: bottomsSizeChart.productType,
      measurements: bottomsSizeChart.measurements,
      unit: bottomsSizeChart.unit,
      isDefault: bottomsSizeChart.isDefault,
      healthScore: bottomsSizeChart.healthScore,
      issues: bottomsSizeChart.issues,
    },
  });

  const dressesChart = await prisma.sizeChart.create({
    data: {
      shopId: shop.id,
      name: dressesSizeChart.name,
      productType: dressesSizeChart.productType,
      measurements: dressesSizeChart.measurements,
      unit: dressesSizeChart.unit,
      isDefault: dressesSizeChart.isDefault,
      healthScore: dressesSizeChart.healthScore,
      issues: dressesSizeChart.issues,
    },
  });

  console.log("Created 3 size charts.");

  // Map product types to size charts
  const sizeChartMap: Record<string, string> = {
    "T-Shirt": topsChart.id,
    Hoodie: topsChart.id,
    Jacket: topsChart.id,
    Jeans: bottomsChart.id,
    Dress: dressesChart.id,
  };

  // Create products with variants
  const createdProducts: { id: string; shopifyId: string }[] = [];

  for (const product of allProducts) {
    const created = await prisma.product.create({
      data: {
        shopId: shop.id,
        shopifyId: product.shopifyId,
        title: product.title,
        handle: product.handle,
        productType: product.productType,
        vendor: product.vendor,
        tags: product.tags,
        imageUrl: product.imageUrl,
        fitScore: product.fitScore,
        fitConfusion: product.fitConfusion,
        sizeChartId: sizeChartMap[product.productType] ?? null,
        lastSyncedAt: new Date(),
        variants: {
          create: product.variants.map((v) => ({
            shopifyId: v.shopifyId,
            title: v.title,
            size: v.size,
            sku: v.sku,
            price: v.price,
            inventoryQty: v.inventoryQty,
          })),
        },
      },
    });
    createdProducts.push({ id: created.id, shopifyId: created.shopifyId });
  }

  console.log(`Created ${createdProducts.length} products with variants.`);

  // Create reviews
  let reviewCount = 0;
  for (const review of sanitizedReviews) {
    const product = createdProducts[review.productIndex];
    await prisma.review.create({
      data: {
        shopId: shop.id,
        productId: product.id,
        externalId: `ext-review-${reviewCount + 1}`,
        rating: review.rating,
        body: review.body,
        author: review.author,
        fitMention: review.fitMention,
        sizeMention: review.sizeMention,
        sentiment: review.sentiment,
        parsedAt: new Date(),
      },
    });
    reviewCount++;
  }
  console.log(`Created ${reviewCount} reviews.`);

  // Create returns
  for (const ret of returns) {
    const product = createdProducts[ret.productIndex];
    await prisma.return.create({
      data: {
        shopId: shop.id,
        productId: product.id,
        orderId: ret.orderId,
        reason: ret.reason,
        sizeOrdered: ret.sizeOrdered,
        sizeExchanged: ret.sizeExchanged,
        notes: ret.notes,
      },
    });
  }
  console.log(`Created ${returns.length} returns.`);

  // Create customer fit profiles
  const createdProfiles: { id: string }[] = [];

  for (const profile of profiles) {
    const created = await prisma.customerFitProfile.create({
      data: {
        shopId: shop.id,
        customerId: profile.customerId,
        sessionId: profile.sessionId,
        height: profile.height,
        weight: profile.weight,
        preferredFit: profile.preferredFit,
        bodyType: profile.bodyType,
        measurements: profile.measurements,
      },
    });
    createdProfiles.push({ id: created.id });
  }
  console.log(`Created ${createdProfiles.length} customer fit profiles.`);

  // Create fit recommendations
  let recCount = 0;
  for (const rec of recommendations) {
    const profile = createdProfiles[rec.profileIndex];
    const product = createdProducts[rec.productIndex];
    await prisma.fitRecommendation.create({
      data: {
        profileId: profile.id,
        productId: product.id,
        recommendedSize: rec.recommendedSize,
        confidence: rec.confidence,
        fitPrediction: rec.fitPrediction,
        reasoning: rec.reasoning,
        modelFitNotes: rec.modelFitNotes,
      },
    });
    recCount++;
  }
  console.log(`Created ${recCount} fit recommendations.`);

  // Create analytics events
  for (const event of analyticsEvents) {
    const productId =
      event.productIndex !== null
        ? createdProducts[event.productIndex].id
        : null;
    await prisma.analyticsEvent.create({
      data: {
        shopId: shop.id,
        eventType: event.eventType,
        productId,
        metadata: event.metadata,
      },
    });
  }
  console.log(`Created ${analyticsEvents.length} analytics events.`);

  console.log("Seeding complete!");
}

main()
  .catch((e: Error) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
