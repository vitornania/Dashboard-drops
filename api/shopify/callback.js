const { getServiceSupabase } = require("../_lib/supabase");
const { getAppUrl, normalizeShop, exchangeToken } = require("../_lib/shopify");

function getCookie(req, name) {
  const header = req.headers.cookie || "";
  const match = header.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  const { shop, code, state } = req.query;
  const savedState = getCookie(req, "shopify_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    res.redirect(302, `${getAppUrl()}/settings?shopify=error`);
    return;
  }

  const shopDomain = normalizeShop(shop);
  if (!shopDomain) {
    res.redirect(302, `${getAppUrl()}/settings?shopify=invalid_shop`);
    return;
  }

  try {
    const tokenData = await exchangeToken(shopDomain, code);
    const supabase = getServiceSupabase();

    const { error } = await supabase.from("shopify_connections").upsert(
      {
        shop_domain: shopDomain,
        access_token: tokenData.access_token,
        scopes: tokenData.scope || process.env.SHOPIFY_SCOPES,
      },
      { onConflict: "shop_domain" }
    );

    if (error) throw error;
    res.redirect(302, `${getAppUrl()}/settings?shopify=connected`);
  } catch (err) {
    console.error(err);
    res.redirect(302, `${getAppUrl()}/settings?shopify=error`);
  }
};
