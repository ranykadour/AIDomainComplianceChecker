import express from 'express';
import { fetchAndExtractText, fetchLegalPages } from '../services/scanner.js';
import { analyzeWithAI } from '../services/ai.js';
import { isValidDomain } from '../utils/constants.js';

const router = express.Router();

/**
 * POST /api/scan
 * Main endpoint for scanning a domain for legal compliance
 */
router.post('/', async (req, res) => {
    try {
        console.log('Received scan request:', req.body);
        const { domain, siteOptions } = req.body;

        if (!domain) {
            return res.status(400).json({
                error: 'Domain is required',
                message: 'Please provide a domain to scan'
            });
        }

        // Clean and validate domain
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (!isValidDomain(cleanDomain)) {
            return res.status(400).json({
                error: 'Invalid domain',
                message: 'Please provide a valid domain name'
            });
        }

        console.log(`Scanning domain: ${cleanDomain}`);

        const startTime = Date.now();

        // Step 1: Fetch and extract text from homepage
        const extraction = await fetchAndExtractText(cleanDomain);

        if (!extraction.success || !extraction.text || extraction.text.trim().length < 50) {
            throw new Error(`Could not extract meaningful text content from "${cleanDomain}". The site may require JavaScript to render content or is blocking automated access.`);
        }

        // Step 2: Fetch legal pages
        const legalPages = await fetchLegalPages(extraction.url, extraction.html);

        // Step 3: Analyze with AI
        const analysis = await analyzeWithAI(
            extraction.text,
            cleanDomain,
            legalPages,
            extraction.cookieInfo,
            extraction.trackingInfo,
            siteOptions
        );

        const endTime = Date.now();

        // Default site options
        const defaultOptions = {
            hasPayments: false,
            collectsPersonalData: true,
            usesTracking: true,
            hasUserAccounts: false,
            targetsEU: true,
            targetsUSA: true,
            hasChildrenContent: false,
        };
        const finalSiteOptions = { ...defaultOptions, ...siteOptions };

        // Return results
        res.json({
            success: true,
            domain: cleanDomain,
            url: extraction.url,
            scanTime: `${((endTime - startTime) / 1000).toFixed(2)}s`,
            textAnalyzed: extraction.textLength,
            analysis: analysis,
            legalPages: Object.fromEntries(
                Object.entries(legalPages).map(([key, value]) => [
                    key,
                    { found: value.found, url: value.url || null }
                ])
            ),
            cookieInfo: extraction.cookieInfo,
            trackingInfo: extraction.trackingInfo,
            copyrightInfo: extraction.copyrightInfo,
            siteOptions: finalSiteOptions,
            scannedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Scan error:', error.message);
        res.status(500).json({
            error: 'Scan failed',
            message: error.message || 'An error occurred while scanning the domain'
        });
    }
});

export default router;
