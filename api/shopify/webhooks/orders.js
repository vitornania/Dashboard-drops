const { getServiceSupabase } = require("../_lib/supabase");
const { verifyWebhookHmac } = require("../_lib/shopify");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  const hmac = req.headers["x-shopify-hmac-sha256"];
  const shop = req.headers["x-shopify-shop-domain"];
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  try {
    if (hmac && process.env.SHOPIFY_API_SECRET) {
      verifyWebhookHmac(rawBody, hmac);
    }

    const payload = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
    const supabase = getServiceSupabase();
    const row = {
      id: payload.id,
      shop_domain: shop,
      order_number: payload.name,
      customer_email: payload.email,
      financial_status: payload.financial_status,
      fulfillment_status: payload.fulfillment_status,
      currency: payload.currency || "USD",
      gross_total: parseFloat(payload.total_price || "0"),
      net_total: parseFloat(payload.current_total_price || payload.total_price || "0"),
      refund_total: parseFloat(payload.total_refunded || "0"),
      ordered_at: payload.processed_at || payload.created_at,
      raw: payload,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("orders_cache").upsert(row, { onConflict: "id" });
    res.status(200).end("OK");
  } catch (err) {
    console.error(err);
    res.status(401).end("Webhook rejected");
  }
};
