// Global variables
let demoKeywords = [];
let searchKeywords = [];
let rankKeywords = [];
let currentDomain = '';
let currentKeywordIndex = 0;
let typingTimer;
let cycleTimer;
let isTyping = false;

// Parse URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
        try {
            const decodedData = JSON.parse(atob(data));
            console.log('Decoded URL data:', decodedData);
            
            demoKeywords = decodedData.keywords || [];
            searchKeywords = decodedData.searchKeywords || [];
            rankKeywords = decodedData.rankKeywords || [];
            currentDomain = decodedData.domain || '';
            
            console.log('Parsed data:', {
                demoKeywords,
                searchKeywords,
                rankKeywords,
                currentDomain
            });
        } catch (e) {
            console.error('Error parsing URL data:', e);
        }
    }
}

// Update the left panel with keywords and search results
function updateKeywordLists() {
    // Update Demo Keywords section
    const demoList = document.querySelector('.keyword-list');
    if (demoList) {
        demoList.innerHTML = demoKeywords.map(entry => `
            <li class="demo-keyword" data-keyword="${entry.keyword}" data-target="${entry.target}">
                ${entry.keyword}
            </li>
        `).join('');

        // Add click handlers to demo keywords
        document.querySelectorAll('.demo-keyword').forEach(item => {
            item.addEventListener('click', () => {
                const keyword = item.dataset.keyword;
                const target = item.dataset.target;
                simulateSearch(keyword, target);
            });
        });
    }
    
    // Update search results section
    const searchResultsList = document.querySelector('.search-results-list');
    
    if (searchResultsList) {
        console.log('Updating search results with:', searchKeywords);
        
        if (searchKeywords && searchKeywords.length > 0) {
            searchResultsList.innerHTML = searchKeywords.map(entry => `
                <li class="search-results-item">
                    <div class="search-results-keyword">${entry.keyword}</div>
                    <div class="search-results-rank loading">Checking rank...</div>
                </li>
            `).join('');
            
            // Start loading ranks
            loadSearchResults();
        } else {
            searchResultsList.innerHTML = '<li class="search-results-item">No optional search terms provided</li>';
        }
    } else {
        console.error('Search results list element not found');
    }
    
    // Update rank keywords section
    const rankSection = document.querySelector('.rank-section');
    const rankList = document.querySelector('.rank-list');
    
    if (rankSection && rankList) {
        if (rankKeywords && rankKeywords.length > 0 && currentDomain) {
            rankSection.style.display = 'block';
            rankList.innerHTML = rankKeywords.map(entry => `
                <li>
                    <div class="keyword">${entry.keyword}</div>
                    <div class="rank-result">Loading rank...</div>
                </li>
            `).join('');
            
            // Start loading ranks
            loadRankResults();
        } else {
            rankSection.style.display = 'none';
        }
    }
}

