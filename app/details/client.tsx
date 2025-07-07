"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Briefcase, MapPin, Building, Clock, Users, Loader2, DollarSign, Calendar, ExternalLink, ArrowLeft } from 'lucide-react'

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

interface JobDetailsClientProps {
  initialJobData: JobData | null;
  initialError: string | null;
  initialUrl: string;
}

export default function JobDetailsClient({
  initialJobData,
  initialError,
  initialUrl
}: JobDetailsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [url, setUrl] = useState(initialUrl)
  const [jobData, setJobData] = useState<JobData | null>(initialJobData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>(initialError || '')

  // Use ref to track if we've processed initial data
  const initialDataProcessed = useRef(false)
  const currentRequestAbortController = useRef<AbortController | null>(null)

  // Update URL with search parameters without triggering navigation
  const updateURL = (jobUrl: string) => {
    const params = new URLSearchParams()
    if (jobUrl.trim()) {
      params.set('url', jobUrl.trim())
    }
    
    const newURL = params.toString() ? `/details?${params.toString()}` : '/details'
    
    // Use replaceState to update URL without triggering navigation
    window.history.replaceState({}, '', newURL)
  }

  // Extract job details function (shared between form submit and initial load)
  const extractJobDetails = async (jobUrl: string) => {
    if (!jobUrl?.trim()) return

    // Cancel any ongoing request
    if (currentRequestAbortController.current) {
      currentRequestAbortController.current.abort()
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    currentRequestAbortController.current = abortController

    setLoading(true)
    setError('')
    setJobData(null)
    
    try {
      // Update URL for bookmarking/sharing without triggering reload
      updateURL(jobUrl)
      
      // Make API call for job details extraction
      const response = await fetch(`/api/job-details?url=${encodeURIComponent(jobUrl)}`, {
        signal: abortController.signal
      })
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to extract job details')
      }
      
      console.log('Client: Job details received:', data)
      setJobData(data)
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Client: Job details request was aborted')
        return
      }
      
      console.error('Client: Job extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract job details')
      setJobData(null)
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
      // Clear the abort controller if this was the current one
      if (currentRequestAbortController.current === abortController) {
        currentRequestAbortController.current = null
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await extractJobDetails(url)
  }

  // Update state when URL parameters change (from browser navigation)
  useEffect(() => {
    const urlParam = searchParams.get('url') || ''
    // Only update URL state if different, don't trigger new extraction
    if (urlParam !== url) {
      setUrl(urlParam)
    }
  }, [searchParams])

  // Reset loading state when we have initial results or errors
  useEffect(() => {
    if ((initialJobData || initialError) && !initialDataProcessed.current) {
      setLoading(false)
      initialDataProcessed.current = true
    }
  }, [initialJobData, initialError])

  // Trigger initial extraction if we have a URL parameter but no initial data
  useEffect(() => {
    if (initialUrl && !initialJobData && !initialError && !initialDataProcessed.current) {
      console.log('Client: Triggering initial extraction for URL parameter')
      initialDataProcessed.current = true
      extractJobDetails(initialUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl, initialJobData, initialError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRequestAbortController.current) {
        currentRequestAbortController.current.abort()
      }
    }
  }, [])

  return (
    <>
      {/* Header */}
      <div className="text-center space-y-4 pt-12">
        {/* Back button - show when coming from another page */}
        {url && (
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Job Search</span>
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-2">
          <Briefcase className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">LinkedIn Job Extractor</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Paste a LinkedIn job URL to extract and view the complete job description and details
        </p>
      </div>

      {/* URL Input Form */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Enter LinkedIn Job URL</span>
          </CardTitle>
          <CardDescription>
            Paste the URL of a LinkedIn job posting to extract its details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://www.linkedin.com/jobs/view/..."
              value={url || ''}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !url?.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Extracting...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Extract
                </>
              )}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      {jobData && (
        <div className="space-y-6">
          {/* Job Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{jobData.jobTitle || 'Job Title Not Found'}</h2>
                  {jobData.companyName && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-lg text-gray-700">{jobData.companyName}</span>
                    </div>
                  )}
                  {jobData.location && (
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{jobData.location}</span>
                    </div>
                  )}
                  {jobData.postedTime && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{jobData.postedTime}</span>
                    </div>
                  )}
                  {jobData.applicants && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{jobData.applicants}</span>
                    </div>
                  )}
                </div>

                {/* Job Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobData.salaryRange && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Salary</p>
                        <p className="text-sm font-medium">{jobData.salaryRange}</p>
                      </div>
                    </div>
                  )}
                  {jobData.jobUrl && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Original Job URL</p>
                        <a 
                          href={jobData.jobUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block max-w-xs"
                        >
                          View on LinkedIn
                        </a>
                      </div>
                    </div>
                  )}
                  {jobData.extractedAt && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-gray-500">Extracted At</p>
                        <p className="text-sm font-medium">
                          {new Date(jobData.extractedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          {jobData.jobDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: jobData.jobDescription }}
                />
              </CardContent>
            </Card>
          )}

          {/* No Description Found */}
          {!jobData.jobDescription && jobData.jobTitle && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Job description could not be extracted from this page. This might be a job search results page or the content requires authentication.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      {!jobData && !loading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">How to use:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Find a job posting on LinkedIn</li>
                <li>• Copy the URL from your browser</li>
                <li>• Paste it in the input field above</li>
                <li>• Click "Extract" to view job details</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <h4 className="font-medium text-blue-900 text-sm">What this tool can extract:</h4>
                <ul className="text-blue-800 text-xs mt-2 space-y-1">
                  <li>• Job title, company, and location</li>
                  <li>• Full job description with formatting</li>
                  <li>• Salary range (if available)</li>
                  <li>• Posted time and number of applicants</li>
                  <li>• Original job URL and extraction timestamp</li>
                  <li>• Company and title IDs for LinkedIn integration</li>
                </ul>
              </div>
              <p className="text-xs text-blue-700 mt-4">
                Note: Works with LinkedIn job posting URLs (linkedin.com/jobs/view/...). Individual job postings work best.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
