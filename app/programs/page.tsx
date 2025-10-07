"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, ArrowLeft, Search, Filter, Clock, Target, Users } from "lucide-react"
import Link from "next/link"
import type { UniversityProgram } from "@/lib/university-data"

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [programs, setPrograms] = useState<UniversityProgram[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [programsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/programs"),
          fetch("/api/interests"),
        ])

        if (!programsResponse.ok || !categoriesResponse.ok) {
          throw new Error("Failed to fetch data")
        }

        const programsData = await programsResponse.json()
        const categoriesData = await categoriesResponse.json()

        setPrograms(programsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredPrograms = programs
    .filter((program) => {
      const matchesSearch =
        program.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.careerPossibilities.some((career) => career.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesInstitution = selectedInstitution === "all" || program.institution === selectedInstitution

      const matchesCategory =
        selectedCategory === "all" ||
        program.interestCategories.some((cat) => cat.toLowerCase().includes(selectedCategory.toLowerCase()))

      return matchesSearch && matchesInstitution && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.programName.localeCompare(b.programName)
        case "points":
          return a.minPoints - b.minPoints
        case "duration":
          return a.duration.localeCompare(b.duration)
        case "institution":
          return a.institution.localeCompare(b.institution)
        default:
          return 0
      }
    })

  const institutions = ["UNAM", "NUST", "IUM"]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Career Namibia</h1>
          </Link>
          <div className="text-sm text-muted-foreground">Browse Programs</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">University Programs</h2>
          <p className="text-lg text-muted-foreground">
            Explore all available programs from UNAM, NUST, and IUM. Use the filters to find programs that match your
            interests.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">University</label>
                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {institutions.map((institution) => (
                      <SelectItem key={institution} value={institution}>
                        {institution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Program Name</SelectItem>
                    <SelectItem value="points">Points Required</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="institution">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredPrograms.length} of {programs.length} programs
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-balance">{program.programName}</CardTitle>
                    <CardDescription className="mt-1 text-base">
                      {program.institution} • {program.faculty}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {program.programCode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {program.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {program.minPoints} points required
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {program.admissionRequirements.length} requirements
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Career Opportunities:</p>
                  <div className="flex flex-wrap gap-1">
                    {program.careerPossibilities.map((career, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {career}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Interest Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {program.interestCategories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Key Requirements:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {program.admissionRequirements.slice(0, 4).map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {req.subject} ({req.level}): {req.minGrade}+
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/programs/${program.id}`} className="flex-1">
                    <Button className="w-full">View Details</Button>
                  </Link>
                  <Link href="/assessment">
                    <Button variant="outline" className="bg-transparent">
                      Check Eligibility
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search criteria or filters.</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedInstitution("all")
                setSelectedCategory("all")
              }}
              variant="outline"
              className="bg-transparent"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Ready to find your perfect match?</h3>
              <p className="text-muted-foreground mb-4">
                Take our AI-powered assessment to get personalized program recommendations based on your academic
                performance and interests.
              </p>
              <Link href="/assessment">
                <Button size="lg">Start Your Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
