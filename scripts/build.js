const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

process.env.REACT_APP_SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "";
process.env.REACT_APP_SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (url && key) {
  fs.writeFileSync(
    path.join(__dirname, "../public/supabase-config.json"),
    JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key })
  );
}

execSync("cross-env CI=false GENERATE_SOURCEMAP=false PUBLIC_URL=/ react-scripts build", {
  stdio: "inherit",
  env: process.env,
});
