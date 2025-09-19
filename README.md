# Force Links Same Tab

A comprehensive Chrome extension that prevents links from opening in new tabs by intercepting and redirecting them to the current tab.

## Motivation

This extension was created to solve a common browsing frustration: many websites automatically open links in new tabs, disrupting the natural browsing flow and cluttering the browser with unnecessary tabs. While new tabs can be useful in some contexts, there are many situations where users prefer to navigate within the same tab, especially when browsing job sites, reading articles, or following a linear workflow.

The extension gives users control over their browsing experience by ensuring that all navigation happens within the current tab, creating a cleaner and more focused browsing session.

## Overview

This extension ensures that all links, buttons, and clickable elements that would normally open in new tabs or windows are redirected to open in the same tab instead. It works across all websites and handles various methods that websites use to open new tabs, including traditional links, JavaScript-powered buttons, and complex web applications.

## Key Features

- **Universal Link Handling**: Processes all types of links and clickable elements
- **JavaScript Interception**: Overrides `window.open()` calls to prevent new tabs
- **Dynamic Content Support**: Handles links added after page load via MutationObserver
- **Site-Specific Optimizations**: Enhanced support for job sites like Indeed and LinkedIn
- **Button Click Handling**: Intercepts buttons that use JavaScript to open new tabs
- **Real-time Processing**: Continuously monitors and processes new content as it loads

## Installation

### Developer Mode Installation

1. Download all extension files to a folder on your computer
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle switch in the top-right corner
4. Click the "Load unpacked" button
5. Select the folder containing the extension files
6. The extension will appear in your extensions list and begin working immediately

### Files Required

Ensure your extension folder contains these files:
- `manifest.json` - Extension configuration and permissions
- `content.js` - Main content script for link interception
- `background.js` - Background service worker
- `README.md` - Documentation

## How It Works

### Link Processing
The extension identifies and processes links using multiple methods:
- Removes `target="_blank"` attributes from HTML elements
- Intercepts click events on links and buttons
- Overrides JavaScript `window.open()` function calls
- Monitors page changes for dynamically added content

### Button Handling
For complex web applications that use buttons instead of traditional links:
- Detects buttons with accessibility labels indicating new tab behavior
- Extracts URLs from data attributes and element context
- Provides fallback navigation methods when direct URLs aren't available

### Site-Specific Features
Enhanced functionality for popular websites:
- **Indeed**: Handles job application buttons and extracts job URLs
- **LinkedIn**: Processes professional network links and interactions
- **General Sites**: Universal compatibility with modern web applications

## Technical Implementation

### Core Technologies
- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Run on all web pages to process links
- **MutationObserver**: Monitors DOM changes for dynamic content
- **Event Capture**: Intercepts user interactions before default handling

### Permissions
- `activeTab`: Access to currently active browser tab
- `scripting`: Required for content script injection
- `tabs`: Needed for advanced tab management features

## Usage

The extension operates automatically once installed. No user configuration is required.

### Expected Behavior
- All links that would open new tabs now open in the same tab
- Apply buttons on job sites navigate within the current tab
- JavaScript-powered navigation is redirected appropriately
- Page functionality remains intact while preventing unwanted new tabs

### Verification
To confirm the extension is working:
1. Visit any website with external links
2. Click links that normally open new tabs
3. Observe that navigation occurs in the same tab
4. Check browser console for extension activity logs

## Troubleshooting

### Common Issues
- **Links not intercepted**: Reload the extension in Chrome extensions page
- **JavaScript errors**: Check browser console for conflict messages
- **Site-specific problems**: Verify the extension has proper permissions

### Debug Information
The extension provides console logging for development and troubleshooting. Open browser developer tools to view detailed operation logs.

## Browser Compatibility

- **Primary**: Google Chrome (Manifest V3)
- **Secondary**: Chromium-based browsers with extension support
- **Requirements**: Chrome version 88 or higher

## Version Information

Current version: 1.0

This extension provides comprehensive new tab prevention while maintaining website functionality and user experience.

