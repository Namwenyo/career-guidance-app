import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// Helper functions to parse database data
function parseAdmissionRequirements(structuredReqs: string | object | null | undefined): any[] {
  if (!structuredReqs) return []

  try {
    // Handle both string JSON and already-parsed objects
    let parsed: Record<string, string>;
    
    if (typeof structuredReqs === 'string') {
      parsed = JSON.parse(structuredReqs);
    } else if (typeof structuredReqs === 'object' && structuredReqs !== null) {
      parsed = structuredReqs as Record<string, string>;
    } else {
      console.error("Invalid structured requirements format:", structuredReqs);
      return [];
    }

    return Object.entries(parsed).map(([subject, requirement]) => {
      const reqStr = requirement as string
      let level = "NSSCO"
      let minGrade = "C"

      if (reqStr.includes("NSSCAS")) {
        level = "NSSCAS"
        const gradeMatch = reqStr.match(/>=\s*([A-F])/i)
        minGrade = gradeMatch ? gradeMatch[1] : "D"
      } else if (reqStr.includes("NSSCH")) {
        level = "NSSCH"
        const gradeMatch = reqStr.match(/=\s*([1-4])/i)
        minGrade = gradeMatch ? gradeMatch[1] : "3"
      } else if (reqStr.includes("NSSCO")) {
        level = "NSSCO"
        const gradeMatch = reqStr.match(/>=\s*([A-G])/i)
        minGrade = gradeMatch ? gradeMatch[1] : "C"
      }

      return {
        subject: subject.replace(/\//g, "/"),
        level,
        minGrade,
      }
    })
  } catch (error) {
    console.error("Error parsing admission requirements:", error, structuredReqs)
    return []
  }
}

function parseCareerPossibilities(careers: string): string[] {
  if (!careers) return []
  return careers
    .split(",")
    .map((career) => career.trim())
    .filter(Boolean)
}

function parseInterestCategories(interests: string): string[] {
  if (!interests) return []

  return interests
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean)
}

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id,
        institution,
        program_name,
        program_code,
        faculty,
        duration,
        minimum_points,
        readable_requirements,
        structured_requirements,
        career_possibilities,
        interest_category
      FROM guidance_program
      ORDER BY institution, program_name
    `)

    const programs = result.rows.map((row: any, index: number) => ({
       id: row.id.toString(),
      institution: row.institution as "UNAM" | "NUST" | "IUM",
      faculty: row.faculty || "",
      programName: row.program_name || "",
      programCode: row.program_code || "",
      duration: row.duration || "",
      minPoints: Number.parseInt(row.minimum_points) || 0,
      admissionRequirements: parseAdmissionRequirements(row.structured_requirements),
      careerPossibilities: parseCareerPossibilities(row.career_possibilities),
      interestCategories: parseInterestCategories(row.interest_category),
    }))

    return NextResponse.json(programs)
  } catch (error) {
    console.error("Error fetching programs:", error)
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 })
  }
}