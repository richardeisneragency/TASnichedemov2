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
            <h3>Keyword Entry</h3>
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
    const validEntries = keywordEntries.filter(entry => entry.keyword && entry.target);
    if (validEntries.length === 0) {
        document.getElementById('demoUrl').textContent = 'Add keywords to generate URL';
        return;
    }

    const data = validEntries.map(entry => ({
        k: entry.keyword,
        t: entry.target
    }));
    
    const baseUrl = window.location.href.replace('admin.html', 'index.html');
    const url = `${baseUrl}?data=${encodeURIComponent(JSON.stringify(data))}`;
    document.getElementById('demoUrl').textContent = url;
}

function copyUrl() {
    const url = document.getElementById('demoUrl').textContent;
    if (url && !url.includes('Add keywords')) {
        navigator.clipboard.writeText(url).then(() => {
            const btn = document.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
}

// Add initial entry
document.addEventListener('DOMContentLoaded', () => {
    addKeywordEntry();
});
