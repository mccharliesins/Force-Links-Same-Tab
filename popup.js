// Default settings
const defaultSettings = {
    enabled: true,
    enhancedJobSites: true,
    alwaysOn: [], // sites where extension always works
    alwaysOff: [], // sites where extension never works
    stats: {
        totalInterceptions: 0,
        todayInterceptions: 0,
        lastResetDate: new Date().toDateString()
    }
};

// DOM elements
let elements = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    await loadSettings();
    await loadCurrentSite();
    await loadStats();
    setupEventListeners();
});

function initializeElements() {
    elements = {
        extensionEnabled: document.getElementById('extensionEnabled'),
        statusText: document.getElementById('statusText'),
        enhancedJobSites: document.getElementById('enhancedJobSites'),
        addToAlwaysOn: document.getElementById('addToAlwaysOn'),
        addToAlwaysOff: document.getElementById('addToAlwaysOff'),
        currentSiteDisplay: document.getElementById('currentSiteDisplay'),
        alwaysOnContainer: document.getElementById('alwaysOnContainer'),
        alwaysOffContainer: document.getElementById('alwaysOffContainer'),
        totalInterceptions: document.getElementById('totalInterceptions'),
        todayInterceptions: document.getElementById('todayInterceptions'),
        activeSites: document.getElementById('activeSites'),
        resetSettings: document.getElementById('resetSettings'),
        exportSettings: document.getElementById('exportSettings')
    };
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(defaultSettings);
        const settings = { ...defaultSettings, ...result };
        
        // Update UI elements
        elements.extensionEnabled.checked = settings.enabled;
        elements.statusText.textContent = settings.enabled ? 'Active' : 'Disabled';
        elements.enhancedJobSites.checked = settings.enhancedJobSites;
        
        // Update site lists
        updateSiteList('alwaysOn', settings.alwaysOn);
        updateSiteList('alwaysOff', settings.alwaysOff);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        const settings = {
            enabled: elements.extensionEnabled.checked,
            enhancedJobSites: elements.enhancedJobSites.checked
        };
        
        await chrome.storage.sync.set(settings);
        
        // Update status text
        elements.statusText.textContent = settings.enabled ? 'Active' : 'Disabled';
        
        // Notify content scripts of settings change
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateSettings',
                    settings: settings
                }).catch(() => {
                    // Ignore errors for tabs that don't have content script
                });
            }
        });
        
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

async function loadCurrentSite() {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0]) {
            const url = new URL(tabs[0].url);
            const hostname = url.hostname;
            elements.currentSiteDisplay.textContent = hostname;
        }
    } catch (error) {
        elements.currentSiteDisplay.textContent = 'Unable to detect';
    }
}

async function loadStats() {
    try {
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || defaultSettings.stats;
        
        // Reset today's count if it's a new day
        const today = new Date().toDateString();
        if (stats.lastResetDate !== today) {
            stats.todayInterceptions = 0;
            stats.lastResetDate = today;
            await chrome.storage.local.set({ stats });
        }
        
        elements.totalInterceptions.textContent = stats.totalInterceptions.toLocaleString();
        elements.todayInterceptions.textContent = stats.todayInterceptions.toLocaleString();
        
        // Get active sites count
        const tabs = await chrome.tabs.query({});
        const activeSites = new Set();
        tabs.forEach(tab => {
            try {
                const url = new URL(tab.url);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    activeSites.add(url.hostname);
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        });
        elements.activeSites.textContent = activeSites.size;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateSiteList(type, sites) {
    const container = elements[`${type}Container`];
    
    if (!sites || sites.length === 0) {
        container.innerHTML = `<div class="empty-state">No sites in ${type}</div>`;
        return;
    }
    
    container.innerHTML = sites.map(site => `
        <div class="site-item">
            <span class="site-url">${site}</span>
            <button class="remove-site" data-site="${site}" data-type="${type}">Remove</button>
        </div>
    `).join('');
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-site').forEach(button => {
        button.addEventListener('click', async (e) => {
            const site = e.target.dataset.site;
            const listType = e.target.dataset.type;
            await removeSiteFromList(listType, site);
        });
    });
}

async function addSiteToList(listType, site) {
    try {
        const result = await chrome.storage.sync.get([listType]);
        const list = result[listType] || [];
        
        if (!list.includes(site)) {
            list.push(site);
            await chrome.storage.sync.set({ [listType]: list });
            updateSiteList(listType, list);
            
            // Automatically remove from opposite list if present
            const oppositeList = listType === 'alwaysOn' ? 'alwaysOff' : 'alwaysOn';
            await removeSiteFromList(oppositeList, site, false);
            
            // Reload the opposite list to show the change
            const oppositeResult = await chrome.storage.sync.get([oppositeList]);
            updateSiteList(oppositeList, oppositeResult[oppositeList] || []);
        }
    } catch (error) {
        console.error('Error adding site to list:', error);
    }
}

async function removeSiteFromList(listType, site, updateUI = true) {
    try {
        const result = await chrome.storage.sync.get([listType]);
        const list = result[listType] || [];
        const updatedList = list.filter(s => s !== site);
        
        await chrome.storage.sync.set({ [listType]: updatedList });
        
        if (updateUI) {
            updateSiteList(listType, updatedList);
        }
    } catch (error) {
        console.error('Error removing site from list:', error);
    }
}

function setupEventListeners() {
    // Settings controls
    elements.extensionEnabled.addEventListener('change', saveSettings);
    elements.enhancedJobSites.addEventListener('change', saveSettings);
    
    // Site management buttons
    elements.addToAlwaysOn.addEventListener('click', async () => {
        const site = elements.currentSiteDisplay.textContent;
        if (site && site !== 'Unable to detect' && site !== 'Loading...') {
            await addSiteToList('alwaysOn', site);
        }
    });
    
    elements.addToAlwaysOff.addEventListener('click', async () => {
        const site = elements.currentSiteDisplay.textContent;
        if (site && site !== 'Unable to detect' && site !== 'Loading...') {
            await addSiteToList('alwaysOff', site);
        }
    });
    
    // Reset settings button
    elements.resetSettings.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
            await chrome.storage.sync.clear();
            await chrome.storage.local.clear();
            await loadSettings();
            await loadStats();
        }
    });
    
    // Export settings button
    elements.exportSettings.addEventListener('click', async () => {
        try {
            const settings = await chrome.storage.sync.get();
            const stats = await chrome.storage.local.get();
            const exportData = { settings, stats, exportDate: new Date().toISOString() };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `force-links-same-tab-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting settings:', error);
        }
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStats') {
        loadStats();
    }
});
