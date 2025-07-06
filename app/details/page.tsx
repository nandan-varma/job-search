
import { Suspense } from 'react'
import JobDetailsClient from './client'

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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JobDetailsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const url = typeof resolvedSearchParams.url === 'string' ? resolvedSearchParams.url : ''

  // For now, let's not do any server-side extraction to prevent duplicate requests
  // The client will handle all extractions via the API route
  const initialJobData: JobData | null = null
  const initialError: string | null = null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Suspense fallback={<div className='text-center'>Loading...</div>}>
          <JobDetailsClient
            initialJobData={initialJobData}
            initialError={initialError}
            initialUrl={url}
          />
        </Suspense>
      </div>
    </div>
  )
}

