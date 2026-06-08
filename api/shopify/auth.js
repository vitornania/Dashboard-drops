const { getServiceSupabase, verifyUser, sendJson } = require("../_lib/supabase");
const { getAppUrl, normalizeShop, buildAuthUrl, getShopifyConfig } = require("../_lib/shopify");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const user = await verifyUser(req);
  if (!user) return sendJson(res, 401, { error: "Unauthorized" });

  const shop = normalizeShop(req.query.shop);
  if (!shop) return sendJson(res, 400, { error: "Invalid shop domain" });

  try {
    getShopifyConfig();
  } catch (err) {
    return sendJson(res, 503, { error: err.message });
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `shopify_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );

  return res.redirect(302, buildAuthUrl(shop, state));
};
