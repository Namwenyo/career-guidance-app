import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "career_guidance",
      user: process.env.DB_USER || "career_user",
      password: process.env.DB_PASSWORD || "Sisolo@26",
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}
