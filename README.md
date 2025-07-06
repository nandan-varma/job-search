# LinkedIn Job Extractor

A modern web application that extracts and displays LinkedIn job descriptions in a clean, readable format.

## Features

- 🔗 Extract job details from LinkedIn URLs
- 📝 Display complete job descriptions with formatting
- 🎨 Beautiful, responsive UI with Tailwind CSS
- ⚡ Built with Next.js 15 and TypeScript
- 🌐 Uses Cloudflare Browser Rendering for reliable scraping

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Sign up for a Cloudflare account at [https://dash.cloudflare.com/](https://dash.cloudflare.com/)

3. Enable Browser Rendering API:
   - Go to your Cloudflare dashboard
   - Navigate to "Workers & Pages" > "Browser Rendering"
   - Enable the service

4. Get your credentials:
   - **API Key**: Go to "My Profile" > "API Tokens" > "Global API Key"
   - **Account ID**: Found in the right sidebar of any zone overview page
   - **Email**: Your Cloudflare account email

5. Update `.env.local` with your actual credentials:
```env
CLOUDFLARE_EMAIL=your_email@example.com
CLOUDFLARE_API_KEY=your_global_api_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 3. Run the Application

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How to Use

1. Find a LinkedIn job posting
2. Copy the job URL (e.g., `https://www.linkedin.com/jobs/view/1234567890/`)
3. Paste the URL into the input field
4. Click "Extract" to view the job description

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Scraping**: Cloudflare Browser Rendering API
- **Parsing**: Cheerio for HTML parsing
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Project Structure

```
├── app/
│   ├── api/scrape/          # API route for scraping
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Main page component
├── components/ui/           # Reusable UI components
├── lib/
│   ├── parse.ts            # LinkedIn scraper logic
│   ├── scrape.ts           # Cloudflare Browser Rendering
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
