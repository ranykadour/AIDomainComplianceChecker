import Groq from 'groq-sdk';

/**
 * AI Analysis Prompt - System message for legal compliance analysis
 */
const SYSTEM_PROMPT = `You are a legal compliance and data privacy expert analyst. Analyze websites for GDPR, CCPA, and general legal compliance. You must evaluate:

1. SECURITY ANALYSIS:
   - Personal data exposure (emails, phones, IDs, names, addresses visible on pages)
   - Potential data leaks (API keys, passwords, internal data, debug info)
   - Security headers and HTTPS usage
   - Third-party script risks

2. LEGAL COMPLIANCE ANALYSIS:
   - Presence and completeness of legal pages (Privacy Policy, Terms of Service, Cookie Policy)
   - GDPR compliance (consent mechanisms, data rights, DPO contact, lawful basis)
   - CCPA compliance (Do Not Sell link, consumer rights)
   - Cookie compliance (consent banner, cookie categorization, opt-out options)
   - E-commerce compliance (refund policy, return policy, shipping info)
   - Copyright/DMCA notices

3. LEGAL PAGE QUALITY CHECK (for each found legal page):
   - Check if Privacy Policy includes: data collection practices, data sharing, retention periods, user rights, contact info
   - Check if Terms of Service includes: acceptance terms, user obligations, liability limits, dispute resolution, termination
   - Check if Cookie Policy includes: types of cookies, purposes, third-party cookies, how to manage cookies

Respond ONLY with valid JSON in this exact format:
{
  "security": {
    "risk_level": "Low|Medium|High",
    "score": 0-100,
    "personal_data_exposure": ["list of issues"],
    "data_leaks": ["list of issues"],
    "third_party_risks": ["list of issues"],
    "recommendations": ["list of security recommendations"]
  },
  "legal": {
    "compliance_level": "Low|Medium|High",
    "score": 0-100,
    "pages_found": {"privacy": true/false, "terms": true/false, "cookies": true/false, "gdpr": true/false},
    "missing_pages": ["list of required but missing pages"],
    "gdpr_issues": ["list of GDPR compliance issues"],
    "ccpa_issues": ["list of CCPA compliance issues"],
    "cookie_compliance": {
      "has_banner": true/false,
      "has_consent": true/false,
      "issues": ["list of cookie compliance issues"]
    },
    "privacy_policy_issues": ["list of missing/problematic elements in privacy policy"],
    "terms_issues": ["list of missing/problematic elements in terms of service"],
    "recommendations": ["list of legal compliance recommendations"]
  },
  "tracking": {
    "analytics_tools": ["list"],
    "advertising_networks": ["list"],
    "data_collection_points": ["list"],
    "concerns": ["privacy concerns about tracking"]
  },
  "summary": "Overall compliance summary"
}`;

/**
 * Build the user prompt for AI analysis
 */
function buildUserPrompt(text, domain, legalPages, cookieInfo, trackingInfo) {
    // Prepare legal pages summary
    const legalSummary = Object.entries(legalPages)
        .map(([type, data]) => `${type}: ${data.found ? 'Found' : 'Not Found'}`)
        .join(', ');

    // Prepare tracking summary
    const trackingSummary = [
        ...trackingInfo.analytics.map(t => `Analytics: ${t}`),
        ...trackingInfo.advertising.map(t => `Advertising: ${t}`),
        ...trackingInfo.socialMedia.map(t => `Social: ${t}`)
    ].join(', ') || 'None detected';

    // Prepare legal pages text for analysis (truncated)
    const legalTexts = Object.entries(legalPages)
        .filter(([_, data]) => data.found && data.text)
        .map(([type, data]) => `=== ${type.toUpperCase()} PAGE ===\n${data.text.substring(0, 3000)}`)
        .join('\n\n');

    return `Analyze this website for legal compliance and security:

DOMAIN: ${domain}

HOMEPAGE CONTENT:
${text}

LEGAL PAGES STATUS: ${legalSummary}

COOKIE INFO:
- Cookie Banner: ${cookieInfo.hasCookieBanner ? 'Yes' : 'No'}
- Consent Mechanism: ${cookieInfo.consentMechanism || 'None detected'}
- Cookie Types Mentioned: ${cookieInfo.cookieTypes.join(', ') || 'None'}

TRACKING DETECTED: ${trackingSummary}

${legalTexts ? `\nLEGAL PAGE CONTENTS:\n${legalTexts}` : '\nNo legal pages found to analyze.'}`;
}

/**
 * Analyzes website using Groq API
 */
export async function analyzeWithAI(text, domain, legalPages, cookieInfo, trackingInfo) {
    const apiKey = process.env.GROQ_API_KEY;

    // Require API key
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('GROQ_API_KEY is required to perform analysis');
    }

    try {
        const groq = new Groq({ apiKey });

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(text, domain, legalPages, cookieInfo, trackingInfo) }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        let content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Clean up response
        content = content.trim();
        if (content.startsWith('```json')) {
            content = content.slice(7);
        } else if (content.startsWith('```')) {
            content = content.slice(3);
        }
        if (content.endsWith('```')) {
            content = content.slice(0, -3);
        }
        content = content.trim();

        const parsed = JSON.parse(content);

        return {
            ...parsed,
            source: 'groq'
        };

    } catch (error) {
        console.error('Groq API error:', error.message);
        throw error;
    }
}
