// Initialize variables
let keywords = [];
let currentKeywordIndex = 0;
let typingInterval = null;
let customData = null;

// Get DOM elements
const searchBox = document.getElementById('searchBox');
const suggestionsContainer = document.getElementById('suggestions');
const keywordList = document.getElementById('keywordInput');

// Parse URL parameters
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    if (data) {
        try {
            customData = JSON.parse(decodeURIComponent(data));
            keywords = customData.map(item => ({
                keyword: item.k,
                target: item.t
            }));
            displayKeywords();
            displayDomain();
        } catch (e) {
            console.error('Error parsing URL data:', e);
        }
    }
}

// Display keywords in the left panel
function displayKeywords() {
    if (!keywordList) return;
    
    keywordList.innerHTML = keywords.map(item => `
        <li class="keyword-item">${item.keyword}</li>
    `).join('');
}

// Display domain
function displayDomain() {
    if (customData && customData.domain) {
        const domainDiv = document.createElement('div');
        domainDiv.className = 'domain-info';
        domainDiv.innerHTML = `<strong>Domain:</strong> ${customData.domain}`;
        document.querySelector('.container').appendChild(domainDiv);
    }
}

// Type the current keyword
function typeKeyword() {
    if (currentKeywordIndex >= keywords.length) {
        currentKeywordIndex = 0;
    }

    const keyword = keywords[currentKeywordIndex].keyword;
    let currentIndex = 0;

    clearInterval(typingInterval);
    searchBox.value = '';
    suggestionsContainer.style.display = 'none';

    typingInterval = setInterval(() => {
        if (currentIndex <= keyword.length) {
            searchBox.value = keyword.substring(0, currentIndex);
            showSuggestions(searchBox.value);
            currentIndex++;
        } else {
            clearInterval(typingInterval);
            setTimeout(() => {
                currentKeywordIndex++;
                typeKeyword();
            }, 2000);
        }
    }, 200);
}

// Show suggestions based on input
function showSuggestions(input) {
    if (!input) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    const currentKeyword = keywords[currentKeywordIndex];
    if (!currentKeyword) return;

    const suggestions = [
        input,
        currentKeyword.target,
        input + ' near me',
        input + ' online',
        input + ' reviews'
    ];

    suggestionsContainer.innerHTML = suggestions
        .filter(s => s.toLowerCase().includes(input.toLowerCase()))
        .map(s => {
            const highlighted = s === currentKeyword.target ? 'highlight' : '';
            return `<div class="suggestion-item ${highlighted}">${s}</div>`;
        })
        .join('');

    suggestionsContainer.style.display = 'block';
}

// Initialize the demo
function init() {
    parseUrlParams();
    if (keywords.length > 0) {
        setTimeout(typeKeyword, 1000);
    }
}

// Start the demo
init();
