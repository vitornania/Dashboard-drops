const { verifyUser, sendJson } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const user = await verifyUser(req);
  if (!user) return sendJson(res, 401, { error: "Unauthorized" });

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

  return sendJson(res, 200, {
    configured: Boolean(apiKey && apiSecret && appUrl),
    hasApiKey: Boolean(apiKey),
    hasApiSecret: Boolean(apiSecret),
    hasAppUrl: Boolean(appUrl),
    redirectUrl: appUrl ? `${appUrl}/api/shopify/callback` : null,
  });
};
