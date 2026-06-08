require("./env");
const crypto = require("crypto");

function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const appUrl = getAppUrl();
  if (!apiKey || !apiSecret) {
    throw new Error("Shopify app credentials missing. Add SHOPIFY_API_KEY and SHOPIFY_API_SECRET to .env.local");
  }
  if (!appUrl) {
    throw new Error("APP_URL is missing from environment");
  }
  return { apiKey, apiSecret, appUrl };
}

function normalizeShop(shop) {
  if (!shop) return null;
  let domain = shop.trim().toLowerCase();
  if (!domain.includes(".")) domain = `${domain}.myshopify.com`;
  if (!domain.endsWith(".myshopify.com")) return null;
  return domain;
}

function buildAuthUrl(shop, state) {
  const { apiKey } = getShopifyConfig();
  const scopes = process.env.SHOPIFY_SCOPES || "read_orders,read_products,read_customers";
  const redirectUri = `${getAppUrl()}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

async function exchangeToken(shop, code) {
  const { apiKey, apiSecret } = getShopifyConfig();
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  return response.json();
}

function verifyWebhookHmac(rawBody, hmacHeader) {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

async function shopifyGraphQL(shop, accessToken, query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify GraphQL error: ${text}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  return json.data;
}

const ORDERS_QUERY = `
  query Orders($first: Int!, $query: String) {
    orders(first: $first, sortKey: PROCESSED_AT, reverse: true, query: $query) {
      edges {
        node {
          id
          name
          email
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          totalRefundedSet { shopMoney { amount currencyCode } }
          currentTotalPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }
  }
`;

function parseOrderNode(node, shopDomain) {
  const gross = parseFloat(node.totalPriceSet?.shopMoney?.amount || "0");
  const refund = parseFloat(node.totalRefundedSet?.shopMoney?.amount || "0");
  const net = parseFloat(node.currentTotalPriceSet?.shopMoney?.amount || "0");
  const idPart = node.id.split("/").pop();
  return {
    id: Number(idPart),
    shop_domain: shopDomain,
    order_number: node.name,
    customer_email: node.email,
    financial_status: node.displayFinancialStatus,
    fulfillment_status: node.displayFulfillmentStatus,
    currency: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
    gross_total: gross,
    net_total: net,
    refund_total: refund,
    ordered_at: node.processedAt,
    raw: node,
    updated_at: new Date().toISOString(),
  };
}

async function syncRecentOrders(supabase, connection, daysBack = 90) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const query = `processed_at:>=${since.toISOString()}`;
  const data = await shopifyGraphQL(connection.shop_domain, connection.access_token, ORDERS_QUERY, {
    first: 100,
    query,
  });

  const rows = (data.orders?.edges || []).map(({ node }) => parseOrderNode(node, connection.shop_domain));
  if (rows.length) {
    const { error } = await supabase.from("orders_cache").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  await supabase
    .from("shopify_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", connection.id);

  return rows.length;
}

module.exports = {
  getAppUrl,
  getShopifyConfig,
  normalizeShop,
  buildAuthUrl,
  exchangeToken,
  verifyWebhookHmac,
  shopifyGraphQL,
  parseOrderNode,
  syncRecentOrders,
  ORDERS_QUERY,
};
