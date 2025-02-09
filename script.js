const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
let currentKeywords = [];
let currentKeywordIndex = 0;
let typingInterval;

// Parse keywords from URL or use defaults
function initializeKeywords() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
        try {
            const data = JSON.parse(decodeURIComponent(dataParam));
            currentKeywords = data.keywords || [];
            displayKeywordList();
            if (currentKeywords.length > 0) {
                startTypingAnimation();
            }
            // Check ranks for any rank keywords
            if (data.rankKeywords && data.rankKeywords.length > 0) {
                checkRanks(data.rankKeywords);
            }
        } catch (e) {
            console.error('Error parsing URL data:', e);
            currentKeywords = [];
        }
    }
}

function displayKeywordList() {
    const keywordListDiv = document.getElementById('keywordList');
    let html = `
        <div class="keyword-section">
            <h2 class="section-title">Demo Keywords</h2>
            ${currentKeywords.map((item, index) => `
                <div class="keyword-item" onclick="selectKeyword(${index})">
                    <span class="keyword-text">${item.k}</span>
                </div>
            `).join('')}
        </div>`;
    
    // Only add rank section if there are rank keywords
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
        try {
            const data = JSON.parse(decodeURIComponent(dataParam));
            if (data.rankKeywords && data.rankKeywords.length > 0) {
                html += `
                    <div id="rankSection" class="keyword-section">
                    </div>
                `;
            }
        } catch (e) {
            console.error('Error parsing URL data:', e);
        }
    }
    
    keywordListDiv.innerHTML = html;
}

function selectKeyword(index) {
    currentKeywordIndex = index;
    clearInterval(typingInterval);
    startTypingAnimation();
}

function startTypingAnimation() {
    let currentText = '';
    const targetText = currentKeywords[currentKeywordIndex].k;
    let charIndex = 0;

    // Clear previous state
    clearInterval(typingInterval);
    searchInput.value = '';
    suggestionsDiv.style.display = 'none';

    // Start typing animation
    typingInterval = setInterval(() => {
        if (charIndex < targetText.length) {
            currentText += targetText[charIndex];
            searchInput.value = currentText;
            charIndex++;
        } else {
            clearInterval(typingInterval);
            // Only show suggestions after typing is complete
            showSuggestions(targetText);
            setTimeout(() => {
                currentKeywordIndex = (currentKeywordIndex + 1) % currentKeywords.length;
                startTypingAnimation();
            }, 3000);
        }
    }, 200);
}

function showSuggestions(query) {
    // Generate suggestions including target
    const suggestions = generateSuggestions(query);
    const target = currentKeywords[currentKeywordIndex].t;
    
    // Insert target at a stable position (around 3rd or 4th position)
    const targetPosition = Math.min(3, Math.floor(suggestions.length / 2));
    suggestions.splice(targetPosition, 0, target);
    
    // First show all suggestions without highlighting
    suggestionsDiv.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item">${suggestion}</div>`
    ).join('');
    suggestionsDiv.style.display = 'block';

    // After suggestions are stable, highlight the target
    setTimeout(() => {
        suggestionsDiv.innerHTML = suggestions.map(suggestion => 
            suggestion === target ? 
            `<div class="suggestion-item highlighted" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(suggestion)}', '_blank')">${suggestion}</div>` :
            `<div class="suggestion-item">${suggestion}</div>`
        ).join('');
    }, 800);
}

function generateSuggestions(query) {
    // Common prefixes and suffixes for organic variations
    const prefixes = ['', 'best ', 'top ', 'find ', 'affordable ', 'local ', 'experienced ', 'professional ', 'trusted ', 'certified ', 'recommended '];
    const suffixes = [
        ' near me',
        ' reviews',
        ' cost',
        ' prices',
        ' services',
        ' office',
        ' consultation',
        ' appointment',
        ' hours',
        ' phone number',
        ' website',
        ' ratings',
        ' directory',
        ' finder',
        ' search',
        ' options',
        ' comparison',
        ' recommendations'
    ];

    // Generate organic variations
    let suggestions = [];
    
    // Add some prefix variations
    prefixes.forEach(prefix => {
        if (Math.random() < 0.4) { // 40% chance to add each prefix
            suggestions.push(prefix + query);
        }
    });
    
    // Add some suffix variations
    suffixes.forEach(suffix => {
        if (Math.random() < 0.3) { // 30% chance to add each suffix
            suggestions.push(query + suffix);
        }
    });
    
    // Add some prefix + suffix combinations
    for (let i = 0; i < 2; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        suggestions.push(prefix + query + suffix);
    }
    
    // Add some "what is" and "how to" variations if not too many suggestions
    if (suggestions.length < 8) {
        if (Math.random() < 0.3) suggestions.push('what is the best ' + query);
        if (Math.random() < 0.3) suggestions.push('how to choose ' + query);
        if (Math.random() < 0.3) suggestions.push('how to find ' + query);
    }
    
    // Ensure we have at least 5 suggestions
    while (suggestions.length < 5) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        suggestions.push(prefix + query + suffix);
    }
    
    // Shuffle array
    for (let i = suggestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [suggestions[i], suggestions[j]] = [suggestions[j], suggestions[i]];
    }
    
    // Return 5-7 suggestions
    return suggestions.slice(0, Math.floor(Math.random() * 3) + 5);
}

function checkRanks(rankKeywords) {
    if (!rankKeywords || !Array.isArray(rankKeywords)) {
        console.error('Invalid rankKeywords:', rankKeywords);
        return;
    }

    // First create the rank items
    const rankSection = document.getElementById('rankSection');
    if (!rankSection) {
        console.error('Rank section not found');
        return;
    }

    const rankItemsHtml = rankKeywords.map((item, idx) => `
        <div class="keyword-item">
            <span class="keyword-text">${item.keyword || ''}</span>
            <div class="rank-info loading">Checking rank...</div>
        </div>
    `).join('');

    // Append items after the title
    rankSection.innerHTML = `
        <h2 class="section-title">Current Google SEO Rank</h2>
        ${rankItemsHtml}
    `;

    // Then check ranks for each item
    const rankItems = document.querySelectorAll('#rankSection .keyword-item');
    rankKeywords.forEach(async (item, idx) => {
        if (!item || !item.keyword || !item.url) {
            console.error('Invalid rank item:', item);
            return;
        }

        const rankItem = rankItems[idx];
        if (!rankItem) {
            console.error('Rank item element not found for index:', idx);
            return;
        }

        const rankInfo = rankItem.querySelector('.rank-info');
        if (!rankInfo) {
            console.error('Rank info element not found');
            return;
        }

        try {
            const response = await fetch(`/api/rank?domain=${encodeURIComponent(item.url)}&keyword=${encodeURIComponent(item.keyword)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Rank response:', data);
            
            if (data.error) {
                rankInfo.innerHTML = `Error: ${data.error}`;
            } else if (data.rank && data.rank !== 'Not found in top results') {
                rankInfo.innerHTML = `
                    <div>Current Rank: ${data.rank}</div>
                    <div class="rank-details">
                        <small>Found at: ${data.matchedUrl || data.domain}</small>
                    </div>
                `;
            } else {
                rankInfo.innerHTML = 'Not found in top results';
            }
        } catch (error) {
            console.error('Network error:', error);
            rankInfo.textContent = 'Error checking rank';
        } finally {
            rankInfo.classList.remove('loading');
        }
    });
}

// Handle manual input
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    clearInterval(typingInterval);
    if (query && query.length > 2) {
        showSuggestions(query);
    } else {
        suggestionsDiv.style.display = 'none';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeKeywords();
});
