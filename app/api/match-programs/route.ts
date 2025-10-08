import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import type { StudentProfile, UniversityProgram } from "@/lib/university-data"

const LEVEL_HIERARCHY: Record<string, number> = {
  "NSSCAS": 3,
  "NSSCH": 2,
  "HIGCSE": 2,
  "NSSCO": 1,
  "IGCSE": 1
}
  

export async function POST(request: NextRequest) {
  try {
    const studentProfile: StudentProfile = await request.json()

    // Get programs from database 
    const result = await query( 
      ` 
      SELECT  
        institution, 
        faculty, 
        program_name AS name, 
        program_code AS code, 
        duration, 
        minimum_points as min_points, 
        readable_requirements as admission_requirements_readable, 
        structured_requirements as admission_requirements_structured, 
        career_possibilities, 
        interest_category 
      FROM guidance_program 
      WHERE institution = ANY($1) 
      ORDER BY institution, faculty, program_name 
    `, 
      [studentProfile.preferredUniversities], 
    ) 

    const programs: UniversityProgram[] = result.rows.map((row: any) => ({ 
      id: `${row.institution}-${row.code}`, 
      institution: row.institution, 
      faculty: row.faculty, 
      programName: row.name, 
      programCode: row.code, 
      duration: row.duration, 
      minPoints: Number.parseInt(row.min_points) || 0, 
      admissionRequirements: parseAdmissionRequirements(row.admission_requirements_structured), 
      careerPossibilities: row.career_possibilities 
        ? row.career_possibilities.split(",").map((s: string) => s.trim()) 
        : [], 
      interestCategories: row.interest_category ? 
        row.interest_category.split(",").map((s: string) => s.trim()) : [], 
    })) 

    // USE DJANGO AI
    const matchingResults = await getDjangoAIMatches(studentProfile, programs)

    return NextResponse.json(matchingResults) 
  } catch (error) { 
    console.error("Matching error:", error) 
    return NextResponse.json({ error: "Failed to match programs" }, { status: 500 }) 
  } 
}

// Calling Django AI for matching
async function getDjangoAIMatches(studentProfile: StudentProfile, programs: UniversityProgram[]) {
  try {
    console.log("🔄 Calling Django AI matching...")
    
    // Prepare data in the format Django expects
    const requestData = {
      subjects: studentProfile.subjects.map(subject => ({
        name: subject.subject,
        level: subject.level,
        grade: subject.grade || "" // Handle missing grades
      })),
      interests: studentProfile.interests || []
    }

    console.log("📤 Sending to Django:", JSON.stringify(requestData, null, 2))

    // Call Django AI endpoint
  const djangoResponse = await fetch('http://localhost:8000/api/match-programs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text()
      throw new Error(`Django API error: ${djangoResponse.status} - ${errorText}`)
    }

    const djangoData = await djangoResponse.json()
    console.log("📥 Received from Django:", JSON.stringify(djangoData, null, 2))

    // Transform Django response to my format
    return transformDjangoToYourFormat(djangoData, studentProfile, programs)
    
  } catch (error) {
    console.error('❌ Django AI matching failed:', error)
    
    // 🚫 NO FALLBACK - Throwing an  error so i know it's not working
     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
  throw new Error(`Django AI service unavailable: ${errorMessage}`)
  }
}

