"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  GraduationCap,
  ArrowLeft,
  Clock,
  Target,
  Users,
  BookOpen,
  TrendingUp,
  MapPin,
  CheckCircle,
  Building,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { UniversityProgram } from "@/lib/university-data"

export default function ProgramDetailPage() {
  const params = useParams()
  const [program, setProgram] = useState<UniversityProgram | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgram() {
      try {
        const res = await fetch(`/api/programs/${params.id}`)
        if (!res.ok) {
          setProgram(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        
        // The API already returns admissionRequirements in the correct format
        // No need to parse again - just use the data directly
        setProgram(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching program:", error)
        setProgram(null)
        setLoading(false)
      }
    }
    fetchProgram()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading program details...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Program Not Found</h2>
          <p className="text-muted-foreground mb-4">The program you're looking for doesn't exist.</p>
          <Link href="/programs">
            <Button>Browse All Programs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getUniversityInfo = (institution: string) => {
    switch (institution) {
      case "UNAM":
        return {
          fullName: "University of Namibia",
          description:
            "The University of Namibia is the largest and oldest university in Namibia, offering comprehensive programs across multiple faculties.",
          website: "https://www.unam.edu.na",
          location: "Windhoek, Namibia",
        }
      case "NUST":
        return {
          fullName: "Namibia University of Science and Technology",
          description:
            "NUST is a leading institution focused on science, technology, engineering, and applied sciences in Namibia.",
          website: "https://www.nust.na",
          location: "Windhoek, Namibia",
        }
      case "IUM":
        return {
          fullName: "International University of Management",
          description:
            "IUM is a private university specializing in management, business, and professional development programs.",
          website: "https://www.ium.edu.na",
          location: "Windhoek, Namibia",
        }
      default:
        return {
          fullName: institution,
          description: "",
          website: "",
          location: "Namibia",
        }
    }
  }

  const universityInfo = getUniversityInfo(program.institution)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/programs" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CareerPath AI</h1>
          </Link>
          <div className="text-sm text-muted-foreground">Program Details</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Program Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">{program.programName}</h2>
              <p className="text-lg text-muted-foreground">{program.faculty}</p>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {program.programCode}
            </Badge>
          </div>

          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <span className="font-medium">{universityInfo.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{universityInfo.location}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{program.duration}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{program.minPoints}</p>
                  <p className="text-sm text-muted-foreground">Points Required</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {program.admissionRequirements ? program.admissionRequirements.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Requirements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Admission Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Admission Requirements
                </CardTitle>
                <CardDescription>You must meet these requirements to be eligible for this program</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {program.admissionRequirements && program.admissionRequirements.length > 0 ? (
                  program.admissionRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {req.subject} ({req.level})
                        </p>
                        <p className="text-sm text-muted-foreground">Minimum grade: {req.minGrade}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specific requirements listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Career Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Career Opportunities
                </CardTitle>
                <CardDescription>Potential career paths after completing this program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {program.careerPossibilities.map((career, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="font-medium">{career}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interest Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Interest Areas
                </CardTitle>
                <CardDescription>This program aligns with these interest categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {program.interestCategories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* University Information */}
            <Card>
              <CardHeader>
                <CardTitle>{program.institution}</CardTitle>
                <CardDescription>{universityInfo.fullName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{universityInfo.description}</p>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{universityInfo.location}</span>
                  </div>
                  {universityInfo.website && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={universityInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/assessment" className="block">
                <Button className="w-full" size="lg">
                  Check My Eligibility
                </Button>
              </Link>
              <Link href="/programs" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Browse More Programs
                </Button>
              </Link>
            </div>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Ensure you meet all admission requirements before applying</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Consider your career goals when choosing this program</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Use our assessment tool to get personalized recommendations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}