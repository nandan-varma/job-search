import { NextRequest, NextResponse } from 'next/server'
import scrape, { buildLinkedInSearchUrl } from '@/lib/scrape'
import { LinkedInScraper } from '@/lib/parse'

interface SearchResults {
  jobs: Array<{
    jobTitle: string;
    companyName: string;
    location: string;
    jobUrl: string;
    postedTime?: string;
    jobType?: string;
    salaryRange?: string;
    description?: string;
  }>;
  totalResults?: number;
  extractedAt: string;
}

async function searchJobs(jobTitle: string, location?: string): Promise<SearchResults> {
  console.log('API: Starting job search for:', jobTitle, 'location:', location)
  const scraper = new LinkedInScraper()
  
  // Build LinkedIn search URL
  const searchUrl = buildLinkedInSearchUrl(jobTitle, location)
  console.log('API: Searching LinkedIn with URL:', searchUrl)

  // Scrape the search results page
  const html = await scrape(searchUrl)
  console.log('API: Scraped HTML length:', html.length)

  // Parse the HTML to extract job search results
  const searchResults = scraper.scrapeSearchResults(html)

  // Log debugging information
  console.log(`API: Found ${searchResults.jobs.length} job results for "${jobTitle}"`)
  
  if (searchResults.jobs.length > 0) {
    console.log('API: Sample job data:', {
      title: searchResults.jobs[0].jobTitle,
      company: searchResults.jobs[0].companyName,
      location: searchResults.jobs[0].location
    })
  }

  return searchResults.jobs.length > 0 ? searchResults : {
    jobs: [],
    totalResults: 0,
    extractedAt: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  console.log(`API: [${requestId}] Received search request`)
  
  try {
    const { searchParams } = new URL(request.url)
    const jobTitle = searchParams.get('q')
    const location = searchParams.get('location')

    console.log(`API: [${requestId}] Search params - title: "${jobTitle}", location: "${location}"`)

    if (!jobTitle?.trim()) {
      console.log(`API: [${requestId}] Missing job title`)
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      )
    }

    console.log(`API: [${requestId}] Starting job search...`)
    const results = await searchJobs(jobTitle, location || undefined)
    
    console.log(`API: [${requestId}] Search completed with ${results.jobs.length} jobs`)
    return NextResponse.json(results)
  } catch (error) {
    console.error(`API: [${requestId}] Error searching jobs:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search jobs' },
      { status: 500 }
    )
  }
}