// 🚀transform Django AI response to my typescripts format
function transformDjangoToYourFormat(
  djangoData: any, 
  studentProfile: StudentProfile, 
  programs: UniversityProgram[]
) {
  console.log("🔄 Transforming Django response...")
  
  const djangoPrograms = djangoData.programs || []
  const matchCount = djangoData.match_count || 0
  
  console.log(`📊 Django found ${matchCount} matching programs`)

  // Create matches in my existing existing format
  const matches = djangoPrograms.map((djangoProgram: any) => {
    // Find the original program object from the database results
    const originalProgram = programs.find(p => 
      p.id === `${djangoProgram.institution}-${djangoProgram.program_code}` ||
      p.programName === djangoProgram.program_name
    )
    
    if (!originalProgram) {
      console.warn(`❌ Program not found in local database:`, djangoProgram.program_name)
      return null
    }

    // Calculate additional fields your system expects
    const { eligible, missingRequirements } = checkProgramRequirements(studentProfile, originalProgram)
    const interestAlignment = calculateInterestAlignment(studentProfile.interests, originalProgram.interestCategories)
    const pointsRatio = studentProfile.totalPoints / originalProgram.minPoints

    let eligibilityStatus: "eligible" | "not-eligible" | "borderline"
    if (eligible) {
      eligibilityStatus = "eligible"
    } else if (missingRequirements.length <= 2 && pointsRatio > 0.8) {
      eligibilityStatus = "borderline"
    } else {
      eligibilityStatus = "not-eligible"
    }

    // Use AI similarity score - Django doesn't return scores, so we'll calculate
    const matchScore = calculateMatchScore(eligibilityStatus, interestAlignment, pointsRatio)

    console.log(`🎯 Program: ${originalProgram.programName}, Score: ${matchScore}`)

    return {
      program: originalProgram,
      matchScore,
      eligibilityStatus,
      missingRequirements,
      interestAlignment,
      recommendationReason: generateRecommendationReason(
        originalProgram,
        eligibilityStatus,
        interestAlignment,
        missingRequirements,
      ),
    }
  }).filter(Boolean) // Remove nulls

  // Sort by score (highest first)
  matches.sort((a: any, b: any) => b.matchScore - a.matchScore)

  // Keep your existing structure
  const topMatches = matches.filter((m: any) => m.eligibilityStatus === "eligible").slice(0, 5)
  const alternativeOptions = matches.filter((m: any) => m.eligibilityStatus === "borderline").slice(0, 3)

  const result = {
    matches,
    generalEligibility: {
      UNAM: checkGeneralEligibility(studentProfile, "UNAM"),
      NUST: checkGeneralEligibility(studentProfile, "NUST"),
      IUM: checkGeneralEligibility(studentProfile, "IUM"),
    },
    recommendations: {
      topMatches,
      alternativeOptions,
      improvementSuggestions: generateImprovementSuggestions(studentProfile, topMatches),
    },
    _debug: {
      djangoMatchCount: matchCount,
      transformedCount: matches.length,
      usedAI: true
    }
  }

  console.log("✅ Final transformed result:", result._debug)
  return result
}


async function matchStudentToPrograms(student: StudentProfile, programs: UniversityProgram[]) { 
  const matches = programs.map((program) => { 
    const { eligible, missingRequirements } = checkProgramRequirements(student, program) 
    const interestAlignment = calculateInterestAlignment(student.interests, program.interestCategories) 
    const pointsRatio = student.totalPoints / program.minPoints 

    let eligibilityStatus: "eligible" | "not-eligible" | "borderline" 
    if (eligible) { 
      eligibilityStatus = "eligible" 
    } else if (missingRequirements.length <= 2 && pointsRatio > 0.8) { 
      eligibilityStatus = "borderline" 
    } else { 
      eligibilityStatus = "not-eligible" 
    } 

    const matchScore = calculateMatchScore(eligibilityStatus, interestAlignment, pointsRatio) 

    return { 
      program, 
      matchScore, 
      eligibilityStatus, 
      missingRequirements, 
      interestAlignment, 
      recommendationReason: generateRecommendationReason( 
        program, 
        eligibilityStatus, 
        interestAlignment, 
        missingRequirements, 
      ), 
    } 
  }) 

  matches.sort((a, b) => b.matchScore - a.matchScore) 

  const topMatches = matches.filter((m) => m.eligibilityStatus === "eligible").slice(0, 5) 
  const alternativeOptions = matches.filter((m) => m.eligibilityStatus === "borderline").slice(0, 3) 

  return { 
    matches, 
    generalEligibility: { 
      UNAM: checkGeneralEligibility(student, "UNAM"), 
      NUST: checkGeneralEligibility(student, "NUST"), 
      IUM: checkGeneralEligibility(student, "IUM"), 
    }, 
    recommendations: { 
      topMatches, 
      alternativeOptions, 
      improvementSuggestions: generateImprovementSuggestions(student, topMatches), 
    }, 
  } 
} 

