import { NextResponse } from "next/server"
import { getUniversityPrograms } from "@/lib/database-queries"
import { getProgramById } from "@/lib/matching-algorithm"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const programs = await getUniversityPrograms()
    const program = getProgramById(programs, params.id)

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}