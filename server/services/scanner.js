import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeWithAI } from './ai.js';

const MAX_TEXT_LENGTH = 5000;

// List of user agents to rotate through
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

/**
 * Fetches and extracts text content from a domain's homepage
 */
export async function fetchAndExtractText(domain) {
    const urls = [
        `https://${domain}`,
        `https://www.${domain}`,
        `http://${domain}`,
        `http://www.${domain}`
    ];

    let lastError = null;

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                timeout: 20000,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1'
                },
                maxRedirects: 10,
                validateStatus: (status) => status < 500, // Accept 4xx to handle gracefully
            });

            // Check if we got a valid response
            if (response.status >= 400) {
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }

            const html = response.data;

            // Check if we actually got HTML content
            if (typeof html !== 'string' || html.length < 100) {
                lastError = new Error('Invalid or empty response');
                continue;
            }

            const $ = cheerio.load(html);

            // Remove script, style, and other non-content elements
            $('script, style, noscript, iframe, svg, nav, footer, header, aside, form').remove();
            $('[style*="display:none"], [style*="display: none"], .hidden, [hidden]').remove();
            $('meta, link, comment').remove();

            // Extract text from meaningful elements
            let textContent = '';

            // Try to get main content first
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

            // Also grab meta description and title for context
            const title = $('title').text() || '';
            const metaDesc = $('meta[name="description"]').attr('content') || '';
            const ogDesc = $('meta[property="og:description"]').attr('content') || '';

            // Combine all text
            const fullText = `${title}\n${metaDesc}\n${ogDesc}\n${textContent}`;

            // Clean up the text
            const cleanedText = fullText
                .replace(/\s+/g, ' ')           // Collapse whitespace
                .replace(/\n+/g, '\n')          // Collapse newlines
                .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
                .trim();

            // Check if we got meaningful content
            if (cleanedText.length < 50) {
                lastError = new Error('Insufficient text content extracted');
                continue;
            }

            // Limit text length
            const limitedText = cleanedText.substring(0, MAX_TEXT_LENGTH);

            return {
                success: true,
                text: limitedText,
                url: url,
                textLength: limitedText.length
            };

        } catch (error) {
            lastError = error;
            // Continue trying other URLs
            continue;
        }
    }

    // If all attempts failed, throw the last error
    const errorMessage = lastError?.message || 'Unknown error';

    // Provide more helpful error messages
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
 * Main scan function - orchestrates fetching and analysis
 */
export async function scanDomain(domain) {
    const startTime = Date.now();

    // Step 1: Fetch and extract text
    const extraction = await fetchAndExtractText(domain);

    if (!extraction.success || !extraction.text || extraction.text.trim().length < 50) {
        throw new Error(`Could not extract meaningful text content from "${domain}". The site may require JavaScript to render content or is blocking automated access.`);
    }

    // Step 2: Analyze with AI
    const analysis = await analyzeWithAI(extraction.text, domain);

    const endTime = Date.now();

    return {
        success: true,
        domain: domain,
        url: extraction.url,
        scanTime: `${((endTime - startTime) / 1000).toFixed(2)}s`,
        textAnalyzed: extraction.textLength,
        analysis: analysis,
        scannedAt: new Date().toISOString()
    };
}
