import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import LineChart from "examples/Charts/LineCharts/LineChart";

import { IoWallet, IoTrendingUp, IoCart, IoStatsChart } from "react-icons/io5";
import { formatCurrency, useApiFetch } from "lib/api";
import { supabase } from "lib/supabaseClient";

function Revenue() {
  const apiFetch = useApiFetch();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [costForm, setCostForm] = useState({ category: "ad_spend", amount: "", note: "", cost_date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/metrics/revenue?days=30");
      setMetrics(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const chartData = [
    {
      name: "Revenue",
      data: (metrics?.revenueByDay || []).map((d) => d.revenue),
    },
  ];

  const chartOptions = {
    chart: { toolbar: { show: false }, foreColor: "#A0AEC0" },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: (metrics?.revenueByDay || []).map((d) => d.date),
      labels: { style: { colors: "#A0AEC0" } },
    },
    colors: ["#0075FF"],
    grid: { borderColor: "rgba(226,232,240,0.1)" },
  };

  const handleAddCost = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("manual_costs").insert({
      category: costForm.category,
      amount: Number(costForm.amount),
      note: costForm.note,
      cost_date: costForm.cost_date,
      created_by: userData.user?.id,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDrawerOpen(false);
    setCostForm({ category: "ad_spend", amount: "", note: "", cost_date: new Date().toISOString().slice(0, 10) });
    loadMetrics();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Revenue
            </VuiTypography>
            <VuiTypography variant="button" color="text">
              Shopify performance & profit tracking
            </VuiTypography>
          </VuiBox>
          <VuiButton color="info" onClick={() => setDrawerOpen(true)}>
            Add cost / ad spend
          </VuiButton>
        </VuiBox>

        {error && (
          <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(227,26,26,0.15)" }}>
            <VuiTypography color="error">{error}</VuiTypography>
          </VuiBox>
        )}

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Net revenue", fontWeight: "regular" }}
              count={loading ? "..." : formatCurrency(metrics?.netRevenue)}
              percentage={{ color: "success", text: `${metrics?.orderCount || 0} orders` }}
              icon={{ color: "info", component: <IoWallet size="22px" color="white" /> }}
            />
          </Grid>
          <Grid item xs={12} md={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Net profit", fontWeight: "regular" }}
              count={loading ? "..." : formatCurrency(metrics?.netProfit)}
              percentage={{ color: metrics?.netProfit >= 0 ? "success" : "error", text: "after costs" }}
              icon={{ color: "info", component: <IoTrendingUp size="22px" color="white" /> }}
            />
          </Grid>
          <Grid item xs={12} md={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Average order", fontWeight: "regular" }}
              count={loading ? "..." : formatCurrency(metrics?.aov)}
              percentage={{ color: "info", text: `${metrics?.refundRate || 0}% refunds` }}
              icon={{ color: "info", component: <IoCart size="22px" color="white" /> }}
            />
          </Grid>
          <Grid item xs={12} md={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Est. ROAS", fontWeight: "regular" }}
              count={loading ? "..." : metrics?.roas ? `${metrics.roas}x` : "—"}
              percentage={{ color: "success", text: formatCurrency(metrics?.adSpend) + " ads" }}
              icon={{ color: "info", component: <IoStatsChart size="22px" color="white" /> }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                Revenue (30 days)
              </VuiTypography>
              {metrics?.revenueByDay?.length ? (
                <LineChart lineChartData={chartData} lineChartOptions={chartOptions} />
              ) : (
                <VuiTypography color="text">Connect Shopify in Settings to sync orders.</VuiTypography>
              )}
            </VuiBox>
          </Grid>
          <Grid item xs={12} lg={5}>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }} height="100%">
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                P&amp;L snapshot
              </VuiTypography>
              {[
                ["Gross revenue", metrics?.grossRevenue],
                ["Refunds", metrics?.refundTotal],
                ["Ad spend", metrics?.adSpend],
                ["COGS", metrics?.cogs],
                ["Expenses", metrics?.expenses],
                ["Net profit", metrics?.netProfit],
              ].map(([label, value]) => (
                <VuiBox key={label} display="flex" justifyContent="space-between" mb={1}>
                  <VuiTypography color="text">{label}</VuiTypography>
                  <VuiTypography color="white">{loading ? "..." : formatCurrency(value)}</VuiTypography>
                </VuiBox>
              ))}
            </VuiBox>
          </Grid>
          <Grid item xs={12}>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                Recent orders
              </VuiTypography>
              {(metrics?.recentOrders || []).map((order) => (
                <VuiBox key={order.id} display="flex" justifyContent="space-between" py={1} borderBottom="1px solid rgba(255,255,255,0.06)">
                  <VuiTypography color="white">{order.orderNumber}</VuiTypography>
                  <VuiTypography color="text">{order.email || "—"}</VuiTypography>
                  <VuiTypography color="white">{formatCurrency(order.netTotal)}</VuiTypography>
                  <VuiTypography color="text">{order.status}</VuiTypography>
                </VuiBox>
              ))}
              {!metrics?.recentOrders?.length && (
                <VuiTypography color="text">No orders cached yet.</VuiTypography>
              )}
            </VuiBox>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <VuiBox p={3} width="360px" sx={{ backgroundColor: "#0f1428", minHeight: "100vh" }}>
          <VuiTypography variant="h5" color="white" mb={2}>
            Add manual cost
          </VuiTypography>
          <form onSubmit={handleAddCost}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: "#A0AEC0" }}>Category</InputLabel>
              <Select
                value={costForm.category}
                label="Category"
                onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
              >
                <MenuItem value="ad_spend">Ad spend</MenuItem>
                <MenuItem value="cogs">COGS</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={costForm.cost_date}
              onChange={(e) => setCostForm({ ...costForm, cost_date: e.target.value })}
              sx={{ mb: 2 }}
            />
            <VuiInput
              type="number"
              placeholder="Amount"
              value={costForm.amount}
              onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
              sx={{ mb: 2 }}
            />
            <VuiInput
              placeholder="Note (optional)"
              value={costForm.note}
              onChange={(e) => setCostForm({ ...costForm, note: e.target.value })}
              sx={{ mb: 2 }}
            />
            <VuiButton type="submit" color="info" fullWidth>
              Save
            </VuiButton>
          </form>
        </VuiBox>
      </Drawer>
    </DashboardLayout>
  );
}

export default Revenue;
