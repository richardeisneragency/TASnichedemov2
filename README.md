# Autosuggest Demo with Rank Checking

A Google-style autosuggest demo with SEO rank checking functionality.

## Features
- Google-style search interface
- Organic autosuggest behavior
- SEO rank checking using ScrapingDog API
- Admin interface for demo creation
- Mobile-responsive design

## Netlify Deployment Instructions

1. Create a new site on Netlify
2. Connect to your GitHub repository
3. Set the following build settings:
   - Build command: `npm install`
   - Publish directory: `.`

4. Add environment variables:
   - Go to Site settings > Build & deploy > Environment
   - Add `SCRAPINGDOG_API_KEY` with your ScrapingDog API key

5. Deploy!
   - The site will automatically deploy
   - Functions will be created for the API endpoints

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

3. Visit http://localhost:3002

## Environment Variables
- `SCRAPINGDOG_API_KEY`: Your ScrapingDog API key (required for rank checking)
- `NODE_ENV`: Set to 'production' on Netlify

## API Endpoints
- `/api/rank`: Check ranking for a domain and keyword
- `/api/credits`: Check remaining ScrapingDog credits

## Notes
- The rank checker searches the top 100 Google results
- ScrapingDog credits are used for each rank check
- Rate limits apply based on your ScrapingDog plan
