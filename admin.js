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
    container.innerHTML = keywordEntries.map(entry => `
        <div class="keyword-entry">
            <div class="input-group">
                <label>Keyword (what users type):</label>
                <input type="text" 
                    value="${entry.keyword}" 
                    onchange="updateEntry(${entry.id}, 'keyword', this.value)"
                    placeholder="e.g., dentist orlando fl">
            </div>
            <div class="input-group">
                <label>Target Suggestion (what appears in dropdown):</label>
                <input type="text" 
                    value="${entry.target}" 
                    onchange="updateEntry(${entry.id}, 'target', this.value)"
                    placeholder="e.g., dentist orlando fl dr smith dds">
            </div>
            <button class="remove" onclick="removeEntry(${entry.id})">Remove Entry</button>
        </div>
    `).join('');
}

function updateDemoUrl() {
    const demoUrl = document.getElementById('demoUrl');
    if (keywordEntries.length === 0) {
        demoUrl.value = '';
        return;
    }

    const data = {
        keywords: keywordEntries.map(entry => ({
            k: entry.keyword,
            t: entry.target
        }))
    };

    const baseUrl = window.location.href.replace('admin.html', 'index.html');
    demoUrl.value = `${baseUrl}?data=${encodeURIComponent(JSON.stringify(data))}`;
}

function copyUrl() {
    const demoUrl = document.getElementById('demoUrl');
    if (!demoUrl.value) {
        alert('Please add at least one keyword pair first');
        return;
    }

    navigator.clipboard.writeText(demoUrl.value).then(() => {
        alert('Demo URL copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        alert('Failed to copy URL. Please select and copy manually.');
    });
}

// Add initial entry and set up the page
document.addEventListener('DOMContentLoaded', () => {
    addKeywordEntry();
});
