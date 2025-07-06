import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-9 w-48 mx-auto" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Search Results Skeleton */}
        <div className="space-y-4">
          {/* Results count skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Job cards skeleton */}
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-80" />
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center space-x-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center space-x-4 mt-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-16 w-full mt-3" />
                  </div>
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
