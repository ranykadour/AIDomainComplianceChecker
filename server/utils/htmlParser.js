import * as cheerio from 'cheerio';
import {
    MAX_TEXT_LENGTH,
    MAX_LEGAL_PAGE_LENGTH,
    COOKIE_BANNER_PATTERNS,
    COOKIE_TYPES_PATTERNS,
    ANALYTICS_PATTERNS,
    ADVERTISING_PATTERNS,
    SOCIAL_PATTERNS
} from './constants.js';

/**
 * Extract clean text content from HTML
 */
export function extractTextFromHtml(html) {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, noscript, iframe, svg, nav, footer, header, aside, form').remove();
    $('[style*="display:none"], [style*="display: none"], .hidden, [hidden]').remove();
    $('meta, link').remove();

    // Extract title and meta description
    const title = $('title').text().trim() || '';
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';

    // Try to get main content first
    let textContent = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main-content'];

    for (const selector of mainSelectors) {
        const mainContent = $(selector).text();
        if (mainContent && mainContent.trim().length > 200) {
            textContent = mainContent;
            break;
        }
    }

    // Fall back to body if no main content found
    if (!textContent || textContent.trim().length < 200) {
        textContent = $('body').text();
    }

    // Combine all text
    const fullText = `${title}\n${metaDesc}\n${ogDesc}\n${textContent}`;

    // Clean up the text
    const cleanedText = fullText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .replace(/[^\x20-\x7E\n]/g, '')
        .trim();

    return cleanedText;
}

/**
 * Extract cookie-related information from HTML
 */
export function extractCookieInfo(html) {
    const lowerHtml = html.toLowerCase();
    const cookieInfo = {
        hasCookieBanner: false,
        hasCookieConsent: false,
        cookieTypes: [],
        consentMechanism: null
    };

    // Check for cookie banner/consent
    for (const pattern of COOKIE_BANNER_PATTERNS) {
        if (lowerHtml.includes(pattern)) {
            cookieInfo.hasCookieBanner = true;
            break;
        }
    }

    // Check for consent mechanisms
    if (lowerHtml.includes('accept all') || lowerHtml.includes('accept cookies') || lowerHtml.includes('i agree')) {
        cookieInfo.hasCookieConsent = true;
    }

    // Detect consent management platforms
    if (lowerHtml.includes('onetrust')) cookieInfo.consentMechanism = 'OneTrust';
    else if (lowerHtml.includes('cookiebot')) cookieInfo.consentMechanism = 'Cookiebot';
    else if (lowerHtml.includes('trustarc')) cookieInfo.consentMechanism = 'TrustArc';
    else if (lowerHtml.includes('quantcast')) cookieInfo.consentMechanism = 'Quantcast Choice';
    else if (lowerHtml.includes('cookieconsent')) cookieInfo.consentMechanism = 'Cookie Consent';

    // Detect cookie types mentioned
    for (const [type, patterns] of Object.entries(COOKIE_TYPES_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerHtml.includes(pattern)) {
                if (!cookieInfo.cookieTypes.includes(type)) {
                    cookieInfo.cookieTypes.push(type);
                }
                break;
            }
        }
    }

    return cookieInfo;
}

/**
 * Extract third-party tracking and data collection info
 */
export function extractTrackingInfo(html) {
    const trackingInfo = {
        analytics: [],
        advertising: [],
        socialMedia: [],
        otherTrackers: [],
        dataCollection: []
    };

    const lowerHtml = html.toLowerCase();

    // Analytics trackers
    for (const [name, patterns] of Object.entries(ANALYTICS_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerHtml.includes(pattern)) {
                if (!trackingInfo.analytics.includes(name)) {
                    trackingInfo.analytics.push(name);
                }
                break;
            }
        }
    }

    // Advertising networks
    for (const [name, patterns] of Object.entries(ADVERTISING_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerHtml.includes(pattern)) {
                if (!trackingInfo.advertising.includes(name)) {
                    trackingInfo.advertising.push(name);
                }
                break;
            }
        }
    }

    // Social media widgets
    for (const [name, patterns] of Object.entries(SOCIAL_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerHtml.includes(pattern)) {
                if (!trackingInfo.socialMedia.includes(name)) {
                    trackingInfo.socialMedia.push(name);
                }
                break;
            }
        }
    }

    // Data collection indicators
    if (lowerHtml.includes('newsletter') || lowerHtml.includes('subscribe')) {
        trackingInfo.dataCollection.push('Newsletter/Email subscription');
    }
    if (lowerHtml.includes('contact form') || lowerHtml.includes('contact us')) {
        trackingInfo.dataCollection.push('Contact forms');
    }
    if (lowerHtml.includes('create account') || lowerHtml.includes('sign up') || lowerHtml.includes('register')) {
        trackingInfo.dataCollection.push('User registration');
    }
    if (lowerHtml.includes('checkout') || lowerHtml.includes('payment')) {
        trackingInfo.dataCollection.push('Payment processing');
    }
    if (lowerHtml.includes('chat') || lowerHtml.includes('intercom') || lowerHtml.includes('zendesk') || lowerHtml.includes('crisp')) {
        trackingInfo.dataCollection.push('Live chat/Support widgets');
    }

    return trackingInfo;
}

/**
 * Find legal page links in the HTML
 */
export function findLegalLinksInHtml(html, baseUrl) {
    const links = {};
    const base = new URL(baseUrl);
    const $ = cheerio.load(html);

    const patterns = {
        privacy: /privacy|datenschutz/i,
        terms: /terms|tos|conditions|agb/i,
        cookies: /cookie/i,
        gdpr: /gdpr|dsgvo|data-protection/i,
        disclaimer: /disclaimer|impressum/i
    };

    $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();

        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(href) || pattern.test(text)) {
                if (!links[type]) {
                    let fullUrl = href;
                    if (href.startsWith('/')) {
                        fullUrl = `${base.protocol}//${base.host}${href}`;
                    } else if (!href.startsWith('http')) {
                        fullUrl = `${base.protocol}//${base.host}/${href}`;
                    }
                    links[type] = fullUrl;
                }
            }
        }
    });

    return links;
}

/**
 * Extract text from legal page HTML (more focused extraction)
 */
export function extractLegalPageText(html) {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, noscript, nav, footer, header').remove();

    const text = $('body').text()
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

    return text.substring(0, MAX_LEGAL_PAGE_LENGTH);
}
