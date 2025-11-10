// app/api/programs/[id]/route.ts
import { NextResponse } from "next/server"
import { getUniversityPrograms } from "@/lib/database-queries"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const programs = await getUniversityPrograms()
    
    // Try to find program by ID (handle both formats)
    let program = programs.find(p => p.id === params.id)
    
    // If not found, try to find by program code or other identifier
    if (!program) {
      program = programs.find(p => p.programCode === params.id)
    }
    
    // If still not found, try to find by numeric index (fallback)
    if (!program && !isNaN(Number(params.id))) {
      const index = Number(params.id)
      program = programs[index]
    }

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}