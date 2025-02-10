const express = require('express');
const cors = require('cors');
const axios = require('axios');
const serverless = require('serverless-http');

const app = express();

// Enable CORS for all environments
app.use(cors());

// ScrapingDog API configuration
const SCRAPINGDOG_API_KEY = 'b30d00d8-b207-449e-9be5-1fe88cc5cc6f';

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
        for (let i = 0; i < data.organic_results.length; i++) {
            const result = data.organic_results[i];
            const urls = [
                result.displayed_link || '',
                result.link || ''
            ];

            for (const url of urls) {
                const resultDomain = url.toLowerCase()
                    .replace(/^https?:\/\//i, '')
                    .replace(/^www\./i, '')
                    .replace(/\/+$/, '');

                if (resultDomain.includes(cleanDomain)) {
                    rank = i + 1;
                    matchedUrl = url;
                    break;
                }
            }

            if (rank !== null) break;
        }
    }

    return {
        rank: rank || 'Not found in top results',
        matchedUrl,
        domain: cleanDomain
    };
}

// API endpoint to check rank
app.get('/api/rank', async (req, res) => {
    try {
        const { domain, keyword } = req.query;
        
        if (!domain || !keyword) {
            return res.status(400).json({
                error: 'Missing required parameters'
            });
        }

        // Clean domain
        const cleanDomain = domain.toLowerCase()
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/\/+$/, '');

        const result = await checkRankWithScrapingDog(keyword, cleanDomain);
        res.json(result);

    } catch (error) {
        console.error('Error checking rank:', error);
        res.status(500).json({
            error: 'Failed to check rank'
        });
    }
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

// Export handler for Netlify Functions
exports.handler = serverless(app);