// Updated parseAdmissionRequirements to handle JSON object format from database
function parseAdmissionRequirements(structured: any): any[] { 
  if (!structured) return [] 

  // If it's an object (from JSONB column, e.g., {"Biology": "NSSCAS >= D", ...})
  if (typeof structured === "object" && !Array.isArray(structured)) { 
    const requirements = [] 
    for (const [subject, req] of Object.entries(structured)) { 
      // Handle different requirement formats
      const reqString = req as string
      
      // Try "NSSCH >= 3" format
      let match = reqString.match(/(\w+)\s*>=\s*(\w+)/)
      if (match) { 
        requirements.push({ 
          subject: subject.trim(), 
          level: match[1].trim(), 
          minGrade: match[2].trim(), 
        }) 
        continue
      }
      
      // Try "NSSCH = 3" format (your current format)
      match = reqString.match(/(\w+)\s*=\s*(\w+)/)
      if (match) { 
        requirements.push({ 
          subject: subject.trim(), 
          level: match[1].trim(), 
          minGrade: match[2].trim(), 
        }) 
        continue
      }
      
      // Try "NSSCH 3" format
      match = reqString.match(/(\w+)\s+(\w+)/)
      if (match) { 
        requirements.push({ 
          subject: subject.trim(), 
          level: match[1].trim(), 
          minGrade: match[2].trim(), 
        }) 
        continue
      }
      
      console.warn(`Invalid requirement format for ${subject}: ${req}`) 
    } 
    return requirements 
  } 

  // If it's already an array
  if (Array.isArray(structured)) { 
    return structured 
  } 

  // If it's a string (fallback for plain text)
  if (typeof structured === "string") { 
    try { 
      // Try parsing as JSON string 
      return parseAdmissionRequirements(JSON.parse(structured))  // Recurse to handle object
    } catch { 
      // Fallback: treat as plain text 
      const requirements: any[] = [] 
      const lines = structured.split("\n").filter((line) => line.trim()) 

      for (const line of lines) { 
        if (line.includes(":")) { 
          const [subject, requirement] = line.split(":").map((s) => s.trim()) 
          const match = requirement.match(/(\w+)\s*>\=\s*(\w+)/)  // Updated regex for ">= "
          if (match) { 
            requirements.push({ 
              subject: subject, 
              level: match[1], 
              minGrade: match[2], 
            }) 
          } 
        } 
      } 

      return requirements 
    } 
  } 

  // Fallback 
  console.warn("Invalid structured_requirements type:", typeof structured) 
  return [] 
} 

function checkProgramRequirements(student: StudentProfile, program: UniversityProgram) {
  const missingRequirements: string[] = []

  if (student.totalPoints < program.minPoints) {
    missingRequirements.push(`Need ${program.minPoints - student.totalPoints} more points`)
  }

  for (const requirement of program.admissionRequirements) {
    // Find student subject with level hierarchy logic
    const studentSubject = student.subjects.find((s) => {
      const subjectMatches = s.subject.toLowerCase() === requirement.subject.toLowerCase()
      const levelQualifies = checkLevelRequirement(s.level, requirement.level)
      return subjectMatches && levelQualifies
    })

    if (!studentSubject) {
      missingRequirements.push(
        `${requirement.subject} at ${requirement.level} level or higher (${requirement.minGrade} or better)`,
      )
      continue
    }

    const isGradeSufficient = checkGradeRequirement(studentSubject.grade, requirement.minGrade, studentSubject.level)
    if (!isGradeSufficient) {
      missingRequirements.push(
        `${requirement.subject}: Need ${requirement.minGrade} or better (you have ${studentSubject.grade})`,
      )
    }
  }

  return {
    eligible: missingRequirements.length === 0,
    missingRequirements,
  }
}

function checkGradeRequirement(studentGrade: string, requiredGrade: string, level: string): boolean { 
  let gradeOrder: string[] 

  switch (level) { 
    case "NSSCO": 
      gradeOrder = ["A*", "A", "B", "C", "D", "E", "F"] 
      break 
    case "IGCSE": 
      gradeOrder = ["A*", "A", "B", "C", "D", "E", "F"] 
      break 
    case "NSSCAS": 
      gradeOrder = ["A", "B", "C", "D", "E"] 
      break 
    case "NSSCH": 
      gradeOrder = ["1", "2", "3", "4"] 
      break 
    case "HIGCSE": 
      gradeOrder = ["1", "2", "3", "4"] 
      break 
    default: 
      return false 
  } 

  const requiredIndex = gradeOrder.indexOf(requiredGrade) 
  const studentIndex = gradeOrder.indexOf(studentGrade) 

  return studentIndex !== -1 && requiredIndex !== -1 && studentIndex <= requiredIndex 
} 

