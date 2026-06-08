const { getServiceSupabase, verifyUser, sendJson } = require("../_lib/supabase");

function groupByDay(orders) {
  const map = {};
  orders.forEach((order) => {
    const day = order.ordered_at?.slice(0, 10);
    if (!day) return;
    map[day] = (map[day] || 0) + Number(order.net_total || 0);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const user = await verifyUser(req);
  if (!user) return sendJson(res, 401, { error: "Unauthorized" });

  try {
    const supabase = getServiceSupabase();
    const days = Number(req.query.days || 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [{ data: orders }, { data: costs }, { data: connection }] = await Promise.all([
      supabase.from("orders_cache").select("*").gte("ordered_at", since.toISOString()).order("ordered_at", { ascending: false }),
      supabase.from("manual_costs").select("*").gte("cost_date", since.toISOString().slice(0, 10)),
      supabase.from("shopify_connections").select("shop_domain,last_sync_at").limit(1).maybeSingle(),
    ]);

    const orderList = orders || [];
    const costList = costs || [];

    const grossRevenue = orderList.reduce((sum, o) => sum + Number(o.gross_total || 0), 0);
    const netRevenue = orderList.reduce((sum, o) => sum + Number(o.net_total || 0), 0);
    const refundTotal = orderList.reduce((sum, o) => sum + Number(o.refund_total || 0), 0);
    const orderCount = orderList.length;
    const aov = orderCount ? netRevenue / orderCount : 0;
    const refundRate = grossRevenue ? (refundTotal / grossRevenue) * 100 : 0;

    const adSpend = costList.filter((c) => c.category === "ad_spend").reduce((s, c) => s + Number(c.amount), 0);
    const cogs = costList.filter((c) => c.category === "cogs").reduce((s, c) => s + Number(c.amount), 0);
    const expenses = costList.filter((c) => c.category === "expense" || c.category === "other").reduce((s, c) => s + Number(c.amount), 0);
    const totalCosts = adSpend + cogs + expenses;
    const netProfit = netRevenue - totalCosts;
    const roas = adSpend > 0 ? netRevenue / adSpend : null;

    return sendJson(res, 200, {
      shop: connection?.shop_domain || null,
      lastSyncAt: connection?.last_sync_at || null,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      refundTotal: Number(refundTotal.toFixed(2)),
      refundRate: Number(refundRate.toFixed(1)),
      orderCount,
      aov: Number(aov.toFixed(2)),
      adSpend: Number(adSpend.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      roas: roas ? Number(roas.toFixed(2)) : null,
      revenueByDay: groupByDay(orderList),
      recentOrders: orderList.slice(0, 10).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        email: o.customer_email,
        netTotal: o.net_total,
        status: o.financial_status,
        orderedAt: o.ordered_at,
      })),
      manualCosts: costList.slice(0, 20),
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message });
  }
};
