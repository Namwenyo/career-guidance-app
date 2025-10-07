"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Clock,
  TrendingUp,
  BookOpen,
  Users,
  Target,
  Sparkles,
  Brain,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { StudentProfile } from "@/lib/university-data"
import type { MatchingResults, ProgramMatch } from "@/lib/matching-algorithm"

interface AIRecommendations {
  personalizedMessage: string
  fullAnalysis: string
  topRecommendations: Array<{
    program: string
    university: string
    matchScore: number
    reasoning: string
    careerProspects: string[]
    strengthsAlignment: string[]
  }>
  improvementSuggestions: Array<{
    area: string
    suggestion: string
    impact: string
  }>
  careerInsights: {
    marketTrends: string[]
    skillsInDemand: string[]
    futureOutlook: string
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [matchingResults, setMatchingResults] = useState<MatchingResults | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    // Get student profile from localStorage
    const profileData = localStorage.getItem("studentProfile")
    if (!profileData) {
      router.push("/assessment")
      return
    }

    try {
      const profile: StudentProfile = JSON.parse(profileData)
      setStudentProfile(profile)

      fetchMatchingResults(profile)
    } catch (error) {
      console.error("Error processing student profile:", error)
      router.push("/assessment")
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchMatchingResults = async (profile: StudentProfile) => {
    try {
      const response = await fetch("/api/match-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch matching results")
      }

      const results = await response.json()
      setMatchingResults(results)
      generateAIRecommendations(profile, results)
    } catch (error) {
      console.error("Error fetching matching results:", error)
      router.push("/assessment")
    }
  }

  const generateAIRecommendations = async (profile: StudentProfile, matches: MatchingResults) => {
    setAiLoading(true)
    try {
      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentProfile: {
            academicResults: profile.subjects,
            totalPoints: profile.totalPoints,
            interests: profile.interests,
            preferredUniversities: profile.preferredUniversities,
          },
          matches: matches.recommendations,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAiRecommendations(result.data)
      } else {
        console.error("AI recommendations failed:", result.error)
      }
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Analyzing your profile and matching programs...</p>
        </div>
      </div>
    )
  }

