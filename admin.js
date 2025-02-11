// Global variables
let demoKeywords = [];
let searchKeywords = [];
let currentDomain = '';

// Add a new keyword entry to the demo section
function addKeywordEntry() {
    const entry = document.createElement('div');
    entry.className = 'keyword-entry';
    entry.innerHTML = `
        <input type="text" placeholder="Keyword" onchange="updateKeyword(this, 'keyword')">
        <input type="text" placeholder="Target" onchange="updateKeyword(this, 'target')">
        <button class="remove" onclick="removeEntry(this)">Remove</button>
    `;
    document.getElementById('keywordEntries').appendChild(entry);
}

// Add a new search keyword entry
function addSearchKeyword() {
    const entry = document.createElement('div');
    entry.className = 'keyword-entry';
    entry.innerHTML = `
        <input type="text" placeholder="Optional Search Term" onchange="updateSearchKeyword(this)">
        <button class="remove" onclick="removeEntry(this)">Remove</button>
    `;
    document.getElementById('searchKeywords').appendChild(entry);
}

// Remove an entry
function removeEntry(button) {
    button.parentElement.remove();
    updateAllArrays();
}

// Toggle optional section visibility
function toggleOptionalSection() {
    const checkbox = document.getElementById('showOptional');
    const section = document.getElementById('searchSection');
    
    if (checkbox.checked) {
        section.classList.add('visible');
    } else {
        section.classList.remove('visible');
    }
}

// Update all arrays based on current inputs
function updateAllArrays() {
    // Update demo keywords
    demoKeywords = Array.from(document.querySelectorAll('#keywordEntries .keyword-entry')).map(entry => {
        const inputs = entry.querySelectorAll('input');
        return {
            keyword: inputs[0].value.trim(),
            target: inputs[1].value.trim()
        };
    }).filter(entry => entry.keyword);

    // Update search keywords
    searchKeywords = Array.from(document.querySelectorAll('#searchKeywords .keyword-entry input')).map(input => {
        const keyword = input.value.trim();
        return keyword ? { keyword } : null;
    }).filter(Boolean);

    console.log('Updated arrays:', {
        demoKeywords,
        searchKeywords,
        currentDomain
    });
}

// Update keyword data
function updateKeyword(input, field) {
    updateAllArrays();
}

// Update search keyword
function updateSearchKeyword(input) {
    updateAllArrays();
}

// Update domain
function updateDomain(value) {
    currentDomain = value.trim();
    console.log('Updated domain:', currentDomain);
}

// Generate and copy URL
function generateAndCopyUrl() {
    // Get domain
    const domain = document.getElementById('domain').value.trim();
    if (document.getElementById('showOptional').checked && !domain) {
        alert('Please enter a domain for the optional search terms');
        return;
    }

    // Update all arrays to ensure we have the latest data
    updateAllArrays();

    // Create data object
    const data = {
        keywords: demoKeywords
    };

    // Add optional search data if enabled
    if (document.getElementById('showOptional').checked) {
        data.searchKeywords = searchKeywords;
        data.domain = domain;
    }

    console.log('Generating URL with data:', data);

    // Convert to base64
    const base64Data = btoa(JSON.stringify(data));
    console.log('Base64 data:', base64Data);

    // Generate URL
    const url = `/display.html?data=${base64Data}`;

    // Copy to clipboard
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
        const button = document.querySelector('.generate');
        button.classList.add('success');
        setTimeout(() => button.classList.remove('success'), 2000);
        
        const notification = document.getElementById('copyNotification');
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 2000);
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        alert('Failed to copy URL to clipboard');
    });
}

// Initialize with one entry of each type
document.addEventListener('DOMContentLoaded', () => {
    addKeywordEntry();
    addSearchKeyword();
});