function calculateInterestAlignment(studentInterests: string[], programInterests: string[]): number { 
  if (studentInterests.length === 0 || programInterests.length === 0) return 0 

  const commonInterests = studentInterests.filter((interest) => 
    programInterests.some((progInterest) => progInterest.toLowerCase().includes(interest.toLowerCase())), 
  ) 

  return (commonInterests.length / studentInterests.length) * 100 
} 

function calculateMatchScore(
  eligibilityStatus: "eligible" | "not-eligible" | "borderline",
  interestAlignment: number,
  pointsRatio: number,
): number {
  let baseScore = 0

  switch (eligibilityStatus) {
    case "eligible":
      baseScore = 70
      break
    case "borderline":
      baseScore = 40
      break
    case "not-eligible":
      baseScore = 10
      break
  }

  const interestScore = (interestAlignment / 100) * 25
  const pointsBonus = Math.min(pointsRatio * 5, 5)

  return Math.round(baseScore + interestScore + pointsBonus)
}

function generateRecommendationReason(
  program: UniversityProgram,
  eligibilityStatus: string,
  interestAlignment: number,
  missingRequirements: string[],
): string {
  if (eligibilityStatus === "eligible") {
    if (interestAlignment > 70) {
      return `Excellent match! You meet all requirements and this program strongly aligns with your interests in ${program.interestCategories.join(", ")}.`
    } else if (interestAlignment > 40) {
      return `Good match! You qualify for this program and it partially aligns with your interests.`
    } else {
      return `You meet the requirements for this program, though it may not fully align with your stated interests.`
    }
  } else if (eligibilityStatus === "borderline") {
    return `Close match! You're almost eligible - ${missingRequirements.join(", ")}. Consider this as a stretch goal.`
  } else {
    return `This program requires additional preparation: ${missingRequirements.slice(0, 2).join(", ")}.`
  }
}

function checkGeneralEligibility(student: StudentProfile, institution: "UNAM" | "NUST" | "IUM"): boolean {
  const englishSubject = student.subjects.find((s) => s.subject === "English")
  if (!englishSubject) return false

  const studentPoints = student.totalPoints
  const englishPoints = englishSubject.points

  // Count subjects by level with proper hierarchy understanding
  const nsscoSubjects = student.subjects.filter(s => s.level === "NSSCO")
  const higherLevelSubjects = student.subjects.filter(s => 
    ["NSSCH", "NSSCAS", "HIGCSE"].includes(s.level)
  )

  if (institution === "UNAM") {
    // Count higher level subjects with D or better (6+ points)
    const higherLevelDPlus = higherLevelSubjects.filter(s => s.points >= 6).length
    
    // Count NSSCO subjects with C or better (5+ points)
    const nsscoCPlus = nsscoSubjects.filter(s => s.points >= 5).length
    
    // Count NSSCO subjects with D or better (4+ points)  
    const nsscoDPlus = nsscoSubjects.filter(s => s.points >= 4).length

    // UNAM Degree Requirements
    if (studentPoints >= 25 && englishPoints >= 5) {
      // Option 1: 2 higher level (≥D) + 3 NSSCO (≥C)
      if (higherLevelDPlus >= 2 && nsscoCPlus >= 3) return true
      
      // Option 2: 3 higher level (≥D) + 2 NSSCO (≥D)
      if (higherLevelDPlus >= 3 && nsscoDPlus >= 2) return true
      
      // Option 3: 5 NSSCO subjects (traditional route)
      if (nsscoSubjects.length >= 5 && nsscoCPlus >= 3) return true
    }

    // UNAM Diploma Requirements
    if (studentPoints >= 24 && englishPoints >= 4) {
      return true
    }

    return false
  }

  if (institution === "NUST") {
    return studentPoints >= 25 && englishPoints >= 3
  }

  if (institution === "IUM") {
    return studentPoints >= 25 && englishPoints >= 4
  }

  return false
}

function generateImprovementSuggestions(student: StudentProfile, topMatches: any[]): string[] {
  const suggestions: string[] = []

  if (student.totalPoints < 25) {
    suggestions.push("Consider retaking some subjects to improve your total points")
  }

  if (topMatches.length === 0) {
    suggestions.push("Consider diploma programs as a pathway to degree programs")
  }

  return suggestions
}

function checkLevelRequirement(studentLevel: string, requiredLevel: string): boolean {
  const studentLevelNum = LEVEL_HIERARCHY[studentLevel] || 0
  const requiredLevelNum = LEVEL_HIERARCHY[requiredLevel] || 0
  return studentLevelNum >= requiredLevelNum
}