  if (!studentProfile || !matchingResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-4">Unable to load your results.</p>
          <Link href="/assessment">
            <Button>Retake Assessment</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getEligibilityIcon = (status: "eligible" | "not-eligible" | "borderline") => {
    switch (status) {
      case "eligible":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "borderline":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "not-eligible":
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getEligibilityColor = (status: "eligible" | "not-eligible" | "borderline") => {
    switch (status) {
      case "eligible":
        return "bg-green-100 text-green-800 border-green-200"
      case "borderline":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "not-eligible":
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const ProgramCard = ({ match }: { match: ProgramMatch }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-balance">{match.program.programName}</CardTitle>
            <CardDescription className="mt-1">
              {match.program.institution} • {match.program.faculty}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getEligibilityIcon(match.eligibilityStatus)}
            <Badge variant="secondary" className="text-sm">
              {match.matchScore}% match
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {match.program.duration}
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {match.program.minPoints} points required
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Interest Alignment</span>
            <span>{Math.round(match.interestAlignment)}%</span>
          </div>
          <Progress value={match.interestAlignment} className="h-2" />
        </div>

        <div className={`p-3 rounded-lg border ${getEligibilityColor(match.eligibilityStatus)}`}>
          <p className="text-sm font-medium mb-1">
            {match.eligibilityStatus === "eligible" && "✓ Eligible"}
            {match.eligibilityStatus === "borderline" && "⚠ Borderline"}
            {match.eligibilityStatus === "not-eligible" && "✗ Not Eligible"}
          </p>
          <p className="text-sm">{match.recommendationReason}</p>
        </div>

        {match.missingRequirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Missing Requirements:</p>
            <ul className="text-sm space-y-1">
              {match.missingRequirements.slice(0, 3).map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Career Opportunities:</p>
          <div className="flex flex-wrap gap-1">
            {match.program.careerPossibilities.slice(0, 3).map((career, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {career}
              </Badge>
            ))}
          </div>
        </div>

        <Link href={`/programs/${match.program.id}`}>
          <Button variant="outline" className="w-full bg-transparent">
            View Program Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/assessment" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Career Namibia</h1>
          </Link>
          <div className="text-sm text-muted-foreground">Your Results</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          {aiRecommendations ? (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    AI-Powered Insights
                  </Badge>
                </div>
                <CardTitle className="text-2xl">Personalized Career Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {aiRecommendations.fullAnalysis || aiRecommendations.personalizedMessage}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Hello {studentProfile.name}! Here are your personalized recommendations.
              </h2>
              <p className="text-lg text-muted-foreground">
                Based on your {studentProfile.totalPoints} points and interests in{" "}
                {studentProfile.interests.slice(0, 5).join(", ")}, we've found the best programs for you.
              </p>
            </div>
          )}
        </div>

        {aiRecommendations && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Career Market Insights
              </CardTitle>
              <CardDescription>Current trends and future outlook for your career interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Market Trends</h4>
                <div className="flex flex-wrap gap-2">
                  {aiRecommendations.careerInsights.marketTrends.map((trend, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">In-Demand Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {aiRecommendations.careerInsights.skillsInDemand.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Future Outlook</h4>
                <p className="text-sm text-muted-foreground">{aiRecommendations.careerInsights.futureOutlook}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* University Eligibility Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              University Eligibility Overview
            </CardTitle>
            <CardDescription>Your eligibility status for general admission at each university</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(matchingResults.generalEligibility).map(([university, eligible]) => (
                <div
                  key={university}
                  className={`p-4 rounded-lg border ${
                    eligible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {eligible ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h3 className="font-semibold">{university}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {eligible ? "You meet general admission requirements" : "General requirements not met"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Results */}
        <Tabs defaultValue="top-matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="top-matches" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Top Matches ({matchingResults.recommendations.topMatches.length})
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Alternatives ({matchingResults.recommendations.alternativeOptions.length})
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="all-programs" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Programs ({matchingResults.matches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-matches" className="space-y-6">
            {matchingResults.recommendations.topMatches.length > 0 ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Great news! You're eligible for {matchingResults.recommendations.topMatches.length} programs that
                    match your interests and qualifications.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-6">
                  {matchingResults.recommendations.topMatches.map((match, index) => (
                    <ProgramCard key={match.program.id} match={match} />
                  ))}
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No programs match your current qualifications perfectly. Check the alternatives tab for programs you
                  might be able to qualify for with some improvement.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="alternatives" className="space-y-6">
            {matchingResults.recommendations.alternativeOptions.length > 0 ? (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These programs are within reach with some additional preparation or improvement in specific areas.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-6">
                  {matchingResults.recommendations.alternativeOptions.map((match, index) => (
                    <ProgramCard key={match.program.id} match={match} />
                  ))}
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No alternative programs found. Consider exploring diploma programs or improving your grades to access
                  more options.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            {aiLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Generating AI-powered insights...
                </div>
              </div>
            ) : aiRecommendations ? (
              <div className="space-y-6">
                {/* AI Top Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Recommended Programs
                    </CardTitle>
                    <CardDescription>Programs specifically recommended based on your profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiRecommendations.topRecommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{rec.program}</h4>
                            <p className="text-sm text-muted-foreground">{rec.university}</p>
                          </div>
                          <Badge variant="secondary">{rec.matchScore}% AI Match</Badge>
                        </div>
                        <p className="text-sm mb-3">{rec.reasoning}</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Career Prospects:</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.careerProspects.map((career, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {career}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Strengths Alignment:</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.strengthsAlignment.map((strength, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Improvement Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI Improvement Recommendations
                    </CardTitle>
                    <CardDescription>Personalized suggestions to enhance your academic profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiRecommendations.improvementSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-1">{suggestion.area}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{suggestion.suggestion}</p>
                          <p className="text-xs text-primary font-medium">Impact: {suggestion.impact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  AI insights are currently unavailable. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="all-programs" className="space-y-6">
            <div className="grid gap-6">
              {matchingResults.matches.map((match, index) => (
                <ProgramCard key={match.program.id} match={match} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Improvement Suggestions */}
        {matchingResults.recommendations.improvementSuggestions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Improvement Suggestions
              </CardTitle>
              <CardDescription>Ways to strengthen your application and access more programs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {matchingResults.recommendations.improvementSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link href="/assessment">
            <Button variant="outline" className="bg-transparent">
              Retake Assessment
            </Button>
          </Link>
          <Link href="/programs">
            <Button>Browse All Programs</Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()} className="bg-transparent">
            Save Results
          </Button>
        </div>
      </div>
    </div>
  )
}
