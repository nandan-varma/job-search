const fs = require('fs');
const { LinkedInScraper } = require('./lib/parse.ts');

// Read the scraped HTML file
const html = fs.readFileSync('./scraped.html', 'utf8');

// Create scraper instance
const scraper = new LinkedInScraper();

// Test the scraping
try {
    const results = scraper.scrapeSearchResults(html);
    console.log('Testing cleaned text results:');
    console.log(`Total jobs found: ${results.jobs.length}`);
    
    // Check first few jobs for asterisks
    results.jobs.slice(0, 3).forEach((job, index) => {
        console.log(`\n${index + 1}. Job Title: "${job.jobTitle}"`);
        console.log(`   Company: "${job.companyName}"`);
        console.log(`   Location: "${job.location}"`);
        console.log(`   Posted: "${job.postedTime}"`);
        console.log(`   Job Type: "${job.jobType}"`);
        
        // Check for asterisks
        const hasAsterisks = [job.jobTitle, job.companyName, job.location, job.postedTime, job.jobType]
            .some(field => field && field.includes('*'));
        
        if (hasAsterisks) {
            console.log('   ⚠️  ASTERISKS DETECTED in this job!');
        } else {
            console.log('   ✅ Clean text (no asterisks)');
        }
    });
} catch (error) {
    console.error('Error during scraping:', error);
}
