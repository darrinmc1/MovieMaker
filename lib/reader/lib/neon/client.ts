import { neon } from "@neondatabase/serverless"

// Use NEON_DATABASE_URL or fall back to other common Neon env var names
const connectionString =
  process.env.NEON_DATABASE_URL ||
  process.env.NEON_POSTGRES_URL ||
  process.env.DATABASE_URL

if (!connectionString) {
  console.warn("No Neon database connection string found")
}

export const sql = neon(connectionString || "")

export function getNeonClient() {
  if (!connectionString) {
    throw new Error("Missing Neon database connection string (NEON_DATABASE_URL)")
  }
  return sql
}
