import * as cheerio from 'cheerio';

export interface JobData {
    jobTitle: string;
    companyName: string;
    location: string;
    salaryRange?: string;
    jobDescription: string;
    postedTime?: string;
    applicants?: string;
    jobUrl?: string;
    companyId?: string;
    titleId?: string;
    extractedAt: string;
}

export interface JobSearchResult {
    jobTitle: string;
    companyName: string;
    location: string;
    jobUrl: string;
    postedTime?: string;
    jobType?: string;
    salaryRange?: string;
    description?: string;
}

export interface SearchResults {
    jobs: JobSearchResult[];
    totalResults?: number;
    currentPage?: number;
    extractedAt: string;
}

export abstract class Scraper {
    abstract scrape(html: string): JobData | null;
}

export class LinkedInScraper extends Scraper {
    // Cache selectors for better performance
    private static readonly JOB_CARD_SELECTORS = [
        '.base-card.main-job-card',
        '.base-card[data-entity-urn*="jobPosting"]', 
        '.job-search-card',
        '.base-main-card'
    ].join(', ');

    private static readonly TITLE_SELECTORS = [
        'h3.base-main-card__title',
        'h3.base-search-card__title', 
        '.main-job-card__title'
    ];

    private static readonly COMPANY_SELECTORS = [
        'h4.base-main-card__subtitle a',
        'h4.base-search-card__subtitle a',
        '.main-job-card__company'
    ];

    scrape(html: string): JobData | null {
        const cleanHtml = this.preprocessHtml(html);
        const $ = cheerio.load(cleanHtml);
        return this.extractJobDetail($);
    }

    scrapeSearchResults(html: string): SearchResults {
        const cleanHtml = this.preprocessHtml(html);
        const $ = cheerio.load(cleanHtml);

        return this.extractJobSearchResults($);
    }

    private cleanText(text: string): string {
        if (!text) return '';
        
        return text
            .replace(/<!--[\s\S]*?-->/g, '')  // Remove HTML comments (optimized for multiline)
            .replace(/\*+/g, '')              // Remove asterisks
            .replace(/\s+/g, ' ')             // Replace multiple whitespace with single space
            .replace(/[^\w\s\-.,!?()&$+]/g, '') // Remove special characters except common punctuation
            .trim();
    }

