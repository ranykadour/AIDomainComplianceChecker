import axios from 'axios';
import {
    MAX_TEXT_LENGTH,
    LEGAL_PAGE_PATHS,
    getRandomUserAgent
} from '../utils/constants.js';
import {
    extractTextFromHtml,
    extractCookieInfo,
    extractTrackingInfo,
    extractCopyrightInfo,
    findLegalLinksInHtml,
    extractLegalPageText
} from '../utils/htmlParser.js';

/**
 * Generate browser-like headers
 */
function getBrowserHeaders() {
    const ua = getRandomUserAgent();
    const isChrome = ua.includes('Chrome');

    const headers = {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };

    if (isChrome) {
        headers['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        headers['Sec-Ch-Ua-Mobile'] = '?0';
        headers['Sec-Ch-Ua-Platform'] = '"Windows"';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
    }

    return headers;
}

/**
 * Fetches and extracts text content from a domain's homepage
 */
export async function fetchAndExtractText(domain) {
    const urls = [
        `https://www.${domain}`,
        `https://${domain}`,
        `http://www.${domain}`,
        `http://${domain}`
    ];

    let lastError = null;

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                timeout: 20000,
                headers: getBrowserHeaders(),
                maxRedirects: 10,
                validateStatus: (status) => status < 500,
            });

            if (response.status >= 400) {
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }

            const html = response.data;

            if (typeof html !== 'string' || html.length < 100) {
                lastError = new Error('Invalid or empty response');
                continue;
            }

            const cleanedText = extractTextFromHtml(html);

            if (cleanedText.length < 50) {
                lastError = new Error('Insufficient text content extracted');
                continue;
            }

            // Extract additional info
            const cookieInfo = extractCookieInfo(html);
            const trackingInfo = extractTrackingInfo(html);
            const copyrightInfo = extractCopyrightInfo(html);

            return {
                success: true,
                text: cleanedText.substring(0, MAX_TEXT_LENGTH),
                url: url,
                textLength: Math.min(cleanedText.length, MAX_TEXT_LENGTH),
                html: html,
                cookieInfo,
                trackingInfo,
                copyrightInfo
            };

        } catch (error) {
            lastError = error;
            continue;
        }
    }

    // Provide helpful error messages
    const errorMessage = lastError?.message || 'Unknown error';

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        throw new Error(`Domain "${domain}" not found. Please check the domain name.`);
    }
    if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        throw new Error(`Connection to "${domain}" timed out. The site may be slow or blocking requests.`);
    }
    if (errorMessage.includes('ECONNREFUSED')) {
        throw new Error(`Connection refused by "${domain}". The site may be down or blocking requests.`);
    }
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        throw new Error(`Access forbidden to "${domain}". The site is blocking automated requests.`);
    }
    if (errorMessage.includes('404')) {
        throw new Error(`Page not found on "${domain}". Please check the URL.`);
    }

    throw new Error(`Could not fetch "${domain}": ${errorMessage}`);
}

/**
 * Fetch a specific legal page
 */
async function fetchLegalPage(baseUrl, paths) {
    const base = new URL(baseUrl);

    for (const path of paths) {
        try {
            const url = `${base.protocol}//${base.host}${path}`;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                maxRedirects: 5,
                validateStatus: (status) => status < 400,
            });

            if (response.data && response.data.length > 500) {
                const text = extractLegalPageText(response.data);

                if (text.length > 200) {
                    return {
                        found: true,
                        url: url,
                        text: text,
                        path: path
                    };
                }
            }
        } catch (error) {
            continue;
        }
    }

    return { found: false };
}

/**
 * Fetch all legal pages for a domain
 */
export async function fetchLegalPages(baseUrl, html) {
    const legalPages = {
        privacy: { found: false },
        terms: { found: false },
        cookies: { found: false },
        gdpr: { found: false },
        disclaimer: { found: false },
        refund: { found: false },
        dmca: { found: false }
    };

    // First, find links in the HTML
    const foundLinks = findLegalLinksInHtml(html, baseUrl);
    const fetchPromises = [];

    // Fetch pages found in links
    for (const [type, url] of Object.entries(foundLinks)) {
        if (url) {
            fetchPromises.push(
                (async () => {
                    try {
                        const response = await axios.get(url, {
                            timeout: 10000,
                            headers: { 'User-Agent': getRandomUserAgent() },
                            maxRedirects: 5,
                            validateStatus: (status) => status < 400,
                        });

                        if (response.data && response.data.length > 500) {
                            const text = extractLegalPageText(response.data);

                            if (text.length > 200) {
                                legalPages[type] = {
                                    found: true,
                                    url: url,
                                    text: text
                                };
                            }
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                })()
            );
        }
    }

    // Try common paths for pages not found in links
    for (const [type, paths] of Object.entries(LEGAL_PAGE_PATHS)) {
        if (!foundLinks[type]) {
            fetchPromises.push(
                (async () => {
                    const result = await fetchLegalPage(baseUrl, paths);
                    if (result.found && !legalPages[type].found) {
                        legalPages[type] = result;
                    }
                })()
            );
        }
    }

    await Promise.all(fetchPromises);

    return legalPages;
}
