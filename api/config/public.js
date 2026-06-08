const { sendJson } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return sendJson(res, 503, {
      error: "Supabase is not configured on the server",
      missing: {
        url: !supabaseUrl,
        anonKey: !supabaseAnonKey,
      },
    });
  }

  return sendJson(res, 200, { supabaseUrl, supabaseAnonKey });
};
