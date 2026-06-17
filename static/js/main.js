// Global Application State
let appState = {
    releases: [],
    selectedReleaseId: null,
    activeCategory: 'all',
    searchQuery: ''
};

// DOM Elements
const notesList = document.getElementById('notes-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const visibleCount = document.getElementById('visible-count');
const lastSyncTime = document.getElementById('last-sync-time');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const exportCsvBtn = document.getElementById('export-csv-btn');
const searchInput = document.getElementById('search-input');
const categoryPills = document.getElementById('category-pills');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Composer DOM Elements
const selectedMeta = document.getElementById('selected-meta');
const composerBadge = document.getElementById('composer-badge');
const composerDate = document.getElementById('composer-date');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const charProgress = document.getElementById('char-progress');
const tweetBtn = document.getElementById('tweet-btn');
const copyBtn = document.getElementById('copy-btn');

// Live Preview DOM Elements
const mockTweetText = document.getElementById('mock-tweet-text');
const mockTweetDate = document.getElementById('mock-tweet-date');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
    updateMockDate();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });

    // Export CSV button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Live search input
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().trim();
        filterAndRenderReleases();
    });

    // Category pills
    categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;

        // Toggle active pill
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        appState.activeCategory = pill.dataset.category.toLowerCase();
        filterAndRenderReleases();
    });

    // Tweet Composer textarea edits
    tweetTextarea.addEventListener('input', (e) => {
        updateTweetComposer(e.target.value);
    });

    // Copy to clipboard button
    copyBtn.addEventListener('click', copyTweetToClipboard);
}

// Fetch releases from local Flask API
async function fetchReleases(forceRefresh = false) {
    try {
        // Show loading state
        toggleLoading(true);
        refreshBtn.disabled = true;
        refreshIcon.classList.add('spin-animation');

        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.releases)) {
            appState.releases = data.releases;
            
            // Update last sync time badge
            const syncTime = new Date(data.last_fetch * 1000);
            lastSyncTime.textContent = syncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                                       ' ' + syncTime.toLocaleDateString();
            
            filterAndRenderReleases();
            
            // Auto-select the first item if none selected and items exist
            if (data.releases.length > 0 && !appState.selectedReleaseId) {
                selectRelease(data.releases[0].id);
            }
        } else {
            showToast('Failed to sync release notes', 'error');
            toggleLoading(false);
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showToast('Network error while syncing details', 'error');
        toggleLoading(false);
        emptyState.classList.remove('hidden');
    } finally {
        refreshIcon.classList.remove('spin-animation');
        refreshBtn.disabled = false;
    }
}

// Filter release notes based on search query and active category pill
function filterAndRenderReleases() {
    const filtered = appState.releases.filter(item => {
        const matchesCategory = appState.activeCategory === 'all' || 
                                item.type.toLowerCase() === appState.activeCategory;
        
        const textToSearch = `${item.type} ${item.date} ${item.text}`.toLowerCase();
        const matchesSearch = textToSearch.includes(appState.searchQuery);
        
        return matchesCategory && matchesSearch;
    });

    renderReleases(filtered);
    visibleCount.textContent = filtered.length;
}

// Render filtered release cards in notes list
function renderReleases(items) {
    // Clear list
    notesList.querySelectorAll('.note-card').forEach(card => card.remove());
    toggleLoading(false);

    if (items.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `note-card note-card-animate ${appState.selectedReleaseId === item.id ? 'selected' : ''}`;
        card.style.animationDelay = `${index * 0.04}s`;
        card.dataset.id = item.id;
        
        // Find suitable icon for release note date
        const dateIcon = '<i class="fa-regular fa-calendar-check"></i>';
        
        // Define badge class based on note category
        const typeLower = item.type.toLowerCase();
        let badgeClass = 'badge-update';
        if (['feature', 'announcement', 'issue', 'fix', 'deprecated'].includes(typeLower)) {
            badgeClass = `badge-${typeLower}`;
        }

        card.innerHTML = `
            <div class="card-top">
                <span class="card-date">${dateIcon} ${item.date}</span>
                <div class="card-actions">
                    <button class="card-copy-btn" title="Copy note text">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <span class="badge ${badgeClass}">${item.type}</span>
                </div>
            </div>
            <div class="card-content">
                ${item.html}
            </div>
            <div class="select-indicator">
                <i class="fa-solid fa-check"></i>
            </div>
        `;

        // Copy button handler (stops propagation to prevent select-card action)
        const cBtn = card.querySelector('.card-copy-btn');
        if (cBtn) {
            cBtn.addEventListener('click', (e) => {
                copyIndividualCardText(item.id, e);
            });
        }

        card.addEventListener('click', () => {
            selectRelease(item.id);
        });

        notesList.appendChild(card);
    });
}

