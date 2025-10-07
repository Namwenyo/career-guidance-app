"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, GraduationCap, Plus, Trash2, Upload, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { gradeToPoints, type StudentProfile } from "@/lib/university-data"
import { InterestSearch } from "@/components/interest-search"

const subjects = [
"English","Oshindonga","Oshikwanyama","Mathematics","Biology","Chemistry",
"Physical Science","Geography","History","Development Studies","Computer Science",
"Agriculture","Accounting","Economics","Business Studies"
]

const levels = ["NSSCO", "NSSCAS", "NSSCH", "HIGCSE", "IGCSE"]
const nsscoGrades = ["A*", "A", "B", "C", "D", "E", "F"]
const nsscasGrades = ["A", "B", "C", "D", "E"]
const nsschGrades = ["1", "2", "3", "4"]
const higcseGrades = ["1", "2", "3", "4"]
const igcseGrades = ["A*", "A", "B", "C", "D", "E", "F"]

export default function AssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [studentProfile, setStudentProfile] = useState<Partial<StudentProfile>>({
    subjects: [],
    interests: [],
    preferredUniversities: [],
    careerGoals: [],
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputMethod, setInputMethod] = useState<"upload" | "manual" | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsProcessing(true)
    setInputMethod("upload")

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const imageData = reader.result as string

        const response = await fetch("/api/analyze-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData,
            mimeType: file.type,
          }),
        })

        const result = await response.json()

        if (result.success) {
          setStudentProfile((prev) => ({
            ...prev,
            subjects: result.data.subjects.map((subject: any) => ({
              subject: subject.name,
              level: "NSSCO" as const,
              grade: subject.grade,
              points: subject.points,
            })),
          }))
        } else {
          console.error("Document analysis failed:", result.error)
          // Fall back to manual entry
          setInputMethod("manual")
        }

        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Document processing failed:", error)
      setIsProcessing(false)
      setInputMethod("manual")
    }
  }

  const addSubject = () => {
    setInputMethod("manual")
    setStudentProfile((prev) => ({
      ...prev,
      subjects: [
        ...(prev.subjects || []),
        {
          subject: "",
          level: "NSSCO" as const,
          grade: "",
          points: 0,
        },
      ],
    }))
  }

  const removeSubject = (index: number) => {
    setStudentProfile((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateSubject = (index: number, field: string, value: string) => {
    setStudentProfile((prev) => {
      const subjects = [...(prev.subjects || [])]
      subjects[index] = { ...subjects[index], [field]: value }

      if (field === "grade") {
        const level = subjects[index].level as "NSSCO" | "NSSCAS" | "NSSCH" | "HIGCSE" | "IGCSE"
        subjects[index].points = gradeToPoints[level][value] || 0
      }

      return { ...prev, subjects }
    })
  }

  const handleInterestsChange = (interests: string[]) => {
    setStudentProfile((prev) => ({
      ...prev,
      interests,
    }))
  }

  const toggleUniversity = (university: "UNAM" | "NUST" | "IUM") => {
    setStudentProfile((prev) => {
      const universities = prev.preferredUniversities || []
      const newUniversities = universities.includes(university)
        ? universities.filter((u) => u !== university)
        : [...universities, university]
      return { ...prev, preferredUniversities: newUniversities }
    })
  }

  const calculateTotalPoints = () => {
    return (studentProfile.subjects || [])
      .slice(0, 5)
      .sort((a, b) => b.points - a.points)
      .reduce((total, subject) => total + subject.points, 0)
  }

  const handleSubmit = () => {
    const totalPoints = calculateTotalPoints()
    const completeProfile: StudentProfile = {
      name: studentProfile.name || "Anonymous Student",
      subjects: studentProfile.subjects || [],
      totalPoints,
      interests: studentProfile.interests || [],
      preferredUniversities: studentProfile.preferredUniversities || [],
      careerGoals: studentProfile.careerGoals || [],
    }

    localStorage.setItem("studentProfile", JSON.stringify(completeProfile))
    router.push("/results")
  }

  const getGradeOptions = (level: string) => {
    switch (level) {
      case "NSSCO":
        return nsscoGrades
      case "NSSCAS":
        return nsscasGrades
      case "NSSCH":
        return nsschGrades
      case "HIGCSE":
        return higcseGrades
      case "IGCSE":
        return igcseGrades
      default:
        return nsscoGrades
    }
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Career Namibia</h1>
          </Link>
          <div className="text-sm text-muted-foreground">Step {step} of 3</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Academic Results</span>
            <span>Interests</span>
            <span>Preferences</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Academic Results</CardTitle>
              <CardDescription>
                Upload your report card to automatically fill in your results, or enter them manually below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(inputMethod === null || inputMethod === "upload") && (
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Upload Your Report Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a clear photo or scan of your report card and we'll automatically extract your grades
                      </p>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="report-upload" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                          <Upload className="h-4 w-4" />
                          {isProcessing ? "Processing..." : "Choose File"}
                        </div>
                      </Label>
                      <Input
                        id="report-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </div>
                    {uploadedFile && (
                      <p className="text-sm text-muted-foreground mt-2">Uploaded: {uploadedFile.name}</p>
                    )}
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Extracting grades from your report card...
                  </div>
                </div>
              )}

              {inputMethod === null && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                  </div>
                </div>
              )}

              {(inputMethod === "manual" || (studentProfile.subjects && studentProfile.subjects.length > 0)) && (
                <div className="space-y-4">
                  {inputMethod === "upload" && (
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Extracted {studentProfile.subjects?.length || 0} subjects from your report card
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputMethod("manual")
                          setStudentProfile((prev) => ({ ...prev, subjects: [] }))
                          setUploadedFile(null)
                        }}
                      >
                        Enter Manually Instead
                      </Button>
                    </div>
                  )}

                  {(studentProfile.subjects || []).map((subject, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg"
                    >
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select
                          value={subject.subject}
                          onValueChange={(value) => updateSubject(index, "subject", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subj) => (
                              <SelectItem key={subj} value={subj}>
                                {subj}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select value={subject.level} onValueChange={(value) => updateSubject(index, "level", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Grade</Label>
                        <Select value={subject.grade} onValueChange={(value) => updateSubject(index, "grade", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {getGradeOptions(subject.level).map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="text-sm text-muted-foreground">Points: {subject.points}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(inputMethod === "manual" || (studentProfile.subjects && studentProfile.subjects.length > 0)) && (
                <Button variant="outline" onClick={addSubject} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              )}

              {inputMethod === null && (
                <Button variant="outline" onClick={addSubject} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Enter Subjects Manually
                </Button>
              )}

              {studentProfile.subjects && studentProfile.subjects.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm font-medium">Total Points (Best 5 subjects): {calculateTotalPoints()}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={(studentProfile.subjects || []).length === 0}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Interests</CardTitle>
              <CardDescription>
                Search and select the areas that interest you most. This helps us match you with suitable programs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <InterestSearch
                selectedInterests={studentProfile.interests || []}
                onInterestsChange={handleInterestsChange}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button onClick={() => setStep(3)} disabled={(studentProfile.interests || []).length === 0}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>University Preferences</CardTitle>
              <CardDescription>
                Which universities are you interested in? You can select multiple options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {(["UNAM", "NUST", "IUM"] as const).map((university) => (
                  <div key={university} className="flex items-center space-x-2">
                    <Checkbox
                      id={university}
                      checked={(studentProfile.preferredUniversities || []).includes(university)}
                      onCheckedChange={() => toggleUniversity(university)}
                    />
                    <Label htmlFor={university} className="text-sm font-normal">
                      {university === "UNAM" && "University of Namibia (UNAM)"}
                      {university === "NUST" && "Namibia University of Science and Technology (NUST)"}
                      {university === "IUM" && "International University of Management (IUM)"}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={(studentProfile.preferredUniversities || []).length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  Get My Recommendations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
