import { NextRequest, NextResponse } from 'next/server'
import scrape from '@/lib/scrape'
import { LinkedInScraper } from '@/lib/parse'

interface JobData {
  jobTitle?: string;
  companyName?: string;
  location?: string;
  jobDescription?: string;
  postedTime?: string;
  applicants?: string;
  salaryRange?: string;
  jobUrl?: string;
  companyId?: string;
  titleId?: string;
  extractedAt?: string;
}

async function extractJobDetails(url: string): Promise<JobData | null> {
  const scraper = new LinkedInScraper()
  
  console.log('API: Extracting job details from URL:', url)

  // Scrape the job details page
  const html = await scrape(url)

  // Parse the HTML to extract job details
  const jobData = scraper.scrape(html)

  if (!jobData) {
    return null
  }

  // Convert to the expected format
  return {
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    location: jobData.location,
    jobDescription: jobData.jobDescription,
    postedTime: jobData.postedTime,
    applicants: jobData.applicants,
    salaryRange: jobData.salaryRange,
    jobUrl: jobData.jobUrl,
    companyId: jobData.companyId,
    titleId: jobData.titleId,
    extractedAt: jobData.extractedAt
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  console.log(`API: [${requestId}] Received job details request`)
  
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    console.log(`API: [${requestId}] Job URL: "${url}"`)

    if (!url?.trim()) {
      console.log(`API: [${requestId}] Missing job URL`)
      return NextResponse.json(
        { error: 'Job URL is required' },
        { status: 400 }
      )
    }

    console.log(`API: [${requestId}] Starting job details extraction...`)
    const jobData = await extractJobDetails(url)
    
    if (!jobData) {
      console.log(`API: [${requestId}] No job data extracted`)
      return NextResponse.json(
        { error: 'Unable to extract job details. This might be due to LinkedIn\'s anti-bot measures or an invalid URL.' },
        { status: 404 }
      )
    }

    console.log(`API: [${requestId}] Job details extraction completed`)
    return NextResponse.json(jobData)
  } catch (error) {
    console.error(`API: [${requestId}] Error extracting job details:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract job details' },
      { status: 500 }
    )
  }
}
