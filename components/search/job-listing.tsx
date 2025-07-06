import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export interface JobListingProps {
    jobTitle: string;
    companyName: string;
    location: string;
    jobUrl: string;
    postedTime?: string;
    jobType?: string;
    salaryRange?: string;
    description?: string;
}

export function JobListing({ 
    jobTitle, 
    companyName, 
    location, 
    jobUrl, 
    postedTime, 
    jobType, 
    salaryRange, 
    description 
}: JobListingProps) {
    const router = useRouter();
    
    const handleViewDetails = () => {
        if (jobUrl) {
            window.open(jobUrl, '_blank');
        }
    };

    const handleViewDetailsPage = () => {
        if (jobUrl) {
            router.push(`/details?url=${encodeURIComponent(jobUrl)}`);
        }
    };

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer" 
                                 onClick={handleViewDetails}>
                            {jobTitle}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                            {companyName} • {location}
                        </CardDescription>
                    </div>
                    {postedTime && (
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {postedTime}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {(jobType || salaryRange) && (
                        <div className="flex gap-2 text-sm">
                            {jobType && (
                                <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                                    {jobType}
                                </span>
                            )}
                            {salaryRange && (
                                <span className="px-2 py-1 bg-green-100 rounded-md text-green-700">
                                    {salaryRange}
                                </span>
                            )}
                        </div>
                    )}
                    
                    {description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {description}
                        </p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                        <Button 
                            onClick={handleViewDetails}
                            variant="outline" 
                            size="sm"
                            disabled={!jobUrl}
                        >
                            View on LinkedIn
                        </Button>
                        {jobUrl && (
                            <Button 
                                onClick={handleViewDetailsPage}
                                variant="default" 
                                size="sm"
                            >
                                View Details
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
