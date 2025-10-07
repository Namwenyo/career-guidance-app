export interface AdmissionRequirement {
  subject: string
  level: "NSSCO" | "NSSCAS" | "NSSCH" | "HIGCSE" | "IGCSE"
  minGrade: string
  points?: number
}

export interface UniversityProgram {
  id: string
  institution: "UNAM" | "NUST" | "IUM"
  faculty: string
  programName: string
  programCode: string
  duration: string
  minPoints: number
  admissionRequirements: AdmissionRequirement[]
  careerPossibilities: string[]
  interestCategories: string[]
  description?: string
}

export interface GeneralRequirements {
  institution: "UNAM" | "NUST" | "IUM"
  degreeRequirements: {
    minPoints: number
    englishRequirement: string
    alternativeOptions: string[]
  }
  diplomaRequirements?: {
    minPoints: number
    englishRequirement: string
  }
}

export interface StudentProfile {
  name: string
  subjects: {
    subject: string
    level: "NSSCO" | "NSSCAS" | "NSSCH" | "HIGCSE" | "IGCSE"
    grade: string
    points: number
  }[]
  totalPoints: number
  interests: string[]
  preferredUniversities: ("UNAM" | "NUST" | "IUM")[]
  careerGoals?: string[]
}

// Grade to points conversion
export const gradeToPoints: Record<"NSSCO" | "NSSCAS" | "NSSCH" | "HIGCSE" | "IGCSE", Record<string, number>> = {
  NSSCO: {
    "A*": 8,
    A: 7,
    B: 6,
    C: 5,
    D: 4,
    E: 3,
    F: 2,
  },
  NSSCAS: {
    A: 9,
    B: 8,
    C: 7,
    D: 6,
    E: 5,
  },
  NSSCH: {
    "1": 9,
    "2": 8,
    "3": 7,
    "4": 6,
  },
  HIGCSE: {
    "1": 9,
    "2": 8,
    "3": 7,
    "4": 6,
  },
  IGCSE: {
    "A*": 8,
    A: 7,
    B: 6,
    C: 5,
    D: 4,
    E: 3,
    F: 2,
  },
}

// General admission requirements for each university
export const generalRequirements: GeneralRequirements[] = [
  {
    institution: "UNAM",
    degreeRequirements: {
      minPoints: 25,
      englishRequirement: "NSSCO C or better",
      alternativeOptions: [
        "2 subjects NSSCH grade 4+, 3 subjects NSSCO C+, English C",
        "3 subjects NSSCH grade 4+, 2 subjects NSSCO D+, English C",
      ],
    },
    diplomaRequirements: {
      minPoints: 24,
      englishRequirement: "NSSCO D or better",
    },
  },
  {
    institution: "NUST",
    degreeRequirements: {
      minPoints: 25,
      englishRequirement: "NSSCO E or better",
      alternativeOptions: [],
    },
  },
  {
    institution: "IUM",
    degreeRequirements: {
      minPoints: 25,
      englishRequirement: "NSSCO D or better",
      alternativeOptions: [],
    },
  },
]

// Interest categories for matching
export const interestCategories = [
  "Technology & Computing",
  "Health & Medicine",
  "Engineering & Construction",
  "Business & Finance",
  "Science & Research",
  "Arts & Communication",
  "Education & Social Work",
  "Agriculture & Environment",
  "Law & Justice",
  "Tourism & Hospitality",
  "Mathematics & Statistics",
  "Military & Security",
]

// Education level hierarchy for determining qualification levels
export const EDUCATION_LEVEL_HIERARCHY = {
  NSSCAS: 3,
  NSSCH: 2,
  HIGCSE: 2,
  NSSCO: 1,
  IGCSE: 1,
}
