import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, Target, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Career Namibia</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#universities" className="text-muted-foreground hover:text-foreground transition-colors">
              Universities
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Find Your Perfect University Program with AI
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Get personalized recommendations for UNAM, NUST, and IUM programs based on your academic performance and
            interests. Make informed decisions about your future career now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/assessment">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Your Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/programs">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
                Browse Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">How Career Namibia Helps You</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Smart Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our AI analyzes your grades and interests to find programs that match your strengths and career goals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Comprehensive Database</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Access detailed information about programs from UNAM, NUST, and IUM including admission requirements
                  and career prospects.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Personalized Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get tailored recommendations and actionable insights to help you make the best decision for your
                  future.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section id="universities" className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-8 text-foreground">Universities</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-primary">UNAM</CardTitle>
                <CardDescription>University of Namibia</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive programs in agriculture, engineering, natural sciences, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-primary">NUST</CardTitle>
                <CardDescription>Namibia University of Science and Technology</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Leading programs in technology, engineering, health sciences, and business.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-primary">IUM</CardTitle>
                <CardDescription>International University of Management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specialized programs in management, business, and professional development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Career Namibia</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Empowering Namibian high school students to make informed career decisions through AI-powered guidance.
          </p>
        </div>
      </footer>
    </div>
  )
}
