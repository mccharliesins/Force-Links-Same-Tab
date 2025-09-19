# Force Links Same Tab

A comprehensive Chrome extension that prevents links from opening in new tabs by intercepting and redirecting them to the current tab.

## Motivation

This extension was created to solve a common browsing frustration: many websites automatically open links in new tabs, disrupting the natural browsing flow and cluttering the browser with unnecessary tabs. While new tabs can be useful in some contexts, there are many situations where users prefer to navigate within the same tab, especially when browsing job sites, reading articles, or following a linear workflow.

The extension gives users control over their browsing experience by ensuring that all navigation happens within the current tab, creating a cleaner and more focused browsing session.

## Overview

This extension ensures that all links, buttons, and clickable elements that would normally open in new tabs or windows are redirected to open in the same tab instead. It works across all websites and handles various methods that websites use to open new tabs, including traditional links, JavaScript-powered buttons, and complex web applications.

## Key Features

- **Universal Link Handling**: Processes all types of links and clickable elements across all websites
- **Dual Operation Modes**: Choose between Redirect Mode (open in same tab) or Block Mode (prevent new tabs completely)
- **JavaScript Interception**: Bulletproof `window.open()` override that catches all new tab attempts
- **Smart Site Management**: Easy-to-use Always ON/OFF site lists with automatic conflict resolution
- **Enhanced Job Site Support**: Specialized handling for Indeed, LinkedIn, and other job platforms
- **Dynamic Content Support**: Real-time processing of links added after page load via MutationObserver
- **Professional Settings Interface**: Beautiful popup with intuitive controls and real-time statistics
- **Proper Disable Functionality**: Complete deactivation when disabled - no interference with normal browsing

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
- `content.js` - Main content script for link interception (648+ lines)
- `background.js` - Background service worker
- `popup.html` - Settings interface layout
- `popup.css` - Professional styling for the popup
- `popup.js` - Settings functionality and user interactions
- `ForceTabs.png` - Extension icon
- `README.md` - Documentation

## How It Works

### Dual Operation Modes
- **Redirect Mode**: Intercepts new tab attempts and redirects them to open in the same tab
- **Block Mode**: Completely prevents new tabs from opening - ideal for focused browsing sessions

### Smart Site Management
- **Always ON Sites**: Extension will always work on these sites regardless of global settings
- **Always OFF Sites**: Extension will never work on these sites - browser behaves normally
- **Automatic Conflict Resolution**: Adding a site to one list automatically removes it from the other
- **Priority System**: Always OFF > Always ON > Default behavior

### Advanced Link Processing
The extension uses multiple interception methods:
- **HTML Attribute Removal**: Removes `target="_blank"` from links and forms
- **Event Capture**: Intercepts click events in the capture phase before other handlers
- **Window.open Override**: Bulletproof JavaScript function override with multiple fallbacks
- **Dynamic Monitoring**: Real-time processing of content added after page load

### Enhanced Job Site Support
Specialized handling for career websites:
- **Indeed**: Handles Apply Now buttons with job ID extraction and URL construction
- **LinkedIn**: Processes professional network links and job applications
- **Universal Compatibility**: Works with modern single-page applications and dynamic content

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
- `storage`: Required for saving user settings and statistics

## Usage

### Quick Start
1. Click the extension icon in your Chrome toolbar
2. Choose your preferred mode (Redirect or Block)
3. Optionally add sites to Always ON or Always OFF lists
4. The extension works automatically on all other sites

### Settings Interface
- **Master Toggle**: Enable/disable the entire extension
- **Mode Selection**: 
  - **Redirect Mode**: Opens blocked links in the same tab (default)
  - **Block Mode**: Completely prevents new tabs from opening
- **Site Management**: 
  - **Always ON**: Extension will always work on these sites
  - **Always OFF**: Extension will never work on these sites
- **Statistics**: View real-time counts of intercepted links
- **Enhanced Job Sites**: Toggle specialized handling for career websites

### Expected Behavior
- **Redirect Mode**: Links that would open new tabs redirect to the same tab
- **Block Mode**: New tab attempts are completely blocked with no navigation
- **Always OFF Sites**: Browser behaves normally, new tabs open as intended
- **Disabled State**: Complete deactivation - no interference with normal browsing

### Verification
To confirm the extension is working:
1. Visit any website with external links
2. Click links that normally open new tabs
3. **Redirect Mode**: Navigation occurs in the same tab
4. **Block Mode**: No navigation occurs, tab stays on current page
5. Check browser console for detailed activity logs

## Troubleshooting

### Common Issues
- **Extension seems inactive**: Check that it's enabled in the popup settings
- **Links still open new tabs**: Try adding the site to "Always ON" list
- **Extension interfering when disabled**: Reload the page after disabling
- **Job site buttons not working**: Enable "Enhanced job sites" option
- **Settings not saving**: Check that Chrome has storage permissions enabled

### Debug Information
The extension provides console logging for development and troubleshooting. Open browser developer tools to view detailed operation logs.

## Browser Compatibility

- **Primary**: Google Chrome (Manifest V3)
- **Secondary**: Chromium-based browsers with extension support
- **Requirements**: Chrome version 88 or higher

## Version Information

**Current version: 1.0**

### What's New
- **Dual Operation Modes**: Choose between Redirect and Block modes
- **Simplified Settings Interface**: Easy-to-understand controls with visual feedback
- **Smart Site Management**: Always ON/OFF lists with automatic conflict resolution
- **Proper Disable Functionality**: Complete deactivation when disabled
- **Enhanced Statistics**: Real-time tracking of intercepted links
- **Professional UI**: Beautiful popup interface with modern design
- **Custom Icon**: Professional extension icon for better recognition

### Technical Improvements
- **Bulletproof Window.open Override**: Multiple fallback methods for maximum compatibility
- **Conditional Initialization**: Extension only runs when enabled, no interference when disabled
- **Enhanced Job Site Support**: Specialized handling for Indeed, LinkedIn, and other career sites
- **Real-time Settings Updates**: Changes apply immediately without page reload (except enable/disable)
- **Comprehensive Event Handling**: Covers click, mousedown, pointerdown, and touchstart events

This extension provides comprehensive new tab prevention while maintaining website functionality and user experience.

