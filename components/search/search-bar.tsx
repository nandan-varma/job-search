"use client"

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  onSearch: (title: string, location: string) => void
  loading: boolean
  title: string
  setTitle: (title: string) => void
  location: string
  setLocation: (location: string) => void
}

export function SearchBar({ onSearch, loading, title, setTitle, location, setLocation }: SearchBarProps) {
  const handleSearch = () => {
    if (title?.trim()) {
      onSearch(title.trim(), location?.trim() || '')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1">
        <Input
          placeholder="Job title (e.g., Software Engineer)"
          value={title || ''}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full"
        />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Location (optional)"
          value={location || ''}
          onChange={(e) => setLocation(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full"
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={loading || !title?.trim()}
        className="px-8"
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  )
}
