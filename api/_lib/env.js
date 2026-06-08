const path = require("path");

function loadLocalEnv() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.REACT_APP_SUPABASE_URL) return;
  require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.join(process.cwd(), ".env") });
}

loadLocalEnv();

module.exports = { loadLocalEnv };
