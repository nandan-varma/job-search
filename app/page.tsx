import { Suspense } from 'react'
import JobSearchClient from './client'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JobSearchPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const jobTitle = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const location = typeof resolvedSearchParams.location === 'string' ? resolvedSearchParams.location : ''

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Job Search</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <JobSearchClient
            initialTitle={jobTitle}
            initialLocation={location}
          />
        </Suspense>
      </div>
    </div>
  )
}