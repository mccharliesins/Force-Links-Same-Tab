// Default settings
const defaultSettings = {
    enabled: true,
    enableForAllSites: true,
    showNotifications: true,
    aggressiveMode: false,
    smartJobSites: true,
    smartSocialMedia: false,
    smartShopping: false,
    whitelist: [],
    blacklist: [],
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
        enableForAllSites: document.getElementById('enableForAllSites'),
        showNotifications: document.getElementById('showNotifications'),
        aggressiveMode: document.getElementById('aggressiveMode'),
        smartJobSites: document.getElementById('smartJobSites'),
        smartSocialMedia: document.getElementById('smartSocialMedia'),
        smartShopping: document.getElementById('smartShopping'),
        addCurrentSite: document.getElementById('addCurrentSite'),
        addCurrentSiteBlacklist: document.getElementById('addCurrentSiteBlacklist'),
        currentSiteDisplay: document.getElementById('currentSiteDisplay'),
        whitelistContainer: document.getElementById('whitelistContainer'),
        blacklistContainer: document.getElementById('blacklistContainer'),
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
        elements.enableForAllSites.checked = settings.enableForAllSites;
        elements.showNotifications.checked = settings.showNotifications;
        elements.aggressiveMode.checked = settings.aggressiveMode;
        elements.smartJobSites.checked = settings.smartJobSites;
        elements.smartSocialMedia.checked = settings.smartSocialMedia;
        elements.smartShopping.checked = settings.smartShopping;
        
        // Update site lists
        updateSiteList('whitelist', settings.whitelist);
        updateSiteList('blacklist', settings.blacklist);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        const settings = {
            enabled: elements.extensionEnabled.checked,
            enableForAllSites: elements.enableForAllSites.checked,
            showNotifications: elements.showNotifications.checked,
            aggressiveMode: elements.aggressiveMode.checked,
            smartJobSites: elements.smartJobSites.checked,
            smartSocialMedia: elements.smartSocialMedia.checked,
            smartShopping: elements.smartShopping.checked
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
            
            // Remove from opposite list if present
            const oppositeList = listType === 'whitelist' ? 'blacklist' : 'whitelist';
            await removeSiteFromList(oppositeList, site, false);
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
    // Settings checkboxes
    [
        'extensionEnabled', 'enableForAllSites', 'showNotifications', 
        'aggressiveMode', 'smartJobSites', 'smartSocialMedia', 'smartShopping'
    ].forEach(id => {
        elements[id].addEventListener('change', saveSettings);
    });
    
    // Site management buttons
    elements.addCurrentSite.addEventListener('click', async () => {
        const site = elements.currentSiteDisplay.textContent;
        if (site && site !== 'Unable to detect' && site !== 'Loading...') {
            await addSiteToList('whitelist', site);
        }
    });
    
    elements.addCurrentSiteBlacklist.addEventListener('click', async () => {
        const site = elements.currentSiteDisplay.textContent;
        if (site && site !== 'Unable to detect' && site !== 'Loading...') {
            await addSiteToList('blacklist', site);
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
