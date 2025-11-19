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

    console.log(" Calling Django AI matching...")
    
    // Prepare data in the format Django expects
    const requestData = {
      subjects: studentProfile.subjects.map(subject => ({
        name: subject.subject,
        level: subject.level,
        grade: subject.grade || "" // Handle missing grades
      })),
      interests: studentProfile.interests || []
    }

    console.log("Sending to Django:", JSON.stringify(requestData, null, 2))

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

// Transform Django AI response to use Django data directly
function transformDjangoToYourFormat(
  djangoData: any, 
  studentProfile: StudentProfile
) {
  console.log(" Transforming Django response...")
  
  const eligiblePrograms = djangoData.eligible_programs || []
  const alternativePrograms = djangoData.alternative_programs || []
  const eligibleCount = djangoData.eligible_count || 0
  const alternativeCount = djangoData.alternative_count || 0
  
  console.log(` Django found ${eligibleCount} eligible and ${alternativeCount} alternative programs`)

  // Transform eligible programs
  const topMatches = eligiblePrograms.map((djangoProgram: any) => {
    return createProgramMatch(djangoProgram, studentProfile, "eligible")
  })

  // Transform alternative programs
  const alternativeOptions = alternativePrograms.map((djangoProgram: any) => {
    return createProgramMatch(djangoProgram, studentProfile, "not-eligible")
  })

  // Combine all programs for "all programs" tab
  const allMatches = [...topMatches, ...alternativeOptions]

  // Sort by match score
  topMatches.sort((a: any, b: any) => b.matchScore - a.matchScore)
  alternativeOptions.sort((a: any, b: any) => b.matchScore - a.matchScore)
  allMatches.sort((a: any, b: any) => b.matchScore - a.matchScore)

  const result = {
    matches: allMatches,
    generalEligibility: {
      UNAM: checkGeneralEligibility(studentProfile, "UNAM"),
      NUST: checkGeneralEligibility(studentProfile, "NUST"),
      IUM: checkGeneralEligibility(studentProfile, "IUM"),
    },
    recommendations: {
      topMatches: topMatches.slice(0, 5),
      alternativeOptions: alternativeOptions.slice(0, 3),
      improvementSuggestions: generateImprovementSuggestions(studentProfile, topMatches, alternativeOptions),
    },
    _debug: {
      djangoEligibleCount: eligibleCount,
      djangoAlternativeCount: alternativeCount,
      usedAI: true,
      requirementChecked: true
    }
  }

  console.log(" Final transformed result:", result._debug)
  return result
}

// Helper function to create program match objects
function createProgramMatch(djangoProgram: any, studentProfile: StudentProfile, eligibility: "eligible" | "not-eligible") {
  const programData = djangoProgram.program_object || djangoProgram // Fallback to direct data
  
  const program: UniversityProgram = {
    id: programData.id?.toString() || `${programData.institution}-${programData.program_code}`,
    institution: programData.institution as "UNAM" | "NUST" | "IUM",
    faculty: programData.faculty || "",
    department: programData.department || "",
    programName: programData.program_name,
    programCode: programData.program_code || "",
    duration: programData.duration || "",
    minPoints: parseInt(programData.minimum_points) || 25,
    admissionRequirements: parseAdmissionRequirements(programData.structured_requirements),
    careerPossibilities: programData.career_possibilities 
      ? programData.career_possibilities.split(",").map((s: string) => s.trim()) 
      : [],
    interestCategories: programData.interest_category 
      ? programData.interest_category.split(",").map((s: string) => s.trim()) 
      : [],
  }

  // Convert similarity score to percentage
  const matchScore = Math.min(Math.round((djangoProgram.similarity_score || 0) * 100), 100)
  
  // Calculate interest alignment for display
  const interestAlignment = calculateInterestAlignment(studentProfile.interests, program.interestCategories)

  // Use Django's missing requirements for alternative programs
  const missingRequirements = eligibility === "not-eligible" ? (djangoProgram.missing_requirements || []) : []

  return {
    program,
    matchScore,
    eligibilityStatus: eligibility,
    missingRequirements,
    interestAlignment,
    recommendationReason: generateRecommendationReason(program, eligibility, interestAlignment, missingRequirements),
    _djangoData: { // Keep for debugging
      similarity: djangoProgram.similarity_score,
      eligibilityMessage: djangoProgram.eligibility_message,
      missingRequirements: djangoProgram.missing_requirements
    }
  }
}

//helper functions for parsing requirements (for display purposes only)
function parseAdmissionRequirements(structured: any): any[] { 
  if (!structured) return [] 

  console.log(" Parsing requirements:", typeof structured, structured)

  if (typeof structured === "object" && !Array.isArray(structured)) { 
    const requirements = [] 
    
    for (const [subject, req] of Object.entries(structured)) { 
      if (subject.startsWith('Option')) {
        console.log(` Found combination requirement: ${subject} = ${req}`)
        continue
      }
      
      let reqString: string
      
      if (typeof req === 'string') {
        reqString = req
      } else {
        reqString = String(req)
      }
      
      console.log(` Processing requirement: ${subject} = ${reqString}`)

      if (reqString.includes(' OR ')) {
        const alternatives = reqString.split(' OR ').map(alt => alt.trim())
        
        for (const alternative of alternatives) {
          const parsed = parseSingleRequirement(subject, alternative)
          if (parsed) {
            requirements.push(parsed)
          }
        }
      } else {
        const parsed = parseSingleRequirement(subject, reqString)
        if (parsed) {
          requirements.push(parsed)
        }
      }
    } 
    
    return requirements 
  } 

  if (Array.isArray(structured)) { 
    return structured 
  } 

  if (typeof structured === "string") { 
    try { 
      return parseAdmissionRequirements(JSON.parse(structured))
    } catch { 
      return parsePlainTextRequirements(structured)
    } 
  } 

  console.warn(" Invalid structured_requirements type:", typeof structured) 
  return [] 
}

