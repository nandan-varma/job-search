"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/search-bar'
import { SearchResults } from '@/components/search/search-results'

// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface JobSearchResult {
  jobTitle: string;
  companyName: string;
  location: string;
  jobUrl: string;
  postedTime?: string;
  jobType?: string;
  salaryRange?: string;
  description?: string;
}

interface SearchResults {
  jobs: JobSearchResult[];
  totalResults?: number;
  extractedAt: string;
}

interface JobSearchClientProps {
  initialResults?: SearchResults | null;
  initialError?: string | null;
  initialTitle: string;
  initialLocation: string;
}

export default function JobSearchClient({
  initialResults = null,
  initialError = null,
  initialTitle,
  initialLocation
}: JobSearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [title, setTitle] = useState(initialTitle)
  const [location, setLocation] = useState(initialLocation)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(initialResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [hasSearched, setHasSearched] = useState(!!initialTitle)
  
  // Use refs to track search state and prevent duplicate searches
  const initialSearchDone = useRef(false)
  const currentSearchAbortController = useRef<AbortController | null>(null)
  
  // Debounce the title input for client-side searches
  const debouncedTitle = useDebounce(title, 2000)

  // Update URL with search parameters without triggering reload
  const updateURL = (searchTitle: string, searchLocation?: string) => {
    const params = new URLSearchParams()
    if (searchTitle.trim()) {
      params.set('q', searchTitle.trim())
    }
    if (searchLocation?.trim()) {
      params.set('location', searchLocation.trim())
    }
    
    const newURL = params.toString() ? `/?${params.toString()}` : '/'
    
    // Use replaceState to update URL without triggering navigation
    window.history.replaceState({}, '', newURL)
  }

  // Handle search using API route instead of URL updates
  const handleSearch = async (searchTitle?: string, searchLocation?: string) => {
    const titleToSearch = searchTitle ?? title
    if (!titleToSearch?.trim()) {
      return
    }

    // Cancel any ongoing search
    if (currentSearchAbortController.current) {
      currentSearchAbortController.current.abort()
    }

    // Create new abort controller for this search
    const abortController = new AbortController()
    currentSearchAbortController.current = abortController

    console.log('Client: Starting search for:', titleToSearch, 'location:', searchLocation ?? location)
    
    setHasSearched(true)
    setLoading(true)
    setError(null)
    
    try {
      // Update URL for bookmarking/sharing without triggering reload
      updateURL(titleToSearch, searchLocation ?? location)
      
      // Make API call for search
      const params = new URLSearchParams()
      params.set('q', titleToSearch)
      if ((searchLocation ?? location)?.trim()) {
        params.set('location', searchLocation ?? location)
      }
      
      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: abortController.signal
      })
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search jobs')
      }
      
      console.log('Client: Search results received:', data)
      setSearchResults(data)
      
      if (data.jobs.length === 0) {
        setError('No job results found. This might be due to LinkedIn\'s anti-bot measures or the search terms.')
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Client: Search request was aborted')
        return
      }
      
      console.error('Client: Search error:', error)
      setError(error instanceof Error ? error.message : 'Failed to search jobs')
      setSearchResults(null)
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
      // Clear the abort controller if this was the current one
      if (currentSearchAbortController.current === abortController) {
        currentSearchAbortController.current = null
      }
    }
  }

  // Handle manual search from search bar
  const handleManualSearch = (searchTitle?: string, searchLocation?: string) => {
    handleSearch(searchTitle, searchLocation)
  }

  // Update state when URL parameters change (from browser navigation)
  useEffect(() => {
    const urlTitle = searchParams.get('q') || ''
    const urlLocation = searchParams.get('location') || ''
    
    // Only update state if different, don't trigger new search here
    if (urlTitle !== title) {
      setTitle(urlTitle)
    }
    if (urlLocation !== location) {
      setLocation(urlLocation)
    }
  }, [searchParams])

  // Trigger initial search if we have URL parameters
  useEffect(() => {
    if (initialTitle && !initialSearchDone.current) {
      console.log('Client: Triggering initial search for URL parameters')
      initialSearchDone.current = true
      handleSearch(initialTitle, initialLocation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTitle, initialLocation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSearchAbortController.current) {
        currentSearchAbortController.current.abort()
      }
    }
  }, [])

  return (
    <>
      <SearchBar
        onSearch={handleManualSearch}
        loading={loading}
        title={title}
        setTitle={setTitle}
        location={location}
        setLocation={setLocation}
      />

      <SearchResults
        searchResults={searchResults}
        loading={loading}
        error={error}
        title={title}
        location={location}
        hasSearched={hasSearched}
      />
    </>
  )
}