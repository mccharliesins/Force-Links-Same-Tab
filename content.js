// Store original window.open function before any site scripts can override it
const originalWindowOpen = window.open;

// Create a more bulletproof window.open override
(function() {
    'use strict';
    
    // Define the override function
    const newWindowOpen = function(url, target, features) {
        console.log('🚫 Intercepted window.open call:', { url, target, features, stack: new Error().stack });
        
        // If URL is provided, navigate to it in the same tab
        if (url && url !== 'about:blank') {
            try {
                // Handle different URL formats
                let finalUrl;
                if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
                    finalUrl = new URL(url, window.location.href).href;
                } else if (url.startsWith('http') || url.startsWith('//')) {
                    finalUrl = url;
                } else if (url.includes('.') || url.includes('?')) {
                    // Likely a relative URL or query string
                    finalUrl = new URL(url, window.location.href).href;
                } else {
                    finalUrl = url;
                }
                
                if (extensionSettings.mode === 'block') {
                    showNotification('Blocked new tab attempt', finalUrl);
                } else {
                    showNotification('Redirecting to same tab', finalUrl);
                }
            } catch (e) {
                console.warn('Error processing URL:', e);
                window.location.href = url;
            }
        }
        
        // Return a more complete mock window object
        return {
            focus: function() { console.log('Mock window focus called'); },
            blur: function() { console.log('Mock window blur called'); },
            close: function() { console.log('Mock window close called'); },
            closed: false,
            location: { 
                href: url || '',
                assign: function(u) { window.location.href = u; },
                replace: function(u) { window.location.replace(u); }
            },
            document: { write: function() {}, writeln: function() {} },
            postMessage: function() {},
            addEventListener: function() {},
            removeEventListener: function() {}
        };
    };
    
    // Override window.open multiple ways to ensure it sticks
    try {
        Object.defineProperty(window, 'open', {
            value: newWindowOpen,
            writable: false,
            configurable: false
        });
    } catch (e) {
        // Fallback if defineProperty fails
        window.open = newWindowOpen;
    }
    
    // Also override on Window prototype if possible
    try {
        if (Window.prototype.open) {
            Window.prototype.open = newWindowOpen;
        }
    } catch (e) {
        console.log('Could not override Window.prototype.open');
    }
})();

// Function to clean up links
function cleanupLinks(container = document) {
    // Remove target="_blank" and related attributes
    const links = container.querySelectorAll('a[target], area[target]');
    links.forEach(link => {
        const target = link.getAttribute('target');
        if (target === '_blank' || target === '_new' || target === 'blank') {
            link.removeAttribute('target');
        }
        
        // Also remove rel attributes that enable new tab behavior
        const rel = link.getAttribute('rel');
        if (rel) {
            const relValues = rel.split(' ').filter(val => 
                val !== 'noopener' && val !== 'noreferrer' && val !== 'external'
            );
            if (relValues.length > 0) {
                link.setAttribute('rel', relValues.join(' '));
            } else {
                link.removeAttribute('rel');
            }
        }
    });
    
    // Handle forms with target="_blank"
    const forms = container.querySelectorAll('form[target]');
    forms.forEach(form => {
        const target = form.getAttribute('target');
        if (target === '_blank' || target === '_new' || target === 'blank') {
            form.removeAttribute('target');
        }
    });
}

// Initial cleanup
cleanupLinks();

