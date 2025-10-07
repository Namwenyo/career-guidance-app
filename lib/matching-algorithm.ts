import type { StudentProfile, UniversityProgram } from "./university-data"
import { generalRequirements } from "./university-data"

export interface ProgramMatch {
  program: UniversityProgram
  matchScore: number
  eligibilityStatus: "eligible" | "not-eligible" | "borderline"
  missingRequirements: string[]
  interestAlignment: number
  recommendationReason: string
}

export interface MatchingResults {
  matches: ProgramMatch[]
  generalEligibility: {
    UNAM: boolean
    NUST: boolean
    IUM: boolean
  }
  recommendations: {
    topMatches: ProgramMatch[]
    alternativeOptions: ProgramMatch[]
    improvementSuggestions: string[]
  }
}

// Check if student meets general admission requirements for a university
function checkGeneralEligibility(student: StudentProfile, institution: "UNAM" | "NUST" | "IUM"): boolean {
  const requirements = generalRequirements.find((req) => req.institution === institution)
  if (!requirements) return false

  const { totalPoints } = student
  const englishSubject = student.subjects.find((s) => s.subject === "English")

  // Check minimum points
  if (totalPoints < requirements.degreeRequirements.minPoints) return false

  // Check English requirement
  if (!englishSubject) return false

  const englishGrade = englishSubject.grade
  const englishLevel = englishSubject.level

  // Parse English requirement (e.g., "NSSCO C or better")
  const englishReq = requirements.degreeRequirements.englishRequirement
  if (englishReq.includes("NSSCO C") && englishLevel === "NSSCO") {
    const gradeOrder = ["A*", "A", "B", "C", "D", "E", "F"]
    const requiredIndex = gradeOrder.indexOf("C")
    const studentIndex = gradeOrder.indexOf(englishGrade)
    return studentIndex <= requiredIndex
  }

  if (englishReq.includes("NSSCO D") && englishLevel === "NSSCO") {
    const gradeOrder = ["A*", "A", "B", "C", "D", "E", "F"]
    const requiredIndex = gradeOrder.indexOf("D")
    const studentIndex = gradeOrder.indexOf(englishGrade)
    return studentIndex <= requiredIndex
  }

  if (englishReq.includes("NSSCO E") && englishLevel === "NSSCO") {
    const gradeOrder = ["A*", "A", "B", "C", "D", "E", "F"]
    const requiredIndex = gradeOrder.indexOf("E")
    const studentIndex = gradeOrder.indexOf(englishGrade)
    return studentIndex <= requiredIndex
  }

  return true
}

