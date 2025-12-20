import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_TEXT_LENGTH = 5000;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Simple domain validation
function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain) || domain.includes('.');
}

async function fetchAndExtractText(domain) {
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
                },
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

            const $ = cheerio.load(html);
            $('script, style, noscript, iframe, svg, nav, footer, header, aside, form').remove();
            $('[style*="display:none"], [style*="display: none"], .hidden, [hidden]').remove();

            let textContent = '';
            const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
            for (const selector of mainSelectors) {
                const mainContent = $(selector).text();
                if (mainContent && mainContent.trim().length > 200) {
                    textContent = mainContent;
                    break;
                }
            }

            if (!textContent || textContent.trim().length < 200) {
                textContent = $('body').text();
            }

            const title = $('title').text() || '';
            const metaDesc = $('meta[name="description"]').attr('content') || '';
            const fullText = `${title}\n${metaDesc}\n${textContent}`;

            const cleanedText = fullText
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .replace(/[^\x20-\x7E\n]/g, '')
                .trim();

            if (cleanedText.length < 50) {
                lastError = new Error('Insufficient text content extracted');
                continue;
            }

            return {
                success: true,
                text: cleanedText.substring(0, MAX_TEXT_LENGTH),
                url: url,
                textLength: Math.min(cleanedText.length, MAX_TEXT_LENGTH)
            };

        } catch (error) {
            lastError = error;
            continue;
        }
    }

    throw new Error(`Could not fetch "${domain}": ${lastError?.message || 'Unknown error'}`);
}

async function analyzeWithAI(text, domain) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return mockAnalysis(text, domain);
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a data privacy and compliance analyst. Analyze website content for privacy issues and data leaks. Respond ONLY with valid JSON in this exact format:
{
  "risk_level": "Low|Medium|High",
  "summary": "Brief summary of findings",
  "personal_data": ["list of personal data exposure issues found"],
  "data_leaks": ["list of potential data leaks found"],
  "legal_issues": ["list of legal/compliance issues found"]
}`
                    },
                    {
                        role: 'user',
                        content: `Analyze this website content from ${domain} for data privacy issues, potential data leaks, and compliance risks:\n\n${text}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            analysis.source = 'groq';
            return analysis;
        }

        return mockAnalysis(text, domain);
    } catch (error) {
        console.error('AI Analysis error:', error.message);
        return mockAnalysis(text, domain);
    }
}

function mockAnalysis(text, domain) {
    const personal_data = [];
    const data_leaks = [];
    const legal_issues = [];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
        personal_data.push(`Found ${emails.length} email address(es) exposed on the page`);
    }

    const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
        personal_data.push(`Found ${phones.length} phone number(s) visible on the page`);
    }

    const apiKeyPatterns = /(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token)[\s]*[=:]\s*['"]?[a-zA-Z0-9_-]{20,}/gi;
    if (apiKeyPatterns.test(text)) {
        data_leaks.push('Potential API keys or tokens exposed in page content');
    }

    const lowerText = text.toLowerCase();
    if (!lowerText.includes('privacy policy') && !lowerText.includes('privacy notice')) {
        legal_issues.push('No visible privacy policy link detected');
    }

    if (!lowerText.includes('cookie') && !lowerText.includes('gdpr')) {
        legal_issues.push('No cookie consent or GDPR notice detected');
    }

    let risk_level = 'Low';
    const totalIssues = personal_data.length + data_leaks.length + legal_issues.length;
    if (data_leaks.length > 0 || totalIssues >= 4) {
        risk_level = 'High';
    } else if (totalIssues >= 2) {
        risk_level = 'Medium';
    }

    return {
        risk_level,
        summary: `Analysis of ${domain} found ${totalIssues} potential issue(s).`,
        personal_data: personal_data.length ? personal_data : ['No obvious personal data exposure detected'],
        data_leaks: data_leaks.length ? data_leaks : ['No obvious data leaks detected'],
        legal_issues: legal_issues.length ? legal_issues : ['Basic legal notices appear to be in place'],
        source: 'mock'
    };
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                error: 'Domain is required',
                message: 'Please provide a domain to scan'
            });
        }

        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (!isValidDomain(cleanDomain)) {
            return res.status(400).json({
                error: 'Invalid domain',
                message: 'Please provide a valid domain name'
            });
        }

        const startTime = Date.now();
        const extraction = await fetchAndExtractText(cleanDomain);

        if (!extraction.success || !extraction.text || extraction.text.trim().length < 50) {
            throw new Error(`Could not extract meaningful text content from "${cleanDomain}".`);
        }

        const analysis = await analyzeWithAI(extraction.text, cleanDomain);
        const endTime = Date.now();

        return res.status(200).json({
            success: true,
            domain: cleanDomain,
            url: extraction.url,
            scanTime: `${((endTime - startTime) / 1000).toFixed(2)}s`,
            textAnalyzed: extraction.textLength,
            analysis: analysis,
            scannedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Scan error:', error.message);
        return res.status(500).json({
            error: 'Scan failed',
            message: error.message || 'An error occurred while scanning the domain'
        });
    }
}
