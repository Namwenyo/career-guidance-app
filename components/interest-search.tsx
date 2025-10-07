"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface InterestSearchProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
}

export function InterestSearch({ selectedInterests, onInterestsChange }: InterestSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableInterests, setAvailableInterests] = useState<string[]>([])
  const [filteredInterests, setFilteredInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        console.log("Fetching interests from API...")
        const response = await fetch("/api/interests")
        const data = await response.json()
        console.log("API response:", data)

        if (Array.isArray(data)) {
          setAvailableInterests(data)
          setFilteredInterests(data.slice(0, 10))
          console.log("Successfully loaded", data.length, "interests")
        } else {
          console.error("Expected array but got:", typeof data)
        }
      } catch (error) {
        console.error("Failed to fetch interests:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInterests()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredInterests(availableInterests.slice(0, 10))
    } else {
      const filtered = availableInterests.filter((interest) =>
        interest.toLowerCase().startsWith(searchTerm.toLowerCase()),
      )
      setFilteredInterests(filtered)
    }
  }, [searchTerm, availableInterests])

  const addInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      onInterestsChange([...selectedInterests, interest])
    }
    setSearchTerm("")
  }

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interest))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded-md"></div>
        </div>
        <div className="text-sm text-muted-foreground">Loading interests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Type to search interests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        {searchTerm && filteredInterests.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredInterests
              .filter((interest) => !selectedInterests.includes(interest))
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => addInterest(interest)}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                >
                  {interest}
                </button>
              ))}
          </div>
        )}
      </div>

      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected Interests:</div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {searchTerm === "" && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Available Interests (showing first 10):</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredInterests
              .filter((interest) => !selectedInterests.includes(interest))
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => addInterest(interest)}
                  className="text-left p-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  {interest}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
