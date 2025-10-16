import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { imageData, mimeType } = await req.json()

    if (!imageData) {
      return Response.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      )
    }

    console.log("🔄 Sending to Django OCR...")

    // Call Django OCR API
    const djangoResponse = await fetch('http://localhost:8000/api/analyze-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData, mimeType }),
    })

    if (!djangoResponse.ok) {
      throw new Error(`Django OCR failed: ${djangoResponse.status}`)
    }

    const djangoData = await djangoResponse.json()
    
    if (!djangoData.success) {
      return Response.json(
        { success: false, error: djangoData.error },
        { status: 400 }
      )
    }

    console.log("✅ Django OCR completed:", djangoData.data.subjects)

    // Get AI analysis of REAL extracted data
    const { text: aiAnalysis } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `As an expert Namibian education counselor, analyze these REAL academic results from OCR:

EXTRACTED RESULTS:
${djangoData.data.subjects.map((s: any, i: number) => `${i + 1}. ${s.name}: ${s.grade} (${s.points} points)`).join('\n')}

TOTAL POINTS: ${djangoData.data.totalPoints}

Provide professional analysis of academic strengths and areas for improvement based on these actual results.`,
      maxOutputTokens: 500,
    })

    const analysisData = {
      ...djangoData.data,
      aiAnalysis,
    }

    console.log("✅ Complete analysis finished")
    return Response.json({ success: true, data: analysisData })

  } catch (error) {
    console.error("❌ Analysis error:", error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return Response.json(
      {
        success: false,
        error: "Failed to analyze document",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}