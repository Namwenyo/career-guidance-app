import { type NextRequest, NextResponse } from "next/server"
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

    // Call Django AI endpoint directly - NO LOCAL DATABASE QUERY NEEDED
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

    // Transform Django response using Django data directly
    const matchingResults = transformDjangoToYourFormat(djangoData, studentProfile)

    return NextResponse.json(matchingResults) 
  } catch (error) { 
    console.error("Matching error:", error) 
    return NextResponse.json({ error: "Failed to match programs" }, { status: 500 }) 
  } 
}

// 🚀 Transform Django AI response to use Django data directly
function transformDjangoToYourFormat(
  djangoData: any, 
  studentProfile: StudentProfile
) {
  console.log("🔄 Transforming Django response...")
  
  const djangoPrograms = djangoData.programs || []
  const matchCount = djangoData.match_count || 0
  
  console.log(`📊 Django found ${matchCount} matching programs`)

  // Create UniversityProgram objects directly from Django data
  const matches = djangoPrograms.map((djangoProgram: any) => {
    // Create program object from Django data
    const program: UniversityProgram = {
      id: `${djangoProgram.institution}-${djangoProgram.program_code}`,
      institution: djangoProgram.institution as "UNAM" | "NUST" | "IUM",
      faculty: djangoProgram.faculty || "",
      department: djangoProgram.department || "",
      programName: djangoProgram.program_name,
      programCode: djangoProgram.program_code,
      duration: djangoProgram.duration,
      minPoints: parseInt(djangoProgram.minimum_points) || 25,
      admissionRequirements: parseAdmissionRequirements(djangoProgram.structured_requirements),
      careerPossibilities: djangoProgram.career_possibilities 
        ? djangoProgram.career_possibilities.split(",").map((s: string) => s.trim()) 
        : [],
      interestCategories: djangoProgram.interest_category 
        ? djangoProgram.interest_category.split(",").map((s: string) => s.trim()) 
        : [],
    }

    console.log(`✅ Created program from Django: ${program.programName}`)

    // Calculate match details
    const { eligible, missingRequirements } = checkProgramRequirements(studentProfile, program)
    const interestAlignment = calculateInterestAlignment(studentProfile.interests, program.interestCategories)
    const pointsRatio = studentProfile.totalPoints / program.minPoints

    let eligibilityStatus: "eligible" | "not-eligible" | "borderline"
    if (eligible) {
      eligibilityStatus = "eligible"
    } else if (missingRequirements.length <= 2 && pointsRatio > 0.8) {
      eligibilityStatus = "borderline"
    } else {
      eligibilityStatus = "not-eligible"
    }

    const matchScore = calculateMatchScore(eligibilityStatus, interestAlignment, pointsRatio)

    console.log(`🎯 Program: ${program.programName}, Score: ${matchScore}`)

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

  // Sort by score (highest first)
  matches.sort((a: any, b: any) => b.matchScore - a.matchScore)

  // Create result structure
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

// Updated parseAdmissionRequirements to handle JSON object format from database
// Enhanced parseAdmissionRequirements to handle complex logic
function parseAdmissionRequirements(structured: any): any[] { 
  if (!structured) return [] 

  console.log("🔍 Parsing requirements:", typeof structured, structured)

  // If it's an object (from JSONB column)
  if (typeof structured === "object" && !Array.isArray(structured)) { 
    const requirements = [] 
    
    for (const [subject, req] of Object.entries(structured)) { 
      // Skip OptionX keys as they represent combinations, not individual subjects
      if (subject.startsWith('Option')) {
        console.log(`📋 Found combination requirement: ${subject} = ${req}`)
        // You could parse these separately if needed for display
        continue
      }
      
      let reqString: string
      
      if (typeof req === 'string') {
        reqString = req
      } else {
        reqString = String(req)
      }
      
      console.log(`🔍 Processing requirement: ${subject} = ${reqString}`)

      // Handle complex "OR" conditions like "NSSCH >= 3 OR NSSCAS >= C"
      if (reqString.includes(' OR ')) {
        const alternatives = reqString.split(' OR ').map(alt => alt.trim())
        
        for (const alternative of alternatives) {
          const parsed = parseSingleRequirement(subject, alternative)
          if (parsed) {
            requirements.push(parsed)
          }
        }
      } else {
        // Single requirement
        const parsed = parseSingleRequirement(subject, reqString)
        if (parsed) {
          requirements.push(parsed)
        }
      }
    } 
    
    return requirements 
  } 

  // Handle other types (array, string) as before...
  if (Array.isArray(structured)) { 
    return structured 
  } 

  if (typeof structured === "string") { 
    try { 
      return parseAdmissionRequirements(JSON.parse(structured))
    } catch { 
      // Fallback for plain text
      return parsePlainTextRequirements(structured)
    } 
  } 

  console.warn("❌ Invalid structured_requirements type:", typeof structured) 
  return [] 
}

// Helper function to parse single requirement patterns
function parseSingleRequirement(subject: string, requirement: string): any {
  // Try "NSSCAS >= C" format
  let match = requirement.match(/(\w+)\s*>=\s*([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(), 
      rawRequirement: requirement // Keep original for reference
    } 
  }
  
  // Try "NSSCH = 3" format
  match = requirement.match(/(\w+)\s*=\s*([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(),
      rawRequirement: requirement
    } 
  }
  
  // Try "NSSCH 3" format
  match = requirement.match(/(\w+)\s+([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(),
      rawRequirement: requirement
    } 
  }
  
  console.warn(`❌ Could not parse requirement: ${subject} - ${requirement}`)
  return null
}

// Helper for plain text requirements (fallback)
function parsePlainTextRequirements(text: string): any[] {
  const requirements: any[] = [] 
  const lines = text.split("\n").filter((line) => line.trim()) 

  for (const line of lines) { 
    if (line.includes(":")) { 
      const [subject, requirement] = line.split(":").map((s) => s.trim()) 
      const parsed = parseSingleRequirement(subject, requirement)
      if (parsed) {
        requirements.push(parsed)
      }
    } 
  } 

  return requirements 
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