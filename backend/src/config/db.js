const { Pool } = require("pg");
const { env } = require("./env");

// Managed Postgres providers (Supabase, Neon, RDS) require TLS; a local
// Docker Postgres does not. Gate SSL on an explicit env flag so the same
// code works in both setups. Default ON in production for safety; off in
// development unless the operator opts in.
const wantSsl =
  env.DATABASE_SSL === "true" ||
  (env.DATABASE_SSL === undefined && env.NODE_ENV === "production");

const db = new Pool({
  connectionString: env.DATABASE_URL,
  ...(wantSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = { db };
