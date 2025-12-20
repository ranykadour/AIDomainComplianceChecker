import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeWithAI } from './ai.js';

const MAX_TEXT_LENGTH = 5000;

/**
 * Fetches and extracts text content from a domain's homepage
 */
export async function fetchAndExtractText(domain) {
    const url = `https://${domain}`;

    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            maxRedirects: 5
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script, style, and other non-content elements
        $('script, style, noscript, iframe, svg, nav, footer, header').remove();
        $('[style*="display:none"], [style*="display: none"], .hidden').remove();

        // Extract text content
        const textContent = $('body').text();

        // Clean up the text
        const cleanedText = textContent
            .replace(/\s+/g, ' ')           // Collapse whitespace
            .replace(/\n+/g, '\n')          // Collapse newlines
            .trim();

        // Limit text length
        const limitedText = cleanedText.substring(0, MAX_TEXT_LENGTH);

        return {
            success: true,
            text: limitedText,
            url: url,
            textLength: limitedText.length
        };

    } catch (error) {
        // Try HTTP if HTTPS fails
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            try {
                const httpUrl = `http://${domain}`;
                const response = await axios.get(httpUrl, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const $ = cheerio.load(response.data);
                $('script, style, noscript, iframe, svg').remove();

                const textContent = $('body').text()
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, MAX_TEXT_LENGTH);

                return {
                    success: true,
                    text: textContent,
                    url: httpUrl,
                    textLength: textContent.length
                };
            } catch (httpError) {
                throw new Error(`Could not fetch ${domain}: ${httpError.message}`);
            }
        }
        throw new Error(`Could not fetch ${domain}: ${error.message}`);
    }
}

/**
 * Main scan function - orchestrates fetching and analysis
 */
export async function scanDomain(domain) {
    const startTime = Date.now();

    // Step 1: Fetch and extract text
    const extraction = await fetchAndExtractText(domain);

    if (!extraction.success || !extraction.text) {
        throw new Error('Could not extract text content from the domain');
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
