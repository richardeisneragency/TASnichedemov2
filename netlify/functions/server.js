const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Enable CORS for all environments
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '../..')));

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
router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../admin.html'));
});

// Redirect root to index.html
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

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
router.get('/api/check-rank', async (req, res) => {
    const { keyword, domain } = req.query;
    console.log('=== Starting Rank Check ===');
    console.log(`Keyword: "${keyword}"`);
    console.log(`Domain: "${domain}"`);
    
    // Clean up the domain for comparison
    const cleanDomain = normalizeDomain(domain);
    console.log(`Clean domain for matching: "${cleanDomain}"`);

    try {
        const apiKey = process.env.SCRAPINGDOG_API_KEY;
        if (!apiKey) {
            throw new Error('ScrapingDog API key not configured');
        }
        
        const params = {
            api_key: apiKey,
            query: keyword,
            results: 100,
            country: 'us',
            page: 0,
            advance_search: "false"
        };

        console.log('Making API request with params:', JSON.stringify(params, null, 2));
        const response = await axios.get('https://api.scrapingdog.com/google/', { params });
        console.log('Got ScrapingDog response:', response.status);

        if (!response.data) {
            throw new Error('No data received from ScrapingDog');
        }

        console.log('\nAPI Response Data:', JSON.stringify(response.data, null, 2));
        
        let bestRank = -1;
        let matchDetails = null;

        // Check local results first
        const localResults = response.data.local_results || [];
        console.log(`\nFound ${localResults.length} local results`);
        
        for (let i = 0; i < localResults.length; i++) {
            const result = localResults[i];
            const title = (result.title || '').toLowerCase();
            const link = (result.link || '').toLowerCase();
            const displayedLink = (result.displayed_link || '').toLowerCase();
            
            if (link.includes(cleanDomain) || 
                displayedLink.includes(cleanDomain) || 
                title.includes(cleanDomain)) {
                bestRank = i + 1;
                matchDetails = {
                    type: 'local',
                    position: bestRank,
                    title: result.title,
                    link: result.link,
                    displayed_link: result.displayed_link
                };
                console.log(`Found local match at position ${bestRank}:`);
                console.log(`Title: "${result.title}"`);
                console.log(`Link: "${result.link}"`);
                console.log(`Displayed Link: "${result.displayed_link}"`);
                break;
            }
        }

        // If not found in local, check organic results
        if (bestRank === -1) {
            const organicResults = response.data.organic_results || [];
            console.log(`\nChecking ${organicResults.length} organic results`);
            
            for (let i = 0; i < organicResults.length; i++) {
                const result = organicResults[i];
                const link = (result.link || '').toLowerCase();
                const displayedLink = (result.displayed_link || '').toLowerCase();
                const title = (result.title || '').toLowerCase();
                
                if (link.includes(cleanDomain) || 
                    displayedLink.includes(cleanDomain) || 
                    title.includes(cleanDomain)) {
                    bestRank = i + 1;
                    matchDetails = {
                        type: 'organic',
                        position: bestRank,
                        title: result.title,
                        link: result.link,
                        displayed_link: result.displayed_link
                    };
                    console.log(`Found organic match at position ${bestRank}:`);
                    console.log(`Title: "${result.title}"`);
                    console.log(`Link: "${result.link}"`);
                    console.log(`Displayed Link: "${result.displayed_link}"`);
                    break;
                }
            }
        }

        console.log('\nFinal rank:', bestRank);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rank: bestRank !== -1 ? bestRank : 'Not found in top 100',
                domain: cleanDomain,
                keyword: keyword,
                matchDetails: matchDetails
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: error.response?.status || 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Error checking rank: ' + error.message,
                details: error.response?.data
            })
        };
    }
});

// API endpoint to check credits
router.get('/api/credits', async (req, res) => {
    try {
        const apiKey = process.env.SCRAPINGDOG_API_KEY;
        if (!apiKey) {
            throw new Error('ScrapingDog API key not configured');
        }
        
        const response = await axios.get(`https://api.scrapingdog.com/check-credits?api_key=${apiKey}`);
        
        if (response.status === 200 && response.data) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credits: response.data.available_credits || 0,
                    plan: response.data.plan || 'Unknown'
                })
            };
        } else {
            throw new Error('Invalid response from ScrapingDog');
        }
    } catch (error) {
        console.error('Error checking credits:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Failed to check credits'
            })
        };
    }
});

app.use('/.netlify/functions/server', router);

// Export the serverless handler
module.exports.handler = serverless(app);
