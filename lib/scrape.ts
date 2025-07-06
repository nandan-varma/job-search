import { chromium, Browser } from 'playwright-core';

// Singleton browser instance
let browserInstance: Browser | null = null;

// Simple in-memory cache for scraping results
const cache = new Map<string, { html: string, timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const MAX_CACHE_SIZE = 50; // Limit cache size

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds between requests

// Request deduplication - prevent multiple concurrent requests for the same URL
const pendingRequests = new Map<string, Promise<string>>();

// Get or create browser instance with simple retry logic
async function getBrowser(): Promise<Browser> {
    if (!process.env["BROWSERLESS_TOKEN"]) {
        throw new Error("BROWSERLESS_TOKEN is required in environment variables.");
    }

    if (!browserInstance || !browserInstance.isConnected()) {
        console.log('Creating new browser instance...');
        
        try {
            browserInstance = await chromium.connectOverCDP(
                `wss://production-sfo.browserless.io?token=${process.env["BROWSERLESS_TOKEN"]}`
            );
            
            // Handle browser disconnection
            browserInstance.on('disconnected', () => {
                console.log('Browser disconnected, resetting instance...');
                browserInstance = null;
            });
            
            console.log('Browser instance created successfully');
        } catch (error) {
            browserInstance = null;
            console.error('Failed to connect to browser:', error);
            throw new Error(`Failed to connect to browser: ${error}`);
        }
    }

    return browserInstance;
}

// Simple rate limiting function
async function waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
}

// Cache management functions
function getCachedResult(url: string): string | null {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached result for URL:', url);
        return cached.html;
    }
    return null;
}

function setCachedResult(url: string, html: string): void {
    cache.set(url, { html, timestamp: Date.now() });
    
    // Clean up old cache entries if cache is too large
    if (cache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const oldestKey = entries[0][0];
        cache.delete(oldestKey);
        console.log(`Cache cleaned up. Removed oldest entry: ${oldestKey}`);
    }
}

// Utility functions for cleanup
export function clearCache(): void {
    cache.clear();
    pendingRequests.clear();
    console.log('Cache and pending requests cleared');
}

export function getCacheStats(): { size: number; duration: number; pendingRequests: number } {
    return {
        size: cache.size,
        duration: CACHE_DURATION,
        pendingRequests: pendingRequests.size
    };
}

export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        console.log('Browser instance closed');
    }
}

// Clean up resources on process exit
process.on('exit', () => {
    if (browserInstance) {
        browserInstance.close().catch(console.error);
    }
});

process.on('SIGINT', async () => {
    await closeBrowser();
    process.exit(0);
});

export function buildLinkedInSearchUrl(jobTitle: string, location?: string): string {
    // Try guest jobs search URL which is more accessible
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const params = new URLSearchParams();
    
    if (jobTitle) {
        params.append('keywords', jobTitle);
    }
    if (location) {
        params.append('location', location);
    }
    
    // Add guest parameters that might help with access
    params.append('f_TPR', 'r604800'); // Jobs posted in last week
    params.append('position', '1');
    params.append('pageNum', '0');
    
    return `${baseUrl}?${params.toString()}`;
}

export default async function scrape(url: string): Promise<string> {
    // Check cache first
    const cachedResult = getCachedResult(url);
    if (cachedResult) {
        return cachedResult;
    }
    
    // Check if there's already a pending request for this URL
    const existingRequest = pendingRequests.get(url);
    if (existingRequest) {
        console.log('Deduplicating request for URL:', url);
        return existingRequest;
    }
    
    // Create new request and store it for deduplication
    const requestPromise = (async () => {
        try {
            // Apply rate limiting
            await waitForRateLimit();
            
            // Scrape the URL
            const result = await scrapeInternal(url);
            return result;
        } finally {
            // Remove from pending requests when done
            pendingRequests.delete(url);
        }
    })();
    
    // Store the promise for deduplication
    pendingRequests.set(url, requestPromise);
    
    return requestPromise;
}

// Internal scraping function
async function scrapeInternal(url: string): Promise<string> {
    let page;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();
        
        // Set realistic browser headers
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        });
        
        await page.setViewportSize({ width: 1280, height: 720 });
        
        console.log(`Scraping: ${url}`);
        
        // Navigate with timeout
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 2000
        });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Try to find job content
        try {
            await page.waitForSelector('.base-card, .job-search-card, .main-job-card', { timeout: 2000 });
        } catch (e) {
            console.log('Job cards not found, continuing...');
        }
        
        // Handle cookie consent if present
        try {
            const cookieButton = page.locator('button[aria-label*="Accept"], button[data-tracking-control-name*="guest"]').first();
            if (await cookieButton.isVisible({ timeout: 2000 })) {
                await cookieButton.click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            // Cookie handling is optional
        }
        
        const html = await page.content();
        console.log(`Scraped ${html.length} characters`);
        
        // Cache the result
        setCachedResult(url, html);
        
        // Save for debugging in development
        if (process.env.NODE_ENV === 'development') {
            const fs = require('fs');
            const path = require('path');
            fs.writeFileSync(path.join(process.cwd(), 'scraped.html'), html);
        }
        
        return html;
    } catch (error) {
        console.error('Scraping error:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            }
            if (error.message.includes('Timeout')) {
                throw new Error('Request timed out. The site may be blocking automated access.');
            }
        }
        
        throw new Error('Failed to scrape the webpage');
    } finally {
        if (page) {
            await page.close();
        }
    }
}