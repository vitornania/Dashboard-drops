const { verifyUser, sendJson } = require("../_lib/supabase");

function getPublicSupabaseConfig() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return { supabaseUrl, supabaseAnonKey };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  if (req.query?.bootstrap === "supabase") {
    const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();
    if (!supabaseUrl || !supabaseAnonKey) {
      return sendJson(res, 503, {
        error: "Supabase is not configured on the server",
        missing: { url: !supabaseUrl, anonKey: !supabaseAnonKey },
      });
    }
    return sendJson(res, 200, { supabaseUrl, supabaseAnonKey });
  }

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
