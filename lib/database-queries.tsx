import { query } from "./database"
import type { UniversityProgram, GeneralRequirements } from "./university-data"

// Helper functions to parse CSV data format
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
        const gradeMatch = reqStr.match(/>=\s*([A-E])/i)
        minGrade = gradeMatch ? gradeMatch[1] : "D"
      } else if (reqStr.includes("NSSCH")) {
        level = "NSSCH"
        const gradeMatch = reqStr.match(/=\s*([1-4])/i)
        minGrade = gradeMatch ? gradeMatch[1] : "3"
      } else if (reqStr.includes("NSSCO")) {
        level = "NSSCO"
        const gradeMatch = reqStr.match(/>=\s*([A-F])/i)
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

  // Map your interest categories to our standard categories
  const categoryMap: Record<string, string[]> = {
    Health: ["Health & Medicine"],
    Science: ["Science & Research"],
    Technology: ["Technology & Computing"],
    Computing: ["Technology & Computing"],
    Engineering: ["Engineering & Construction"],
    Business: ["Business & Finance"],
    Finance: ["Business & Finance"],
    Agriculture: ["Agriculture & Environment"],
    Environment: ["Agriculture & Environment"],
    Mathematics: ["Mathematics & Statistics"],
    Communication: ["Arts & Communication"],
    Media: ["Arts & Communication"],
    Tourism: ["Tourism & Hospitality"],
    Military: ["Military & Security"],
    Security: ["Military & Security"],
    Law: ["Law & Justice"],
    Justice: ["Law & Justice"],
  }

  const categories: string[] = []
  const interestText = interests.toLowerCase()

  Object.entries(categoryMap).forEach(([key, values]) => {
    if (interestText.includes(key.toLowerCase())) {
      categories.push(...values)
    }
  })

  return [...new Set(categories)] // Remove duplicates
}

export async function getUniversityPrograms(): Promise<UniversityProgram[]> {
  try {
    const result = await query(`
      SELECT 
        id,
        institution,
        faculty,
        department,
        program_name,
        program_code,
        duration,
        minimum_points as min_points,
        readable_requirements as admission_requirements_readable,
        structured_requirements as admission_requirements_structured,
        career_possibilities,
        interest_category as interest_categories
     FROM guidance_program
     ORDER BY institution, program_name
    `)

    return result.rows.map((row: any, index: number) => ({
      id: row.id.toString(),
      institution: row.institution as "UNAM" | "NUST" | "IUM",
      faculty: row.faculty || "",
      department: row.department || "",
      programName: row.program_name || "",
      programCode: row.program_code || "",
      duration: row.duration || "",
      minPoints: Number.parseInt(row.min_points) || 0,
      admissionRequirements: parseAdmissionRequirements(row.admission_requirements_structured),
      careerPossibilities: parseCareerPossibilities(row.career_possibilities),
      interestCategories: parseInterestCategories(row.interest_categories),
    }))
  } catch (error) {
    console.error("Error fetching university programs:", error)
    // I REMOVED MOCK DATA FALLBACK - Return empty array instead
    return []
  }
}

export async function getGeneralRequirements(): Promise<GeneralRequirements[]> {
  try {
    const result = await query(`
      SELECT 
        institution,
        degree_requirements as "degreeRequirements",
        diploma_requirements as "diplomaRequirements"
      FROM general_requirements
      ORDER BY institution
    `)

    return result.rows.map((row: any) => ({
      ...row,
      degreeRequirements: JSON.parse(row.degreeRequirements || "{}"),
      diplomaRequirements: row.diplomaRequirements ? JSON.parse(row.diplomaRequirements) : undefined,
    }))
  } catch (error) {
    console.error("Error fetching general requirements:", error)
    // I REMOVED MOCK DATA FALLBACK - Return empty array instead
    return []
  }
}

export async function getInterestCategories(): Promise<string[]> {
  try {
    const result = await query(`
      SELECT DISTINCT interest_category as category_name
      FROM guidance_program
      ORDER BY interest_category
    `)

    return result.rows.map((row: any) => row.category_name)
  } catch (error) {
    console.error("Error fetching interest categories:", error)
    // I REMOVED MOCK DATA FALLBACK - Return empty array instead
    return []
  }
}