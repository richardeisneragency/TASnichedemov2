let keywordEntries = [];

function addKeywordEntry() {
    const entry = {
        id: Date.now(),
        keyword: '',
        target: ''
    };
    keywordEntries.push(entry);
    renderEntries();
    updateDemoUrl();
}

function removeEntry(id) {
    keywordEntries = keywordEntries.filter(entry => entry.id !== id);
    renderEntries();
    updateDemoUrl();
}

function updateEntry(id, field, value) {
    const entry = keywordEntries.find(e => e.id === id);
    if (entry) {
        entry[field] = value;
        updateDemoUrl();
    }
}

function renderEntries() {
    const container = document.getElementById('keywordEntries');
    if (!container) {
        console.error('Keyword entries container not found');
        return;
    }

    container.innerHTML = keywordEntries.map(entry => `
        <div class="keyword-entry">
            <div class="input-group">
                <label for="keyword-${entry.id}">Keyword (what users type)</label>
                <input type="text" 
                    id="keyword-${entry.id}" 
                    value="${entry.keyword}"
                    onchange="updateEntry(${entry.id}, 'keyword', this.value)"
                    placeholder="e.g., dentist orlando fl">
            </div>
            <div class="input-group">
                <label for="target-${entry.id}">Target (what appears in suggestions)</label>
                <input type="text" 
                    id="target-${entry.id}" 
                    value="${entry.target}"
                    onchange="updateEntry(${entry.id}, 'target', this.value)"
                    placeholder="e.g., Dr. Smith - Top Rated Orlando Dentist">
            </div>
            <button class="remove" onclick="removeEntry(${entry.id})">Remove</button>
        </div>
    `).join('');
}

function updateDemoUrl() {
    const demoUrl = document.getElementById('demoUrl');
    if (!demoUrl) {
        console.error('Demo URL input not found');
        return;
    }

    // Filter out incomplete entries
    const validEntries = keywordEntries.filter(entry => entry.keyword && entry.target);
    if (validEntries.length === 0) {
        demoUrl.value = '';
        return;
    }

    // Create the demo parameter
    const params = validEntries.map(entry => ({
        k: entry.keyword,
        t: entry.target
    }));

    // Convert to base64
    const base64Data = btoa(JSON.stringify(params));
    console.log('Generated base64:', base64Data);
    console.log('Original data:', params);

    // Generate the full URL
    const baseUrl = window.location.origin;
    demoUrl.value = `${baseUrl}/?d=${base64Data}`;
}

async function copyUrl() {
    const demoUrl = document.getElementById('demoUrl');
    if (!demoUrl || !demoUrl.value) {
        console.error('No URL to copy');
        return;
    }

    try {
        await navigator.clipboard.writeText(demoUrl.value);
        const button = document.querySelector('.url-container button');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin page loaded, initializing...');
    addKeywordEntry();
});
