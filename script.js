// DOM Elements
const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
const keywordListDiv = document.getElementById('keywordList');

// State
let currentKeywords = [];
let currentKeywordIndex = 0;
let typingInterval;

// Parse keywords from URL
function initializeKeywords() {
    console.log('Initializing keywords...');
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('d');
    
    if (demoParam) {
        try {
            // Decode base64 parameter
            const decodedData = atob(demoParam);
            console.log('Decoded data:', decodedData);
            
            const params = JSON.parse(decodedData);
            console.log('Parsed params:', params);
            
            if (Array.isArray(params)) {
                currentKeywords = params.map(p => ({ k: p.k, t: p.t }));
                console.log('Current keywords:', currentKeywords);
                
                // Display keywords and start demo
                displayKeywordList();
                if (currentKeywords.length > 0) {
                    startTypingAnimation();
                }
            } else {
                throw new Error('Invalid demo parameter format');
            }
        } catch (e) {
            console.error('Error parsing demo parameter:', e);
            currentKeywords = [];
        }
    } else {
        console.log('No demo parameter found');
    }
}

// Display keyword list
function displayKeywordList() {
    if (!keywordListDiv) {
        console.error('Keyword list div not found');
        return;
    }

    if (currentKeywords.length === 0) {
        keywordListDiv.innerHTML = '';
        return;
    }

    keywordListDiv.innerHTML = `
        <div class="keyword-section">
            <h2 class="section-title">Demo Keywords</h2>
            ${currentKeywords.map((item, index) => `
                <div class="keyword-item" onclick="selectKeyword(${index})">
                    <span class="keyword-text">${item.k}</span>
                </div>
            `).join('')}
        </div>`;
}

// Select a keyword to demonstrate
function selectKeyword(index) {
    if (index >= 0 && index < currentKeywords.length) {
        currentKeywordIndex = index;
        startTypingAnimation();
    }
}

// Start typing animation
function startTypingAnimation() {
    // Clear any existing animation
    clearInterval(typingInterval);
    searchInput.value = '';
    suggestionsDiv.style.display = 'none';
    
    const currentKeyword = currentKeywords[currentKeywordIndex].k;
    let charIndex = 0;
    
    // Type each character with a random delay
    typingInterval = setInterval(() => {
        if (charIndex < currentKeyword.length) {
            searchInput.value = currentKeyword.substring(0, charIndex + 1);
            showSuggestions(searchInput.value);
            charIndex++;
        } else {
            clearInterval(typingInterval);
            // Move to next keyword after a delay
            setTimeout(() => {
                currentKeywordIndex = (currentKeywordIndex + 1) % currentKeywords.length;
                startTypingAnimation();
            }, 3000);
        }
    }, 100 + Math.random() * 100);
}

// Show suggestions based on input
function showSuggestions(query) {
    if (!query) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    const suggestions = generateSuggestions(query);
    if (suggestions.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    suggestionsDiv.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion${suggestion.highlight ? ' highlight' : ''}" 
             onclick="searchInput.value='${suggestion.text}'">
            ${suggestion.text}
        </div>
    `).join('');
    
    suggestionsDiv.style.display = 'block';
}

// Generate suggestions for a query
function generateSuggestions(query) {
    query = query.toLowerCase();
    let suggestions = [];
    
    // Find matching target from currentKeywords
    const matchingKeyword = currentKeywords.find(k => 
        query.length > 2 && 
        k.k.toLowerCase() === query.toLowerCase()
    );

    if (matchingKeyword) {
        // Add the target suggestion with highlight
        suggestions.push({
            text: matchingKeyword.t,
            highlight: true
        });
    }

    // Add some generic suggestions
    const genericSuggestions = [
        query + " near me",
        query + " reviews",
        query + " best",
        query + " top rated",
        query + " cost",
        query + " price",
        query + " services",
        query + " company",
        query + " professional",
        query + " experienced"
    ];

    // Add some random generic suggestions
    suggestions = suggestions.concat(
        genericSuggestions
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 3) + 5)
            .map(text => ({ text, highlight: false }))
    );

    return suggestions;
}

// Handle manual input
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    clearInterval(typingInterval);
    showSuggestions(query);
});

// Make functions available globally
window.selectKeyword = selectKeyword;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing...');
    initializeKeywords();
});