// Select a release card and populate the composer panel
function selectRelease(id) {
    appState.selectedReleaseId = id;
    
    // Toggle active selection state in DOM cards
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.id === id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    const selectedItem = appState.releases.find(item => item.id === id);
    if (!selectedItem) return;

    // Show Composer meta info
    selectedMeta.classList.remove('hidden');
    
    const typeLower = selectedItem.type.toLowerCase();
    composerBadge.className = 'badge';
    let badgeClass = 'badge-update';
    if (['feature', 'announcement', 'issue', 'fix', 'deprecated'].includes(typeLower)) {
        badgeClass = `badge-${typeLower}`;
    }
    composerBadge.classList.add(badgeClass);
    composerBadge.textContent = selectedItem.type;
    composerDate.textContent = selectedItem.date;

    // Update Composer input and tweet details
    tweetTextarea.value = selectedItem.tweet;
    updateTweetComposer(selectedItem.tweet);
}

// Update character counts, warning bars, live preview, and Twitter Web Intent link
function updateTweetComposer(text) {
    const len = text.length;
    charCount.textContent = len;

    // Manage progress bar & warnings
    const percentage = Math.min((len / 280) * 100, 100);
    charProgress.style.width = `${percentage}%`;

    if (len > 280) {
        charProgress.className = 'char-progress-bar danger';
        charCount.style.color = 'var(--color-deprecated)';
        tweetBtn.classList.add('disabled');
        tweetBtn.style.pointerEvents = 'none';
        tweetBtn.style.opacity = '0.5';
    } else if (len > 250) {
        charProgress.className = 'char-progress-bar warning';
        charCount.style.color = 'var(--color-issue)';
        tweetBtn.classList.remove('disabled');
        tweetBtn.style.pointerEvents = 'auto';
        tweetBtn.style.opacity = '1';
    } else {
        charProgress.className = 'char-progress-bar';
        charCount.style.color = 'var(--text-secondary)';
        tweetBtn.classList.remove('disabled');
        tweetBtn.style.pointerEvents = 'auto';
        tweetBtn.style.opacity = '1';
    }

    // Update live mock preview text
    // Style URLs/Links to look blue in mock tweet
    let previewText = text;
    // Basic URL regex replacement for preview
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    previewText = previewText.replace(urlRegex, (url) => {
        return `<span style="color: var(--twitter-color); cursor: pointer;">${url}</span>`;
    });
    
    // Style hashtag highlight
    const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
    previewText = previewText.replace(hashtagRegex, (tag) => {
        return `<span style="color: var(--twitter-color); cursor: pointer;">${tag}</span>`;
    });

    mockTweetText.innerHTML = previewText || '<span style="color: var(--text-muted)">Start writing your post inside the composer...</span>';

    // Update the dynamic Twitter Web Intent URL
    tweetBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

// Copy tweet text from composer to clipboard
function copyTweetToClipboard() {
    const textToCopy = tweetTextarea.value;
    if (!textToCopy) {
        showToast('Nothing to copy!', 'error');
        return;
    }

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('Copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            try {
                tweetTextarea.select();
                document.execCommand('copy');
                showToast('Copied to clipboard!', 'success');
            } catch (e) {
                showToast('Failed to copy text', 'error');
            }
        });
}

// Helper to show/hide loading spinner state
function toggleLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

// Trigger custom Toast Notifications
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Toast styles based on type
    if (type === 'success') {
        toast.style.backgroundColor = 'var(--color-feature)';
        toast.querySelector('i').className = 'fa-solid fa-circle-check';
        toast.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
    } else {
        toast.style.backgroundColor = 'var(--color-deprecated)';
        toast.querySelector('i').className = 'fa-solid fa-circle-exclamation';
        toast.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.3)';
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

// Formats today's date for live mock preview meta
function updateMockDate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    mockTweetDate.textContent = `${timeStr} · ${dateStr}`;
}

// Copy text of a specific release note card to clipboard
function copyIndividualCardText(id, event) {
    if (event) {
        event.stopPropagation(); // Prevent selectRelease from firing
    }
    const release = appState.releases.find(item => item.id === id);
    if (!release) return;

    // Use plain-text translation for clipboard copy
    const textToCopy = `BigQuery [${release.type}] (${release.date}): ${release.text}`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('Note copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy card text:', err);
            showToast('Failed to copy text', 'error');
        });
}

// Export visible (filtered) release notes to a CSV file download
function exportToCSV() {
    // Determine the visible (filtered) list
    const filtered = appState.releases.filter(item => {
        const matchesCategory = appState.activeCategory === 'all' || 
                                item.type.toLowerCase() === appState.activeCategory;
        
        const textToSearch = `${item.type} ${item.date} ${item.text}`.toLowerCase();
        const matchesSearch = textToSearch.includes(appState.searchQuery);
        
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        showToast('No notes visible to export!', 'error');
        return;
    }

    // Prepare CSV rows
    const headers = ['Date', 'Category', 'Links', 'Update Content'];
    const rows = filtered.map(item => {
        const date = item.date;
        const category = item.type;
        const links = item.links && item.links.length > 0 ? item.links.join('; ') : '';
        // Escape quotes in text body
        const text = item.text.replace(/"/g, '""');
        
        return [
            `"${date}"`,
            `"${category}"`,
            `"${links}"`,
            `"${text}"`
        ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename using category name and date
    const dateStr = new Date().toISOString().split('T')[0];
    const categorySuffix = appState.activeCategory !== 'all' ? `_${appState.activeCategory}` : '';
    link.href = url;
    link.setAttribute('download', `bigquery_release_notes${categorySuffix}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV export downloaded!', 'success');
}