// Enhanced click event handler for ALL clickable elements (including buttons)
document.addEventListener('click', function (event) {
    console.log('🖱️ Click detected on:', event.target.tagName, event.target);
    
    let target = event.target;
    let clickedElement = target;
    
    // Traverse up to find clickable elements (links, buttons, or elements with click handlers)
    while (target && target !== document.body) {
        const tagName = target.tagName;
        
        // Handle different types of clickable elements
        if (tagName === 'A' || tagName === 'AREA') {
            // Traditional links
            const href = target.href;
            const targetAttr = target.getAttribute('target');
            const rel = target.getAttribute('rel');
            
            const opensNewTab = targetAttr === '_blank' || 
                               targetAttr === '_new' || 
                               targetAttr === 'blank' ||
                               (rel && (rel.includes('noopener') || rel.includes('external')));
            
            if (opensNewTab && href) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                if (extensionSettings.mode === 'block') {
                    showNotification('Blocked new tab link', href);
                } else {
                    showNotification('Redirecting link to same tab', href);
                }
                return false;
            }
        } 
        else if (tagName === 'BUTTON' || tagName === 'INPUT') {
            // Buttons and input elements
            
            // Look for URL in various data attributes first
            const dataHref = target.getAttribute('data-href') || 
                            target.getAttribute('data-url') ||
                            target.getAttribute('data-link') ||
                            target.getAttribute('href') ||
                            target.getAttribute('data-target-url');
            
            // Check ARIA label for new tab indicators
            const ariaLabel = target.getAttribute('aria-label') || '';
            const title = target.getAttribute('title') || '';
            const testId = target.getAttribute('data-testid') || '';
            const id = target.getAttribute('id') || '';
            
            const indicatesNewTab = ariaLabel.toLowerCase().includes('new tab') ||
                                   ariaLabel.toLowerCase().includes('new window') ||
                                   title.toLowerCase().includes('new tab') ||
                                   title.toLowerCase().includes('new window') ||
                                   testId.includes('indeedApplyButton') ||
                                   id.includes('indeedApplyButton');
            
            // If we have a direct URL, use it immediately
            if (dataHref && indicatesNewTab) {
                console.log('🔄 Direct navigation from data attribute:', dataHref);
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                window.location.href = dataHref;
                return false;
            }
            
            // For buttons that indicate new tab but don't have direct URLs,
            // let the click proceed but intercept window.open
            if (indicatesNewTab) {
                // Special handling for Indeed Apply buttons
                if (testId.includes('indeedApplyButton') || id.includes('indeedApplyButton') || 
                    target.classList.contains('css-a75pkb')) {
                    
                    console.log('🚫 Indeed Apply button detected in general handler, intercepting!');
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    
                    // Find job ID and navigate
                    const jobContainer = target.closest('[data-jk]') || target.closest('.job_seen_beacon');
                    const jobId = jobContainer?.getAttribute('data-jk');
                    
                    if (jobId) {
                        const applyUrl = `${window.location.origin}/viewjob?jk=${jobId}`;
                        console.log('🔄 General handler navigating to Indeed job:', applyUrl);
                        window.location.href = applyUrl;
                    } else {
                        // Fallback to current job if we're already on a job page
                        const urlParams = new URLSearchParams(window.location.search);
                        const currentJobId = urlParams.get('jk');
                        if (currentJobId) {
                            const applyUrl = `${window.location.origin}/viewjob?jk=${currentJobId}`;
                            console.log('🔄 Using current job ID:', applyUrl);
                            window.location.href = applyUrl;
                        }
                    }
                    return false;
                }
                
                console.log('🎯 Button indicates new tab, will intercept window.open calls');
                // Don't prevent default here - let the original handler run
                // Our window.open override will catch any new tab attempts
                
                // Set up a fallback in case window.open isn't called
                setTimeout(() => {
                    const possibleUrls = [
                        target.getAttribute('data-job-url'),
                        target.getAttribute('data-apply-url'),
                        target.getAttribute('data-jk') ? `${window.location.origin}/viewjob?jk=${target.getAttribute('data-jk')}` : null,
                        target.closest('[data-jk]')?.getAttribute('data-jk') ? `${window.location.origin}/viewjob?jk=${target.closest('[data-jk]').getAttribute('data-jk')}` : null,
                        target.closest('[data-href]')?.getAttribute('data-href'),
                        target.closest('[data-url]')?.getAttribute('data-url'),
                        target.closest('a')?.href
                    ].filter(Boolean);
                    
                    if (possibleUrls.length > 0 && window.location.href === window.location.href) {
                        console.log('🔄 Fallback navigation to:', possibleUrls[0]);
                        window.location.href = possibleUrls[0];
                    }
                }, 100); // Longer delay to let original handlers complete
                
                // Let the original click proceed
                break;
            }
        }
        
        target = target.parentElement;
    }
}, true); // Use capture phase to catch events before other handlers

// Handle mousedown events (some sites use this instead of click)
document.addEventListener('mousedown', function (event) {
    // Only handle left clicks
    if (event.button !== 0) return;
    
    let target = event.target;
    
    // Check for buttons or elements that might open new tabs
    while (target && target !== document.body) {
        const tagName = target.tagName;
        
        if (tagName === 'A' || tagName === 'AREA') {
            const targetAttr = target.getAttribute('target');
            if (targetAttr === '_blank' || targetAttr === '_new' || targetAttr === 'blank') {
                target.removeAttribute('target');
            }
        } else if (tagName === 'BUTTON' || tagName === 'INPUT') {
            // Check for new tab indicators on buttons
            const ariaLabel = target.getAttribute('aria-label') || '';
            if (ariaLabel.toLowerCase().includes('new tab') || 
                ariaLabel.toLowerCase().includes('new window')) {
                
                console.log('🚫 Mousedown on new tab button, preparing interception');
                
                // Store reference for potential click interception
                target.setAttribute('data-force-same-tab', 'true');
            }
        }
        
        target = target.parentElement;
    }
}, true);

