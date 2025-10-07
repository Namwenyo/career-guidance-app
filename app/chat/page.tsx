"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GraduationCap, ArrowLeft, MessageSquare, Send, Bot, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/career-chat" }),
  })

  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Career Namibia</h1>
          </Link>
          <div className="text-sm text-muted-foreground">AI Career Counselor</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Career Counselor
            </CardTitle>
            <CardDescription>
              Get personalized career guidance and ask questions about university programs, admission requirements, and
              career paths in Namibia.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <p className="text-sm">Hello! I'm your AI career counselor. I can help you with:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• University program information and requirements</li>
                      <li>• Career guidance and job market insights</li>
                      <li>• Study tips and academic planning</li>
                      <li>• Questions about UNAM, NUST, and IUM</li>
                    </ul>
                    <p className="text-sm mt-2">What would you like to know?</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {messages.map((message) => (
            <Card key={message.id} className={message.role === "user" ? "ml-12" : "mr-12"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {message.role === "user" ? (
                    <User className="h-6 w-6 text-muted-foreground mt-1" />
                  ) : (
                    <Bot className="h-6 w-6 text-primary mt-1" />
                  )}
                  <div className="flex-1">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <div key={index} className="text-sm whitespace-pre-wrap">
                            {part.text}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {status === "in_progress" && (
            <Card className="mr-12">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary mt-1" />
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about career guidance, university programs, or anything else..."
            disabled={status === "in_progress"}
            className="flex-1"
          />
          <Button type="submit" disabled={status === "in_progress" || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            This AI counselor provides guidance based on current information about Namibian universities and career
            paths.
          </p>
        </div>
      </div>
    </div>
  )
}