// Check if student meets specific program requirements
function checkProgramRequirements(
  student: StudentProfile,
  program: UniversityProgram,
): {
  eligible: boolean
  missingRequirements: string[]
} {
  const missingRequirements: string[] = []

  // Check minimum points
  if (student.totalPoints < program.minPoints) {
    missingRequirements.push(`Need ${program.minPoints - student.totalPoints} more points`)
  }

  // Check specific subject requirements
  for (const requirement of program.admissionRequirements) {
    const studentSubject = student.subjects.find(
      (s) => s.subject === requirement.subject && s.level === requirement.level,
    )

    if (!studentSubject) {
      missingRequirements.push(
        `${requirement.subject} at ${requirement.level} level (${requirement.minGrade} or better)`,
      )
      continue
    }

    // Check grade requirement
    const isGradeSufficient = checkGradeRequirement(studentSubject.grade, requirement.minGrade, requirement.level)
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

// Check if a grade meets the minimum requirement
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

// Calculate interest alignment score
function calculateInterestAlignment(studentInterests: string[], programInterests: string[]): number {
  if (studentInterests.length === 0 || programInterests.length === 0) return 0

  const commonInterests = studentInterests.filter((interest) =>
    programInterests.some((progInterest) => progInterest.toLowerCase().includes(interest.toLowerCase())),
  )

  return (commonInterests.length / studentInterests.length) * 100
}

// Calculate overall match score
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

  // Add interest alignment (0-25 points)
  const interestScore = (interestAlignment / 100) * 25

  // Add points ratio bonus (0-5 points)
  const pointsBonus = Math.min(pointsRatio * 5, 5)

  return Math.round(baseScore + interestScore + pointsBonus)
}

// Generate recommendation reason
function generateRecommendationReason(match: ProgramMatch): string {
  const { program, eligibilityStatus, interestAlignment, missingRequirements } = match

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

export function matchStudentToPrograms(student: StudentProfile, programs: UniversityProgram[]): MatchingResults {
  // Check general eligibility for each university
  const generalEligibility = {
    UNAM: checkGeneralEligibility(student, "UNAM"),
    NUST: checkGeneralEligibility(student, "NUST"),
    IUM: checkGeneralEligibility(student, "IUM"),
  }

  // Filter programs based on student preferences
  const relevantPrograms = programs.filter((program) => student.preferredUniversities.includes(program.institution))

  // Calculate matches for each program
  const matches: ProgramMatch[] = relevantPrograms.map((program) => {
    const { eligible, missingRequirements } = checkProgramRequirements(student, program)
    const interestAlignment = calculateInterestAlignment(student.interests, program.interestCategories)
    const pointsRatio = student.totalPoints / program.minPoints

    let eligibilityStatus: "eligible" | "not-eligible" | "borderline"
    if (eligible && generalEligibility[program.institution]) {
      eligibilityStatus = "eligible"
    } else if (missingRequirements.length <= 2 && pointsRatio > 0.8) {
      eligibilityStatus = "borderline"
    } else {
      eligibilityStatus = "not-eligible"
    }

    const matchScore = calculateMatchScore(eligibilityStatus, interestAlignment, pointsRatio)

    const match: ProgramMatch = {
      program,
      matchScore,
      eligibilityStatus,
      missingRequirements,
      interestAlignment,
      recommendationReason: "",
    }

    match.recommendationReason = generateRecommendationReason(match)

    return match
  })

  // Sort matches by score
  matches.sort((a, b) => b.matchScore - a.matchScore)

  // Generate recommendations
  const topMatches = matches.filter((m) => m.eligibilityStatus === "eligible").slice(0, 5)
  const alternativeOptions = matches.filter((m) => m.eligibilityStatus === "borderline").slice(0, 3)

  // Generate improvement suggestions
  const improvementSuggestions: string[] = []
  if (student.totalPoints < 25) {
    improvementSuggestions.push("Consider retaking some subjects to improve your total points")
  }
  if (!generalEligibility.UNAM && !generalEligibility.NUST && !generalEligibility.IUM) {
    improvementSuggestions.push("Focus on improving your English grade to meet general admission requirements")
  }
  if (topMatches.length === 0) {
    improvementSuggestions.push("Consider diploma programs as a pathway to degree programs")
  }

  return {
    matches,
    generalEligibility,
    recommendations: {
      topMatches,
      alternativeOptions,
      improvementSuggestions,
    },
  }
}

export function getProgramById(programs: UniversityProgram[], id: string): UniversityProgram | undefined {
  return programs.find((program) => program.id === id)
}

export function filterPrograms(
  programs: UniversityProgram[],
  criteria: {
    institution?: "UNAM" | "NUST" | "IUM"
    faculty?: string
    interestCategory?: string
    minPoints?: number
    maxPoints?: number
  },
): UniversityProgram[] {
  return programs.filter((program) => {
    if (criteria.institution && program.institution !== criteria.institution) return false
    if (criteria.faculty && program.faculty !== criteria.faculty) return false
    if (criteria.interestCategory && !program.interestCategories.includes(criteria.interestCategory)) return false
    if (criteria.minPoints && program.minPoints < criteria.minPoints) return false
    if (criteria.maxPoints && program.minPoints > criteria.maxPoints) return false
    return true
  })
}
