const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.use(cors());
}

app.use(express.static('.'));

// ScrapingDog API configuration
const SCRAPINGDOG_API_KEY = process.env.SCRAPINGDOG_API_KEY || 'b30d00d8-b207-449e-9be5-1fe88cc5cc6f';

// Function to check rank using ScrapingDog
async function checkRankWithScrapingDog(keyword, cleanDomain) {
    const params = {
        api_key: SCRAPINGDOG_API_KEY,
        query: keyword,
        results: 100,      // Get more results for better rank checking
        country: 'us',     // US results
        page: 0,          // First page
        advance_search: "false"
    };

    console.log('Making request to ScrapingDog...');
    
    const response = await axios.get('https://api.scrapingdog.com/google/', { params });
    
    if (response.status !== 200) {
        throw new Error(`ScrapingDog error: ${response.status}`);
    }
    
    const data = response.data;
    let rank = null;
    let matchedUrl = null;

    if (data.organic_results) {
        for (const result of data.organic_results) {
            const urls = [
                result.displayed_link || '',
                result.link || ''
            ];

            for (const url of urls) {
                const resultDomain = url.toLowerCase()
                    .replace(/^https?:\/\//i, '')
                    .replace(/^www\./i, '')
                    .replace(/\/+$/, '');

                if (resultDomain.includes(cleanDomain) || cleanDomain.includes(resultDomain)) {
                    rank = result.rank;
                    matchedUrl = url;
                    break;
                }
            }

            if (rank !== null) break;
        }
    }

    return {
        rank,
        matchedUrl,
        totalResults: data.organic_results?.length || 0
    };
}

app.get('/api/rank', async (req, res) => {
    try {
        const { domain, keyword } = req.query;
        
        // Validate inputs
        if (!domain || !keyword) {
            console.error('Missing required parameters:', { domain, keyword });
            return res.status(400).json({ 
                error: 'Missing parameters', 
                details: 'Both domain and keyword are required' 
            });
        }
        
        console.log('Checking rank for:', { domain, keyword });
        
        // Clean domain - handle with or without protocol
        let cleanDomain = domain.toLowerCase();
        if (!cleanDomain.startsWith('http://') && !cleanDomain.startsWith('https://')) {
            cleanDomain = cleanDomain.replace(/^www\./, ''); // Remove www. if present
        } else {
            cleanDomain = cleanDomain.replace(/^https?:\/\/(www\.)?/, ''); // Remove protocol and www.
        }
        cleanDomain = cleanDomain.replace(/\/+$/, ''); // Remove trailing slashes
        console.log('Clean domain:', cleanDomain);

        const result = await checkRankWithScrapingDog(keyword, cleanDomain);

        return res.json({
            domain: cleanDomain,
            keyword,
            rank: result.rank || 'Not found in top results',
            matchedUrl: result.matchedUrl,
            totalResults: result.totalResults
        });

    } catch (error) {
        console.error('Error checking rank:', error);
        res.status(500).json({ 
            error: 'Failed to check rank', 
            details: error.message 
        });
    }
});

// Add credits checking endpoint
app.get('/api/credits', async (req, res) => {
    try {
        // Make request to ScrapingDog's API status endpoint
        const response = await axios.get('https://api.scrapingdog.com/api/status', {
            params: {
                api_key: SCRAPINGDOG_API_KEY
            }
        });

        if (response.status !== 200) {
            throw new Error(`ScrapingDog API error: ${response.status}`);
        }

        const data = response.data;
        console.log('Credits response:', data);

        // Extract credits from the status response
        res.json({
            credits: data.remaining_requests || data.requests_remaining || 0,
            plan: data.plan_name || data.subscription || 'Unknown',
            rawResponse: data
        });
    } catch (error) {
        console.error('Error checking credits:', error);
        res.status(500).json({ 
            error: 'Failed to check credits', 
            details: error.message 
        });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// For Netlify Functions
exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const params = event.queryStringParameters;
        const { domain, keyword } = params;

        // Validate inputs
        if (!domain || !keyword) {
            console.error('Missing required parameters:', { domain, keyword });
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Missing parameters',
                    details: 'Both domain and keyword are required'
                })
            };
        }

        // Clean domain
        let cleanDomain = domain.toLowerCase();
        if (!cleanDomain.startsWith('http://') && !cleanDomain.startsWith('https://')) {
            cleanDomain = cleanDomain.replace(/^www\./, '');
        } else {
            cleanDomain = cleanDomain.replace(/^https?:\/\/(www\.)?/, '');
        }
        cleanDomain = cleanDomain.replace(/\/+$/, '');
        console.log('Clean domain:', cleanDomain);

        const result = await checkRankWithScrapingDog(keyword, cleanDomain);

        return {
            statusCode: 200,
            body: JSON.stringify({
                domain: cleanDomain,
                keyword,
                rank: result.rank || 'Not found in top results',
                matchedUrl: result.matchedUrl,
                totalResults: result.totalResults
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to check rank',
                details: error.message
            })
        };
    }
};
