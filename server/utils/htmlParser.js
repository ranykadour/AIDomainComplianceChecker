import * as cheerio from 'cheerio';
import {
    MAX_TEXT_LENGTH,
    MAX_LEGAL_PAGE_LENGTH,
    COOKIE_BANNER_PATTERNS,
    COOKIE_TYPES_PATTERNS,
    ANALYTICS_PATTERNS,
    ADVERTISING_PATTERNS,
    SOCIAL_PATTERNS,
    HEBREW_LEGAL_PATTERNS
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

    // Clean up the text (preserve Hebrew characters: \u0590-\u05FF)
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
        .replace(/[^\x20-\x7E\n\u0590-\u05FF]/g, '')
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

    // Check for consent mechanisms (English and Hebrew)
    const consentPhrases = [
        'accept all', 'accept cookies', 'i agree',
        'אני מסכים', 'אישור', 'קבל הכל', 'אשר עוגיות', 'מסכים לתנאים'
    ];
    if (consentPhrases.some(phrase => html.includes(phrase) || lowerHtml.includes(phrase))) {
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

    // Data collection indicators (English and Hebrew)
    if (lowerHtml.includes('newsletter') || lowerHtml.includes('subscribe') ||
        html.includes('ניוזלטר') || html.includes('הרשמה לעדכונים') || html.includes('דיוור')) {
        trackingInfo.dataCollection.push('Newsletter/Email subscription');
    }
    if (lowerHtml.includes('contact form') || lowerHtml.includes('contact us') ||
        html.includes('צור קשר') || html.includes('טופס יצירת קשר')) {
        trackingInfo.dataCollection.push('Contact forms');
    }
    if (lowerHtml.includes('create account') || lowerHtml.includes('sign up') || lowerHtml.includes('register') ||
        html.includes('הרשמה') || html.includes('צור חשבון') || html.includes('הירשם')) {
        trackingInfo.dataCollection.push('User registration');
    }
    if (lowerHtml.includes('checkout') || lowerHtml.includes('payment') ||
        html.includes('תשלום') || html.includes('קופה') || html.includes('סיום הזמנה')) {
        trackingInfo.dataCollection.push('Payment processing');
    }
    if (lowerHtml.includes('chat') || lowerHtml.includes('intercom') || lowerHtml.includes('zendesk') || lowerHtml.includes('crisp') ||
        html.includes("צ'אט") || html.includes('תמיכה')) {
        trackingInfo.dataCollection.push('Live chat/Support widgets');
    }

    return trackingInfo;
}

/**
 * Extract copyright information from HTML
 */
export function extractCopyrightInfo(html) {
    const copyrightInfo = {
        hasCopyright: false,
        hasAllRightsReserved: false,
        copyrightYear: null,
        copyrightHolder: null,
        details: []
    };

    // Look for copyright in footer specifically, then fall back to full HTML
    const $ = cheerio.load(html);
    const footerHtml = $('footer').html() || '';
    const footerText = $('footer').text() || '';
    const fullText = $('body').text() || '';

    // Combined text to search (prioritize footer)
    const searchText = footerText + ' ' + fullText;
    const searchHtml = footerHtml + ' ' + html;

    // Copyright symbol patterns
    const copyrightSymbolPatterns = [
        /©/,                           // © symbol
        /&copy;/i,                     // HTML entity
        /\(c\)/i,                      // (c) or (C)
        /copyright/i                   // word "copyright"
    ];

    // All rights reserved patterns (English and Hebrew)
    const allRightsPatterns = [
        /all\s*rights\s*reserved/i,           // English
        /כל\s*הזכויות\s*שמורות/,              // Hebrew: כל הזכויות שמורות
        /זכויות\s*שמורות/,                    // Hebrew: זכויות שמורות
        /כל\s*הזכויות\s*מוגנות/,              // Hebrew: כל הזכויות מוגנות
        /©.*\d{4}/,                           // © with year
        /\d{4}.*©/                            // Year with ©
    ];

    // Check for copyright symbol
    for (const pattern of copyrightSymbolPatterns) {
        if (pattern.test(searchHtml) || pattern.test(searchText)) {
            copyrightInfo.hasCopyright = true;
            copyrightInfo.details.push('Copyright notice found');
            break;
        }
    }

    // Check for "all rights reserved"
    for (const pattern of allRightsPatterns) {
        if (pattern.test(searchText)) {
            copyrightInfo.hasAllRightsReserved = true;
            copyrightInfo.details.push('All rights reserved notice found');
            break;
        }
    }

    // Try to extract copyright year
    const yearMatch = searchText.match(/(?:©|copyright|\(c\))\s*(\d{4})/i) ||
        searchText.match(/(\d{4})\s*(?:©|copyright)/i);
    if (yearMatch) {
        copyrightInfo.copyrightYear = yearMatch[1];
    }

    // Check in footer text specifically for better detection
    if (footerText) {
        if (/©|copyright|\(c\)|כל הזכויות|זכויות שמורות/i.test(footerText)) {
            copyrightInfo.hasCopyright = true;
            if (!copyrightInfo.details.includes('Copyright notice found')) {
                copyrightInfo.details.push('Copyright in footer');
            }
        }
    }

    return copyrightInfo;
}

/**
 * Find legal page links in the HTML (supports English, German, and Hebrew)
 */
export function findLegalLinksInHtml(html, baseUrl) {
    const links = {};
    const base = new URL(baseUrl);
    const $ = cheerio.load(html);

    // URL/href patterns (regex for path matching)
    const patterns = {
        privacy: /privacy|datenschutz|prtiyut|פרטיות/i,
        terms: /terms|tos|conditions|agb|tnaim|תנאי|תקנון/i,
        cookies: /cookie|עוגיות|קוקיז/i,
        gdpr: /gdpr|dsgvo|data-protection|הגנת-מידע/i,
        disclaimer: /disclaimer|impressum|הצהרה|ויתור/i,
        refund: /refund|return|ביטול|החזר/i,
        dmca: /dmca|copyright|זכויות-יוצרים/i
    };

    /**
     * Check if text matches Hebrew legal patterns
     */
    function matchesHebrewPattern(text, type) {
        const hebrewPatterns = HEBREW_LEGAL_PATTERNS[type];
        if (!hebrewPatterns) return false;
        return hebrewPatterns.some(pattern => text.includes(pattern));
    }

    $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        const lowerText = text.toLowerCase();

        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        for (const [type, pattern] of Object.entries(patterns)) {
            // Check URL pattern, lowercase text pattern, or Hebrew text pattern
            const matchesUrl = pattern.test(href);
            const matchesText = pattern.test(lowerText);
            const matchesHebrew = matchesHebrewPattern(text, type);

            if (matchesUrl || matchesText || matchesHebrew) {
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
