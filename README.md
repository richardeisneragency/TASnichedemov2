# TAS Custom Demo

A custom search rank checking application that uses the ScrapingDog API to check keyword rankings for specified domains.

## Features

1. **Admin Interface** (`/admin`)
   - Add/edit demo keywords and their target domains
   - Add optional search terms
   - Generate shareable display URLs
   - Automatic input focus for better UX

2. **Display Interface** (`/display`)
   - Clean presentation of search results
   - Automatic cycling through keywords
   - Real-time rank checking

3. **Rank Checking**
   - Checks both local and organic search results
   - Special handling for local business listings
   - Accurate domain matching in URLs
   - Returns best (lowest) rank found

## API Key
- ScrapingDog API Key: `67a869612a3dcebfbe03273a`

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node functions/server.js
```

3. Access the application:
- Admin interface: http://localhost:8000/admin
- Display interface: http://localhost:8000/display

## Important Files

- `admin.html/js`: Admin interface for configuring keywords and domains
- `display.html/js`: Display interface for showing search results
- `server.js`: Backend server handling API requests and rank checking
- `api-test.html`: Test page for direct API testing

## Notes

- The rank checker looks for domains in both local and organic results
- For local businesses, it checks business names in local results
- For websites, it checks domain matches in organic results
- Returns "Not found in top 100" if the domain isn't found

IMPORTANT: This is a custom version of the demo specifically configured for TAS. Do not modify without testing thoroughly.