// Load search results
async function loadSearchResults() {
    if (!searchKeywords || searchKeywords.length === 0) return;
    
    for (const entry of searchKeywords) {
        try {
            const rank = await checkRank(entry.keyword, currentDomain);
            // Update UI with rank
            const items = document.querySelectorAll('.search-results-item');
            for (const item of items) {
                const keywordDiv = item.querySelector('.search-results-keyword');
                if (keywordDiv && keywordDiv.textContent === entry.keyword) {
                    const rankDiv = item.querySelector('.search-results-rank');
                    if (rankDiv) {
                        rankDiv.textContent = `Rank: ${rank}`;
                        rankDiv.classList.remove('loading');
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error checking rank:', error);
        }
    }
}

// Load rank results
async function loadRankResults() {
    if (!currentDomain || !rankKeywords || !rankKeywords.length) {
        console.log('Missing data for rank results:', { currentDomain, rankKeywords });
        return;
    }
    
    console.log('Loading rank results for:', { currentDomain, rankKeywords });
    
    // Update ranks for each keyword
    for (const keyword of rankKeywords) {
        try {
            const keywordText = keyword.keyword || keyword;
            console.log('Checking rank for:', keywordText);
            
            const rank = await checkRank(keywordText, currentDomain);
            console.log('Got rank:', rank);
            
            // Find the rank result element for this keyword
            const keywordElements = document.querySelectorAll('.rank-list li');
            const keywordElement = Array.from(keywordElements).find(el => 
                el.querySelector('.keyword').textContent === keywordText
            );
            
            if (keywordElement) {
                const rankElement = keywordElement.querySelector('.rank-result');
                if (rankElement) {
                    if (rank !== 'Not found in top 100') {
                        rankElement.textContent = `Rank: ${rank}`;
                        rankElement.classList.remove('not-found');
                    } else {
                        rankElement.textContent = 'Not found in top 100';
                        rankElement.classList.add('not-found');
                    }
                }
            }
        } catch (e) {
            console.error('Error loading rank for keyword:', keyword, e);
            // Find and update the rank element with error state
            const keywordElements = document.querySelectorAll('.rank-list li');
            const keywordElement = Array.from(keywordElements).find(el => 
                el.querySelector('.keyword').textContent === (keyword.keyword || keyword)
            );
            if (keywordElement) {
                const rankElement = keywordElement.querySelector('.rank-result');
                if (rankElement) {
                    rankElement.textContent = 'Error checking rank';
                    rankElement.classList.add('not-found');
                }
            }
        }
    }
}

// Check rank for a keyword and domain
async function checkRank(keyword, domain) {
    console.log('=== Checking rank ===');
    console.log('Params:', { keyword, domain });
    
    try {
        // Make sure we have valid input
        if (!keyword || !domain) {
            throw new Error('Missing keyword or domain');
        }

        // Clean up the domain
        const cleanDomain = domain.toLowerCase()
            .replace(/^https?:\/\/(www\.)?/, '')
            .replace(/\/$/, '')
            .trim();

        // Use absolute URL to avoid redirect issues
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/.netlify/functions/server?keyword=${encodeURIComponent(keyword)}&domain=${encodeURIComponent(cleanDomain)}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        console.log('Response status:', response.status);
        
        // Get the response text first for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }
        
        if (data.error) {
            console.error('API Error:', data.error);
            throw new Error(data.error);
        }
        
        // Log match details if available
        if (data.matchDetails) {
            console.log('Match found:', {
                type: data.matchDetails.type,
                position: data.matchDetails.position,
                title: data.matchDetails.title,
                link: data.matchDetails.link
            });
        }
        
        return data.rank;
    } catch (error) {
        console.error('Error checking rank:', error);
        throw error;
    }
}

// Simulate typing animation
function typeText(text, input, callback) {
    let i = 0;
    isTyping = true;
    input.value = '';
    
    function type() {
        if (i < text.length) {
            input.value += text.charAt(i);
            i++;
            setTimeout(type, Math.random() * 50 + 30);
        } else {
            isTyping = false;
            if (callback) callback();
        }
    }
    
    type();
}

// Show search results with animation
function showSearchResults(keyword, target) {
    const resultsContainer = document.querySelector('.search-results');
    const searchContainer = document.querySelector('.search-container');
    
    // Generate organic-looking suggestions
    const suggestions = [
        keyword,
        `${keyword} near me`,
        `${keyword} reviews`,
        target ? `${keyword} ${target}` : `${keyword} services`,
        `${keyword} cost`,
        `${keyword} companies`
    ];
    
    // Shuffle suggestions except the target
    const targetIndex = Math.floor(Math.random() * 6);
    const shuffled = suggestions.filter(s => s !== target);
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Insert target at random position if it exists
    if (target) {
        shuffled.splice(targetIndex, 0, target);
    }
    
    // Add expanded class to container
    searchContainer.classList.add('expanded');
    
    // Animate suggestions appearing
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    shuffled.slice(0, 6).forEach((suggestion, index) => {
        setTimeout(() => {
            const div = document.createElement('div');
            const isTarget = suggestion === target;
            
            if (isTarget) {
                div.innerHTML = `<a href="https://www.google.com/search?q=${encodeURIComponent(suggestion)}" 
                    target="_blank" class="search-result highlighted" style="display: block; width: 100%;">${suggestion}</a>`;
            } else {
                div.innerHTML = `<div class="search-result">${suggestion}</div>`;
            }
            
            resultsContainer.appendChild(div);
        }, index * 100);
    });
}

// Simulate a complete search
function simulateSearch(keyword, target) {
    const input = document.getElementById('searchInput');
    const resultsContainer = document.querySelector('.search-results');
    const searchContainer = document.querySelector('.search-container');
    
    // Hide previous results and remove expanded class
    resultsContainer.style.display = 'none';
    searchContainer.classList.remove('expanded');
    
    // Type the keyword
    typeText(keyword, input, () => {
        // Show search results after typing
        setTimeout(() => {
            showSearchResults(keyword, target);
        }, 300);
    });
}

// Start auto-cycling through keywords
function startKeywordCycle() {
    if (!demoKeywords.length) return;
    
    function cycleNext() {
        if (currentKeywordIndex >= demoKeywords.length) {
            currentKeywordIndex = 0;
        }
        
        const currentKeyword = demoKeywords[currentKeywordIndex];
        simulateSearch(currentKeyword.keyword, currentKeyword.target);
        currentKeywordIndex++;
        
        // Schedule next cycle
        cycleTimer = setTimeout(cycleNext, 5000);
    }
    
    // Start first cycle
    cycleNext();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, getting URL params');
    getUrlParams();
    
    console.log('Updating keyword lists');
    updateKeywordLists();
    
    // Set up search input behavior
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.querySelector('.search-results');
    
    searchInput.addEventListener('focus', () => {
        searchInput.classList.add('expanded');
        searchResults.classList.add('visible');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            searchInput.classList.remove('expanded');
            searchResults.classList.remove('visible');
        }
    });

    // Handle search result clicks
    document.querySelectorAll('.search-result').forEach(result => {
        result.addEventListener('click', () => {
            searchInput.value = result.textContent;
            searchResults.classList.remove('visible');
            searchInput.classList.remove('expanded');
        });
    });
    
    console.log('Starting keyword cycle');
    startKeywordCycle();
    
    // Add slight delay before loading ranks to ensure DOM is ready
    setTimeout(loadRankResults, 500);
});
