import { groq } from "@ai-sdk/groq"
import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const systemMessage = {
    role: "system" as const,
    content: `You are a knowledgeable career guidance counselor specializing in Namibian higher education and career paths. 
    You help students make informed decisions about university programs and career choices.
    
    Your expertise includes:
    - UNAM, NUST, and IUM programs and admission requirements
    - Namibian job market trends and opportunities
    - Career development and academic planning
    - Study skills and university preparation
    
    Always be:
    - Encouraging and supportive
    - Specific and actionable in your advice
    - Knowledgeable about local context
    - Honest about challenges while remaining optimistic
    
    If asked about specific programs or requirements, provide accurate information based on current Namibian university standards.`,
  }

  const prompt = convertToModelMessages([systemMessage, ...messages])

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages: prompt,
    maxOutputTokens: 2000,
    temperature: 0.7,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
