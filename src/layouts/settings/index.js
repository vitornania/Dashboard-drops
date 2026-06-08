import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { getSupabase, isSupabaseConfigured } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";
import { useApiFetch } from "lib/api";

function Settings() {
  const location = useLocation();
  const apiFetch = useApiFetch();
  const { signOut } = useAuth();
  const [shopDomain, setShopDomain] = useState("");
  const [connection, setConnection] = useState(null);
  const [shopifyStatus, setShopifyStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadConnection = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from("shopify_connections").select("shop_domain,last_sync_at,scopes").limit(1).maybeSingle();
    setConnection(data);
    if (data?.shop_domain) setShopDomain(data.shop_domain.replace(".myshopify.com", ""));
  };

  const loadShopifyStatus = async () => {
    try {
      const status = await apiFetch("/api/shopify/status");
      setShopifyStatus(status);
    } catch {
      setShopifyStatus(null);
    }
  };

  useEffect(() => {
    loadConnection();
    loadShopifyStatus();
    const params = new URLSearchParams(location.search);
    const status = params.get("shopify");
    if (status === "connected") setMessage("Shopify connected successfully.");
    if (status === "error") setMessage("Shopify connection failed. Check app credentials and redirect URL.");
    if (status === "invalid_shop") setMessage("Invalid shop domain.");
  }, [location.search]);

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      setMessage("Enter your shop domain first.");
      return;
    }
    if (!shopifyStatus?.configured) {
      setMessage(
        "Shopify app credentials are not configured. Add SHOPIFY_API_KEY and SHOPIFY_API_SECRET to .env.local, then restart the dev server."
      );
      return;
    }
    const shop = shopDomain.includes(".") ? shopDomain : `${shopDomain}.myshopify.com`;
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setMessage("You must be signed in to connect Shopify.");
      return;
    }
    try {
      const response = await fetch(`/api/shopify/auth?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`, {
        redirect: "manual",
      });
      if (response.status === 503) {
        const err = await response.json();
        setMessage(err.error || "Shopify is not configured.");
        return;
      }
      if (response.status >= 300 && response.status < 400) {
        window.location.href = response.headers.get("Location") || `/api/shopify/auth?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
        return;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || `Connect failed (${response.status})`);
        return;
      }
      window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
    } catch (err) {
      setMessage(err.message);
    }
  };

  const syncNow = async () => {
    try {
      setSyncing(true);
      const result = await apiFetch("/api/cron/sync-orders", { method: "GET" });
      setMessage(result.message ? result.message : `Synced ${result.synced} orders from ${result.shop || "store"}.`);
      loadConnection();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3} maxWidth="720px">
        <VuiTypography variant="h4" color="white" fontWeight="bold" mb={3}>
          Settings
        </VuiTypography>
        {message && (
          <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(0,117,255,0.15)" }}>
            <VuiTypography color="white">{message}</VuiTypography>
          </VuiBox>
        )}

        <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }} mb={3}>
          <VuiTypography variant="lg" color="white" fontWeight="bold" mb={1}>
            Shopify connection
          </VuiTypography>
          <VuiTypography color="text" mb={2}>
            Connect your store to sync orders into the revenue dashboard.
          </VuiTypography>
          {shopifyStatus && !shopifyStatus.configured && (
            <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(227,26,26,0.12)" }}>
              <VuiTypography color="error" variant="button">
                Missing server env vars: {!shopifyStatus.hasApiKey ? "SHOPIFY_API_KEY " : ""}
                {!shopifyStatus.hasApiSecret ? "SHOPIFY_API_SECRET " : ""}
                {!shopifyStatus.hasAppUrl ? "APP_URL" : ""}
              </VuiTypography>
              {shopifyStatus.redirectUrl && (
                <VuiTypography color="text" variant="caption" display="block" mt={1}>
                  OAuth redirect URL for your Shopify app: {shopifyStatus.redirectUrl}
                </VuiTypography>
              )}
            </VuiBox>
          )}
          {connection && (
            <VuiBox mb={2}>
              <VuiTypography color="white">Connected: {connection.shop_domain}</VuiTypography>
              <VuiTypography color="text" variant="caption">
                Last sync: {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleString() : "Never"}
              </VuiTypography>
            </VuiBox>
          )}
          <VuiInput
            placeholder="your-store (without .myshopify.com)"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            sx={{ mb: 2 }}
          />
          <VuiBox display="flex" gap={1} flexWrap="wrap">
            <VuiButton color="info" onClick={handleConnect}>
              {connection ? "Reconnect Shopify" : "Connect Shopify"}
            </VuiButton>
            <VuiButton color="secondary" onClick={syncNow} disabled={syncing || !connection}>
              {syncing ? "Syncing..." : "Sync orders now"}
            </VuiButton>
            <VuiButton color="error" onClick={signOut}>
              Sign out
            </VuiButton>
          </VuiBox>
        </VuiBox>

        <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
          <VuiTypography variant="lg" color="white" fontWeight="bold" mb={1}>
            Environment
          </VuiTypography>
          <VuiTypography color="text" component="div">
            <ul>
              <li>Supabase: {isSupabaseConfigured() ? "connected" : "missing env vars on Vercel"}</li>
              <li>Shopify OAuth: {shopifyStatus?.configured ? "ready" : "needs Client ID + secret in .env.local"}</li>
              <li>Local dev: run `npm run dev:vercel` (not plain `npm start`) for API routes</li>
            </ul>
          </VuiTypography>
        </VuiBox>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Settings;