function parseSingleRequirement(subject: string, requirement: string): any {
  let match = requirement.match(/(\w+)\s*>=\s*([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(), 
      rawRequirement: requirement
    } 
  }
  
  match = requirement.match(/(\w+)\s*=\s*([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(),
      rawRequirement: requirement
    } 
  }
  
  match = requirement.match(/(\w+)\s+([A-Z0-9*]+)/i)
  if (match) { 
    return { 
      subject: subject.trim(), 
      level: match[1].trim(), 
      minGrade: match[2].trim(),
      rawRequirement: requirement
    } 
  }
  
  console.warn(` Could not parse requirement: ${subject} - ${requirement}`)
  return null
}

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

// Keeping this interest alignment calculation for display
function calculateInterestAlignment(studentInterests: string[], programInterests: string[]): number { 
  if (studentInterests.length === 0 || programInterests.length === 0) return 0 

  const commonInterests = studentInterests.filter((interest) => 
    programInterests.some((progInterest) => progInterest.toLowerCase().includes(interest.toLowerCase())), 
  ) 

  return (commonInterests.length / studentInterests.length) * 100 
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
  } else {
    if (missingRequirements.length > 0) {
      return `This program aligns with your interests but requires: ${missingRequirements.slice(0, 2).join(", ")}. Consider improving these areas.`
    } else {
      return `This program aligns with your interests but requires additional preparation.`
    }
  }
}

// Keeping this general eligibility check (for institution-level overview)
function checkGeneralEligibility(student: StudentProfile, institution: "UNAM" | "NUST" | "IUM"): boolean {
  const englishSubject = student.subjects.find((s) => s.subject === "English")
  if (!englishSubject) return false

  const studentPoints = student.totalPoints
  const englishPoints = englishSubject.points

  const nsscoSubjects = student.subjects.filter(s => s.level === "NSSCO")
  const higherLevelSubjects = student.subjects.filter(s => 
    ["NSSCH", "NSSCAS", "HIGCSE"].includes(s.level)
  )

  if (institution === "UNAM") {
    const higherLevelDPlus = higherLevelSubjects.filter(s => s.points >= 6).length
    const nsscoCPlus = nsscoSubjects.filter(s => s.points >= 5).length
    const nsscoDPlus = nsscoSubjects.filter(s => s.points >= 4).length

    if (studentPoints >= 25 && englishPoints >= 5) {
      if (higherLevelDPlus >= 2 && nsscoCPlus >= 3) return true
      if (higherLevelDPlus >= 3 && nsscoDPlus >= 2) return true
      if (nsscoSubjects.length >= 5 && nsscoCPlus >= 3) return true
    }

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

function generateImprovementSuggestions(student: StudentProfile, topMatches: any[], alternativeOptions: any[]): string[] {
  const suggestions: string[] = []

  if (student.totalPoints < 25) {
    suggestions.push("Consider retaking some subjects to improve your total points - this would open up more program options")
  }

  if (topMatches.length === 0 && alternativeOptions.length > 0) {
    suggestions.push("Focus on meeting the specific subject requirements for your interested alternative programs")
  } else if (topMatches.length < 3) {
    suggestions.push("Improving your grades in key subjects could qualify you for more of your preferred programs")
  }

  // Add specific suggestions based on common missing requirements from alternatives
  if (alternativeOptions.length > 0) {
    const allMissingReqs = alternativeOptions.flatMap((alt: any) => alt.missingRequirements || [])
    
    // Check for common missing requirements
    const hasMathReq = allMissingReqs.some((req: string) => req.toLowerCase().includes('mathematics'))
    const hasEnglishReq = allMissingReqs.some((req: string) => req.toLowerCase().includes('english'))
    const hasScienceReq = allMissingReqs.some((req: string) => req.toLowerCase().includes('science'))
    
    if (hasMathReq) suggestions.push("Improve your Mathematics grade to access more programs")
    if (hasEnglishReq) suggestions.push("Meet the English language requirements for your preferred programs")
    if (hasScienceReq) suggestions.push("Consider improving your Science subjects for STEM programs")
  }

  // Add suggestions based on student interests
  const hasMath = student.subjects.some(s => s.subject === "Mathematics")
  const hasEnglish = student.subjects.some(s => s.subject === "English")
  const hasScience = student.subjects.some(s => s.subject.includes("Science"))
  
  if (!hasMath && student.interests.some(i => i.toLowerCase().includes('engineering'))) {
    suggestions.push("Mathematics is essential for engineering programs - consider taking it")
  }
  if (!hasScience && student.interests.some(i => i.toLowerCase().includes('science'))) {
    suggestions.push("Science subjects would help you access programs in your areas of interest")
  }

  return suggestions.slice(0, 3) // Return top 3 suggestions
}