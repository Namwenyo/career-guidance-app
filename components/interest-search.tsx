"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InterestSearchProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
}

export function InterestSearch({ selectedInterests, onInterestsChange }: InterestSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableInterests, setAvailableInterests] = useState<string[]>([])
  const [filteredInterests, setFilteredInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCustomInput, setShowCustomInput] = useState(false)

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
      setShowCustomInput(false)
    } else {
      const filtered = availableInterests.filter((interest) =>
        interest.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredInterests(filtered)
      
      // Show custom input if search term doesn't match any existing interests
      // and the term is at least 2 characters long
      const exactMatch = availableInterests.some(
        interest => interest.toLowerCase() === searchTerm.toLowerCase()
      )
      setShowCustomInput(!exactMatch && searchTerm.length >= 2)
    }
  }, [searchTerm, availableInterests])

  const addInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      onInterestsChange([...selectedInterests, interest])
    }
    setSearchTerm("")
    setShowCustomInput(false)
  }

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interest))
  }

  const addCustomInterest = () => {
    if (searchTerm.trim() && !selectedInterests.includes(searchTerm.trim())) {
      onInterestsChange([...selectedInterests, searchTerm.trim()])
      setSearchTerm("")
      setShowCustomInput(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCustomInput) {
      e.preventDefault()
      addCustomInterest()
    }
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
          placeholder="Type to search interests or add your own..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full"
        />
        
        {/* Dropdown with search results */}
        {searchTerm && (filteredInterests.length > 0 || showCustomInput) && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {/* Existing interests from database */}
            {filteredInterests
              .filter((interest) => !selectedInterests.includes(interest))
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => addInterest(interest)}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  {interest}
                </button>
              ))}
            
            {/* Custom interest option */}
            {showCustomInput && (
              <button
                onClick={addCustomInterest}
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm flex items-center gap-2 border-t border-border"
              >
                <Plus className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">Add "{searchTerm}" as custom interest</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected Interests:</div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => {
              const isCustom = !availableInterests.includes(interest)
              return (
                <Badge 
                  key={interest} 
                  variant={isCustom ? "default" : "secondary"} 
                  className="flex items-center gap-1"
                >
                  {interest}
                  {isCustom && (
                    <span className="text-xs bg-primary/20 px-1 rounded">custom</span>
                  )}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Interests when no search */}
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
                  className="text-left p-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  {interest}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground">
        💡 <strong>Tip:</strong> Type any interest and press Enter to add it as a custom interest if it's not in the list.
      </div>
    </div>
  )
}