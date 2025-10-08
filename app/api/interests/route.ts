import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT DISTINCT interest_category
      FROM guidance_program
      WHERE interest_category IS NOT NULL AND interest_category != ''
      ORDER BY interest_category
    `)

    const allInterests = new Set<string>()

    result.rows.forEach((row: any) => {
      if (row.interest_category) {
        const interests = row.interest_category
          .split(",")
          .map((interest: string) => interest.trim())
          .filter(Boolean)

        interests.forEach((interest: string) => allInterests.add(interest))
      }
    })

    const sortedInterests = Array.from(allInterests).sort()
    return NextResponse.json(sortedInterests)
  } catch (error) {
    console.error("Error fetching interests:", error)
    return NextResponse.json({ error: "Failed to fetch interests" }, { status: 500 })
  }
}