// Additional event handlers for comprehensive coverage
['pointerdown', 'touchstart'].forEach(eventType => {
    document.addEventListener(eventType, function(event) {
        let target = event.target;
        
        while (target && target !== document.body) {
            const ariaLabel = target.getAttribute('aria-label') || '';
            const title = target.getAttribute('title') || '';
            
            if ((ariaLabel.toLowerCase().includes('new tab') || 
                 ariaLabel.toLowerCase().includes('new window') ||
                 title.toLowerCase().includes('new tab') ||
                 title.toLowerCase().includes('new window')) &&
                (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || 
                 target.tagName === 'DIV' || target.tagName === 'SPAN')) {
                
                console.log(`🚫 ${eventType} on potential new tab element:`, target);
                target.setAttribute('data-force-same-tab', 'true');
            }
            
            target = target.parentElement;
        }
    }, true);
});

// Override addEventListener to catch programmatically added event listeners
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click' && this.tagName === 'A') {
        // Only wrap link click listeners, not all elements
        const wrappedListener = function(event) {
            console.log('🎯 Wrapped link click listener called');
            
            const target = this.getAttribute('target');
            
            if (target === '_blank' || target === '_new' || target === 'blank') {
                console.log('🚫 Intercepting link click handler for new tab');
                
                // Call the original listener first
                const result = listener.call(this, event);
                
                // Then redirect in same tab
                if (this.href) {
                    event.preventDefault();
                    window.location.href = this.href;
                    return false;
                }
                
                return result;
            }
            
            // Normal execution for non-new-tab links
            return listener.call(this, event);
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
};

// Enhanced MutationObserver to handle all dynamic content
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        // Handle added nodes
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                cleanupLinks(node);
            }
        });
        
        // Handle attribute changes
        if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (target.tagName === 'A' || target.tagName === 'AREA' || target.tagName === 'FORM') {
                if (mutation.attributeName === 'target' || mutation.attributeName === 'rel') {
                    cleanupLinks(target.parentElement || document);
                }
            }
        }
    });
});

// Start observing with more comprehensive options
observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['target', 'rel', 'href']
});

// Handle page navigation events
window.addEventListener('beforeunload', function() {
    // Clean up any last-minute changes
    cleanupLinks();
});

// Site-specific handlers for known problematic sites
function addSiteSpecificHandlers() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('indeed.com')) {
        console.log('🎯 Indeed.com detected - applying specific handlers');
        
        // Indeed-specific selectors for Apply buttons - more comprehensive
        const selectors = [
            'button[data-testid="indeedApplyButton-test"]',
            'button#indeedApplyButton',
            'button[aria-label*="Apply now opens in a new tab"]',
            'button[aria-label*="new tab"]',
            'button[aria-label*="Apply now"]',
            '.jobsearch-IndeedApplyButton button',
            'button.css-a75pkb'
        ];
        
        setInterval(() => {
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(button => {
                    if (!button.hasAttribute('data-indeed-handler-added')) {
                        button.setAttribute('data-indeed-handler-added', 'true');
                        
                        console.log('🎯 Adding handler to Indeed button:', button);
                        
                        // Add click handler that intercepts before other handlers
                        button.addEventListener('click', function(e) {
                            console.log('🚫 Indeed Apply button intercepted!', this);
                            
                            // Prevent the original event completely
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            
                            // Find the job container and extract job ID
                            const jobContainer = this.closest('[data-jk]') || 
                                                this.closest('.job_seen_beacon') ||
                                                this.closest('[data-jobkey]') ||
                                                document.querySelector('[data-jk]');
                            
                            const jobId = jobContainer?.getAttribute('data-jk') || 
                                         jobContainer?.getAttribute('data-jobkey');
                            
                            console.log('🔍 Found job container:', jobContainer, 'Job ID:', jobId);
                            
                            if (jobId) {
                                const applyUrl = `${window.location.origin}/viewjob?jk=${jobId}`;
                                console.log('🔄 Navigating to Indeed job page:', applyUrl);
                                window.location.href = applyUrl;
                            } else {
                                // Fallback: try to extract from current URL or page
                                const urlParams = new URLSearchParams(window.location.search);
                                const currentJobId = urlParams.get('jk');
                                
                                if (currentJobId) {
                                    const applyUrl = `${window.location.origin}/viewjob?jk=${currentJobId}`;
                                    console.log('🔄 Using current job ID for navigation:', applyUrl);
                                    window.location.href = applyUrl;
                                } else {
                                    console.warn('⚠️ Could not find job ID for Indeed apply button');
                                    // Last resort: just reload the page
                                    window.location.reload();
                                }
                            }
                        }, true); // Use capture phase to intercept early
                        
                        // Also override any onclick attribute
                        if (button.onclick) {
                            console.log('🚫 Removing onclick from Indeed button');
                            button.onclick = null;
                        }
                        
                        // Remove any target attribute if present
                        if (button.hasAttribute('target')) {
                            button.removeAttribute('target');
                        }
                    }
                });
            });
        }, 500); // Check more frequently for Indeed
    }
    
    if (hostname.includes('linkedin.com')) {
        console.log('🎯 LinkedIn detected - applying specific handlers');
        
        setInterval(() => {
            document.querySelectorAll('a[target="_blank"], button[aria-label*="new tab"]').forEach(element => {
                element.removeAttribute('target');
                if (element.tagName === 'A' && element.href) {
                    element.addEventListener('click', function(e) {
                        e.preventDefault();
                        window.location.href = this.href;
                    }, true);
                }
            });
        }, 1000);
    }
}

