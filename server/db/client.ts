import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

export function useDb() {
  const url = process.env.DATABASE_URL_POOL || process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL_POOL / DATABASE_URL");

  const sql = neon(url);
  return drizzle(sql);
}
