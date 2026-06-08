require("./env");
const { createClient } = require("@supabase/supabase-js");

function getServiceSupabase() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service configuration");
  }
  return createClient(url, key);
}

async function verifyUser(req) {
  const authHeader = req.headers.authorization || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "") || req.query?.token || req.query?.authorization || "";
  if (!token) return null;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = { getServiceSupabase, verifyUser, sendJson };