// Run site-specific handlers
addSiteSpecificHandlers();

// Periodic cleanup for stubborn sites (every 2 seconds)
setInterval(function() {
    cleanupLinks();
}, 2000);

// Additional aggressive cleanup for very stubborn sites
setInterval(function() {
    // Remove any target="_blank" that might have been re-added
    document.querySelectorAll('[target="_blank"]').forEach(el => {
        el.removeAttribute('target');
    });
    
    // Mark buttons with new tab indicators
    document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(button => {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const title = button.getAttribute('title') || '';
        
        if (ariaLabel.toLowerCase().includes('new tab') || 
            ariaLabel.toLowerCase().includes('new window') ||
            title.toLowerCase().includes('new tab') ||
            title.toLowerCase().includes('new window')) {
            
            button.setAttribute('data-force-same-tab', 'true');
        }
    });
}, 5000);

// Settings management
let extensionSettings = {
    enabled: true,
    mode: 'redirect', // 'redirect' or 'block'
    enhancedJobSites: true,
    alwaysOn: [], // sites where extension always works
    alwaysOff: [] // sites where extension never works
};

let interceptedCount = 0;
const currentHostname = window.location.hostname.toLowerCase();

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get();
        extensionSettings = { ...extensionSettings, ...result };
        
        // Check if extension should run on this site
        if (!shouldRunOnCurrentSite()) {
            console.log('🚫 Extension disabled for this site:', currentHostname);
            return false;
        }
        
        console.log('✅ Extension loaded with settings:', extensionSettings);
        return true;
    } catch (error) {
        console.warn('Could not load settings, using defaults:', error);
        return true;
    }
}

// Check if extension should run on current site
function shouldRunOnCurrentSite() {
    if (!extensionSettings.enabled) {
        return false;
    }
    
    // Check alwaysOff list first (highest priority)
    if (extensionSettings.alwaysOff.some(site => currentHostname.includes(site))) {
        return false;
    }
    
    // Check alwaysOn list (second priority)
    if (extensionSettings.alwaysOn.some(site => currentHostname.includes(site))) {
        return true;
    }
    
    // Default: run on all sites
    return true;
}

// Show notification and handle different modes
function showNotification(message, url) {
    console.log(`🔄 ${message}:`, url);
    
    // Handle different modes
    if (extensionSettings.mode === 'block') {
        console.log('🚫 Block mode: Preventing navigation');
        // In block mode, we just prevent the action without navigating
        return false;
    } else {
        // Redirect mode: navigate to the URL in same tab
        if (url) {
            window.location.href = url;
        }
    }
    
    // Update statistics
    updateStats();
}

// Update statistics
async function updateStats() {
    try {
        interceptedCount++;
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || { totalInterceptions: 0, todayInterceptions: 0, lastResetDate: new Date().toDateString() };
        
        // Reset today's count if it's a new day
        const today = new Date().toDateString();
        if (stats.lastResetDate !== today) {
            stats.todayInterceptions = 0;
            stats.lastResetDate = today;
        }
        
        stats.totalInterceptions++;
        stats.todayInterceptions++;
        
        await chrome.storage.local.set({ stats });
        
        // Notify popup if open
        chrome.runtime.sendMessage({ action: 'updateStats' }).catch(() => {
            // Ignore errors if popup is not open
        });
    } catch (error) {
        console.warn('Could not update stats:', error);
    }
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSettings') {
        extensionSettings = { ...extensionSettings, ...message.settings };
        console.log('📱 Settings updated:', extensionSettings);
        
        // Reload the page if extension was disabled/enabled
        if (!shouldRunOnCurrentSite()) {
            console.log('🔄 Reloading page due to settings change');
            window.location.reload();
        }
    }
});

// Initialize extension
loadSettings().then(shouldRun => {
    if (!shouldRun) {
        return;
    }
    
    console.log('🚀 Force Links Same Tab: Enhanced script loaded with settings support');
});
