const { getServiceSupabase, verifyUser, sendJson } = require("../_lib/supabase");
const { syncRecentOrders } = require("../_lib/shopify");

module.exports = async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const user = await verifyUser(req);
    if (!user) return sendJson(res, 401, { error: "Unauthorized" });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: connections, error } = await supabase.from("shopify_connections").select("*").limit(1);
    if (error) throw error;
    if (!connections?.length) return sendJson(res, 200, { synced: 0, message: "No Shopify connection" });

    const count = await syncRecentOrders(supabase, connections[0]);
    return sendJson(res, 200, { synced: count, shop: connections[0].shop_domain });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message });
  }
};
