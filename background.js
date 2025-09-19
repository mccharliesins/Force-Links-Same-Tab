// Background service worker for Force Links Same Tab extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('Force Links Same Tab extension installed');
});

// Inject additional script for very stubborn sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
        // Inject additional enforcement script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Additional window.open override that runs very early
                const script = document.createElement('script');
                script.textContent = `
                    (function() {
                        const originalOpen = window.open;
                        window.open = function(url, target, features) {
                            console.log('Background script intercepted window.open:', url);
                            if (url) {
                                window.location.href = url;
                            }
                            return { focus: () => {}, close: () => {}, closed: false };
                        };
                        
                        // Override for any existing references
                        if (window.originalWindowOpen) {
                            window.originalWindowOpen = window.open;
                        }
                    })();
                `;
                (document.head || document.documentElement).appendChild(script);
                script.remove();
            }
        }).catch(() => {
            // Ignore errors for restricted pages
        });
    }
});

// Handle any runtime messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'forceNavigation') {
        // Force navigation in the same tab
        chrome.tabs.update(sender.tab.id, { url: message.url });
        sendResponse({ success: true });
    }
});