    private preprocessHtml(html: string): string {
        if (!html) return '';
        
        // Handle escaped characters common in scraped HTML - optimized with single pass
        return html
            .replace(/<!--[\s\S]*?-->/g, '')  // Remove all HTML comments (multiline)
            .replace(/\\([nrt"\\])/g, (match, char) => {
                switch (char) {
                    case 'n': return '\n';
                    case 'r': return '\r';
                    case 't': return '\t';
                    case '"': return '"';
                    case '\\': return '\\';
                    default: return match;
                }
            });
    }

    // Helper method to extract text using multiple selectors
    private extractTextWithSelectors($element: cheerio.Cheerio<any>, selectors: string[]): string {
        for (const selector of selectors) {
            const text = this.cleanText($element.find(selector).first().text());
            if (text) return text;
        }
        return '';
    }

    // Helper method to extract text with fallback selectors
    private extractTextWithFallback($element: cheerio.Cheerio<any>, primary: string, fallback: string): string {
        return this.cleanText($element.find(primary).text()) || 
               this.cleanText($element.find(fallback).text());
    }

    private extractJobSearchResults($: cheerio.CheerioAPI): SearchResults {
        const jobs: JobSearchResult[] = [];
        
        // Use cached selector for better performance
        const jobCards = $(LinkedInScraper.JOB_CARD_SELECTORS).toArray();
        
        console.log(`Found ${jobCards.length} job card elements`);
        
        jobCards.forEach((card, index) => {
            const $card = $(card);
            
            // Extract job title using optimized helper
            let jobTitle = this.extractTextWithSelectors($card, LinkedInScraper.TITLE_SELECTORS);
            if (!jobTitle) {
                jobTitle = this.cleanText($card.find('a[data-tracking-control-name*="job"] span').first().text());
            }
            
            // Extract company name using optimized helper
            let companyName = this.extractTextWithSelectors($card, LinkedInScraper.COMPANY_SELECTORS);
            if (!companyName) {
                companyName = this.cleanText($card.find('a[data-tracking-control-name*="company"]').text());
            }
            
            // Skip if missing essential information early
            if (!jobTitle || !companyName) {
                return;
            }
            
            // Extract other fields only if we have essential info
            const jobUrl = this.normalizeLinkedInUrl($card.find('a.base-card__full-link, a[href*="/jobs/view/"]').attr('href') || '');
            const location = this.cleanText($card.find('.main-job-card__location, .job-search-card__location, .base-main-card__metadata span').first().text()) || 'Not specified';
            const postedTime = this.cleanText($card.find('time.main-job-card__listdate, time.job-search-card__listdate, time').text());
            const salaryRange = this.cleanText($card.find('.main-job-card__salary-info, .job-search-card__salary-info, .salary').text());
            const jobType = this.cleanText($card.find('.job-posting-benefits__text, .main-job-card__job-type').text());
            const description = this.cleanText($card.find('.job-search-card__snippet, .base-search-card__snippet, .main-job-card__snippet').text());
            
            console.log(`Job ${index + 1}:`, { jobTitle, companyName, location });
            
            jobs.push({
                jobTitle,
                companyName,
                location,
                jobUrl,
                postedTime,
                jobType,
                salaryRange,
                description
            });
        });
        
        // Extract total results count - try multiple selectors
        let totalResults: number | undefined;
        const totalResultsText = $('.results-context-header__job-count, .jobs-search-results-list__subtitle, .search-results__total').text();
        if (totalResultsText) {
            totalResults = this.extractNumberFromText(totalResultsText);
        }
        
        console.log(`Extracted ${jobs.length} jobs from ${jobCards.length} cards`);
        
        // If no jobs found, try to extract from similar jobs section (optimized)
        if (jobs.length === 0) {
            console.log('No search results found, trying to extract similar jobs...');
            const similarJobCards = $('.base-card[data-tracking-control-name="public_jobs_similar-jobs"]').toArray();
            
            similarJobCards.forEach((card) => {
                const $card = $(card);
                
                const jobTitle = this.cleanText($card.find('h3.base-main-card__title, .sr-only').text());
                const companyName = this.cleanText($card.find('h4.base-main-card__subtitle a').text());
                
                // Skip if missing essential information
                if (!jobTitle || !companyName) return;
                
                const jobUrl = this.normalizeLinkedInUrl($card.find('a.base-card__full-link').attr('href') || '');
                const location = this.cleanText($card.find('.main-job-card__location').text()) || 'Not specified';
                const salaryRange = this.cleanText($card.find('.main-job-card__salary-info').text());
                const postedTime = this.cleanText($card.find('time.main-job-card__listdate').text());
                
                jobs.push({
                    jobTitle,
                    companyName,
                    location,
                    jobUrl,
                    postedTime,
                    jobType: '',
                    salaryRange,
                    description: ''
                });
            });
            
            console.log(`Extracted ${jobs.length} similar jobs as fallback`);
        }
        
        return {
            jobs,
            totalResults,
            extractedAt: new Date().toISOString()
        };
    }

    private normalizeLinkedInUrl(url: string): string {
        if (!url) return '';
        // Convert relative URLs to absolute URLs
        return url.startsWith('/') ? `https://www.linkedin.com${url}` : url;
    }

    private extractNumberFromText(text: string): number | undefined {
        if (!text) return undefined;
        // Handle formats like "32,000+", "1,234", "500+", etc. - optimized regex
        const match = text.match(/(\d{1,3}(?:,\d{3})*)\+?/);
        return match ? parseInt(match[1].replace(/,/g, ''), 10) : undefined;
    }

    private extractJobDetail($: cheerio.CheerioAPI): JobData | null {
        // Extract job title with multiple fallbacks
        const jobTitle = this.cleanText($('.topcard__title').text()) || 
                        this.cleanText($('h1[data-test-id="job-title"]').text()) ||
                        this.cleanText($('title').text().replace(/\s*\|\s*LinkedIn$/, ''));

        // Extract company name with multiple fallbacks
        const companyName = this.cleanText($('.topcard__org-name-link').text()) ||
                           this.cleanText($('.sub-nav-cta__optional-url').text()) ||
                           $('meta[property="og:title"]').attr('content')?.split(' hiring ')[0]?.trim() ||
                           '';

        // Early return if we can't extract basic info
        if (!jobTitle && !companyName) {
            return null;
        }

        // Extract other fields efficiently
        const location = this.extractTextWithFallback($('body'), '.topcard__flavor--bullet', '.sub-nav-cta__meta-text');
        const salaryRange = this.extractTextWithFallback($('body'), '.compensation__salary', '.salary');
        
        // Extract job description with fallbacks
        let jobDescription = '';
        const descSelectors = ['.show-more-less-html__markup', '.description__text', '.job-description'];
        for (const selector of descSelectors) {
            const element = $(selector);
            if (element.length > 0) {
                jobDescription = element.html()?.trim() || '';
                break;
            }
        }

        // Extract metadata
        const postedTime = this.cleanText($('.posted-time-ago__text').text()) ||
                          $('meta[name="description"]').attr('content')?.match(/Posted\s+[\d:]+\s+[AP]M/)?.[0];
        const applicants = this.cleanText($('.num-applicants__caption').text());
        const jobUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content');
        const companyId = $('meta[name="companyId"]').attr('content');
        const titleId = $('meta[name="titleId"]').attr('content');

        return {
            jobTitle: jobTitle || 'Unknown Title',
            companyName: companyName || 'Unknown Company',
            location: location || 'Unknown Location',
            salaryRange,
            jobDescription,
            postedTime,
            applicants,
            jobUrl,
            companyId,
            titleId,
            extractedAt: new Date().toISOString()
        };
    }

}

// Factory function to create the appropriate scraper based on URL
export function createScraper(url: string): Scraper {
    if (url.includes('linkedin.com')) {
        return new LinkedInScraper();
    }
    
    // Add other scrapers for different job sites here
    // if (url.includes('indeed.com')) {
    //     return new IndeedScraper();
    // }
    
    throw new Error(`No scraper available for URL: ${url}`);
}

// Utility function to extract clean text from job description (optimized)
export function extractPlainTextFromDescription(html: string): string {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    return $.text()
        .replace(/\s+/g, ' ')
        .trim();
}
