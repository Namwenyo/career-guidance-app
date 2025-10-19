import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    console.log("[v0] GROQ_API_KEY available:", !!process.env.GROQ_API_KEY)

    const { studentProfile, matches } = await req.json()

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are an expert career guidance counselor specializing in Namibian higher education. 
Provide personalized, encouraging, and actionable career advice.

Student Profile:
- Academic Results: ${JSON.stringify(studentProfile.academicResults)}
- Total Points: ${studentProfile.totalPoints}
- Interests: ${studentProfile.interests?.join(", ") || "Not specified"}
- Preferred Universities: ${studentProfile.preferredUniversities?.join(", ") || "Any"}

Program Matches Found:
${JSON.stringify(matches, null, 2)}

Please provide a comprehensive career guidance response that includes:

1. A personalized, encouraging message for the student
2. Top 5 program recommendations with detailed reasoning
3. Specific improvement suggestions if needed
4. Current career market insights for Namibia

Format your response as a detailed analysis that will help guide this student's career decisions.`,
      maxOutputTokens: 1000,
    })

    const aiRecommendations = {
      personalizedMessage:
        text.split("\n")[0] ||
        "Based on your academic profile, you have great potential for success in higher education.",
      fullAnalysis: text,
      topRecommendations: (matches.recommendations?.topMatches || matches.topMatches || []).slice(0, 3).map((match: any, index: number) => ({
        program: match.program.name,
        university: match.program.university,
        matchScore: match.score,
        reasoning: `This program aligns well with your academic performance and interests.`,
        careerProspects: match.program.careerPossibilities?.slice(0, 3) || [],
        strengthsAlignment: studentProfile.interests?.slice(0, 2) || [],
      })),
      improvementSuggestions: [
        {
          area: "Academic Performance",
          suggestion: "Focus on strengthening core subjects",
          impact: "Will improve your eligibility for competitive programs",
        },
      ],
      careerInsights: {
        marketTrends: [
          "Digital skills in high demand",
          "Healthcare sector growing",
          "Engineering opportunities expanding",
        ],
        skillsInDemand: ["Problem-solving", "Communication", "Technical skills"],
        futureOutlook: "Namibia's economy is diversifying, creating new opportunities across various sectors.",
      },
    }

    return Response.json({ success: true, data: aiRecommendations })
  } catch (error) {
    console.error("AI recommendations error:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to generate recommendations",
      },
      { status: 500 },
    )
  }
}
