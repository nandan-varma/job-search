"use client"

import { JobListing } from './job-listing'

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

interface SearchResultsProps {
  searchResults: SearchResults | null
  loading: boolean
  error: string | null
  title: string | null
  location: string | null
  hasSearched: boolean
}

export function SearchResults({ 
  searchResults, 
  loading, 
  error, 
  title, 
  location, 
  hasSearched 
}: SearchResultsProps) {
  // Error Message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
        <p className="font-medium">Search Error</p>
        <p className="text-sm">{error}</p>
        <p className="text-sm mt-1">
          Note: LinkedIn has anti-bot measures that may prevent scraping.
          Try different search terms or check the browser console for more details.
        </p>
      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Searching LinkedIn for jobs...</p>
      </div>
    )
  }

  // Search Results
  if (searchResults && !loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Search Results for "{title}"
            {location && ` in ${location}`}
          </h2>
          {searchResults.totalResults && (
            <span className="text-gray-600">
              {searchResults.totalResults.toLocaleString()} total jobs
            </span>
          )}
        </div>

        {searchResults.jobs.length > 0 ? (
          <div className="space-y-4">
            {searchResults.jobs.map((job, index) => (
              <JobListing
                key={index}
                {...job}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No jobs found for your search criteria.</p>
            <p className="text-sm mt-2">Try adjusting your search terms or location.</p>
          </div>
        )}
      </div>
    )
  }

  // Initial State
  if (!searchResults && !loading && !error && title && !hasSearched) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Click "Search" to find jobs for "{title}"</p>
      </div>
    )
  }

  return null
}
