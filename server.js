const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 8000;

// Enable CORS for all environments
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Disable caching for all routes
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Redirect /admin to admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Redirect root to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ScrapingDog API configuration
const SCRAPINGDOG_API_KEY = process.env.SCRAPINGDOG_API_KEY || '67a869612a3dcebfbe03273a';

// Function to normalize domain for comparison
function normalizeDomain(domain) {
    return domain.toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/+$/, '')
        .split('/')[0]
        .split(':')[0];
}

// API endpoint to check rank
app.get('/api/check-rank', async (req, res) => {
    const { keyword, domain } = req.query;
    console.log('=== Starting Rank Check ===');
    console.log(`Keyword: "${keyword}"`);
    console.log(`Domain: "${domain}"`);
    
    // Clean up the domain for comparison
    const cleanDomain = normalizeDomain(domain);
    console.log(`Clean domain for matching: "${cleanDomain}"`);

    try {
        const params = {
            api_key: SCRAPINGDOG_API_KEY,
            query: keyword,
            results: 100,
            country: 'us',
            page: 0,
            advance_search: "false"
        };

        console.log('Making API request with params:', JSON.stringify(params, null, 2));
        const response = await axios.get('https://api.scrapingdog.com/google/', { params });

        if (response.status === 200 && response.data) {
            console.log('\nAPI Response Data:', JSON.stringify(response.data, null, 2));
            
            let bestRank = -1;
            
            // Check local results first
            const localResults = response.data.local_results || [];
            console.log(`\nFound ${localResults.length} local results`);
            
            for (let i = 0; i < localResults.length; i++) {
                const result = localResults[i];
                const title = (result.title || '').toLowerCase();
                const domainLower = cleanDomain.toLowerCase();
                
                if (title.includes(domainLower)) {
                    console.log(`Found local match at position ${i + 1}:`);
                    console.log(`Title: "${result.title}"`);
                    bestRank = i + 1;
                    break;
                }
            }

            // If not found in local, check organic results
            if (bestRank === -1) {
                const organicResults = response.data.organic_results || [];
                console.log(`\nFound ${organicResults.length} organic results`);
                
                for (let i = 0; i < organicResults.length; i++) {
                    const result = organicResults[i];
                    const link = (result.link || '').toLowerCase();
                    const displayedLink = (result.displayed_link || '').toLowerCase();
                    const domainLower = cleanDomain.toLowerCase();
                    
                    if (link.includes(domainLower) || displayedLink.includes(domainLower)) {
                        console.log(`\nFound organic match at position ${i + 1}:`);
                        console.log(`Link: "${link}"`);
                        console.log(`Displayed: "${displayedLink}"`);
                        bestRank = i + 1;
                        break;
                    }
                }
            }

            if (bestRank !== -1) {
                console.log(`\nSuccess! Found domain at rank ${bestRank}`);
                res.json({ rank: bestRank });
            } else {
                console.log('\nDomain not found in results');
                res.json({ rank: 'Not found in top 100' });
            }
        } else {
            console.error('Invalid API response:', response.status, response.data);
            res.status(500).json({ error: 'Invalid API response' });
        }
    } catch (error) {
        console.error('Error checking rank:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        res.status(500).json({ error: 'Error checking rank: ' + error.message });
    }
    console.log('=== End Rank Check ===\n');
});

// API endpoint to check credits
app.get('/api/credits', async (req, res) => {
    try {
        const response = await axios.get(`https://api.scrapingdog.com/check-credits?api_key=${SCRAPINGDOG_API_KEY}`);
        
        if (response.status === 200 && response.data) {
            res.json({
                credits: response.data.available_credits || 0,
                plan: response.data.plan || 'Unknown'
            });
        } else {
            throw new Error('Invalid response from ScrapingDog');
        }
    } catch (error) {
        console.error('Error checking credits:', error);
        res.status(500).json({
            error: 'Failed to check credits'
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
