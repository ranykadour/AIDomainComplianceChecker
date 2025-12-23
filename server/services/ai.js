import Groq from 'groq-sdk';

/**
 * AI Analysis Prompt - System message for legal compliance analysis
 */
const SYSTEM_PROMPT = `You are a legal compliance and data privacy expert analyst. Analyze websites for GDPR, CCPA, and general legal compliance.

IMPORTANT: The user will provide "WEBSITE CONTEXT" that describes what features their website has. Use this to adjust your analysis:
- If the site does NOT accept payments (hasPayments: false), do NOT penalize for missing refund/return policies
- If the site does NOT collect personal data (collectsPersonalData: false), be lenient on privacy policy requirements
- If the site does NOT use tracking (usesTracking: false), do NOT penalize for missing cookie consent/policy
- If the site does NOT have user accounts (hasUserAccounts: false), do NOT require account-related policies
- If the site does NOT target EU (targetsEU: false), GDPR compliance is NOT required
- If the site does NOT target USA (targetsUSA: false), CCPA compliance is NOT required
- If children cannot use the site (hasChildrenContent: false), COPPA compliance is NOT required

You must evaluate based on what actually applies:

1. SECURITY ANALYSIS:
   - Personal data exposure (emails, phones, IDs, names, addresses visible on pages)
   - Potential data leaks (API keys, passwords, internal data, debug info)
   - Security headers and HTTPS usage
   - Third-party script risks

2. LEGAL COMPLIANCE ANALYSIS (adjusted based on website context):
   - Presence and completeness of legal pages (Privacy Policy, Terms of Service, Cookie Policy)
   - GDPR compliance (only if targeting EU)
   - CCPA compliance (only if targeting USA)
   - Cookie compliance (only if using tracking/cookies)
   - E-commerce compliance (only if accepting payments)
   - Copyright notice (just needs © symbol, "All rights reserved", or Hebrew "כל הזכויות שמורות" in footer - does NOT need a separate page)

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
function buildUserPrompt(text, domain, legalPages, cookieInfo, trackingInfo, siteOptions) {
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

    // Prepare website context from options
    const defaultOptions = {
        hasPayments: false,
        collectsPersonalData: true,
        usesTracking: true,
        hasUserAccounts: false,
        targetsEU: true,
        targetsUSA: true,
        hasChildrenContent: false,
    };
    const options = { ...defaultOptions, ...siteOptions };

    const websiteContext = `
WEBSITE CONTEXT (use this to adjust compliance requirements):
- Accepts payments / E-commerce: ${options.hasPayments ? 'Yes' : 'No'}
- Collects personal data: ${options.collectsPersonalData ? 'Yes' : 'No'}
- Uses analytics/tracking: ${options.usesTracking ? 'Yes' : 'No'}
- Has user accounts: ${options.hasUserAccounts ? 'Yes' : 'No'}
- Targets EU visitors (GDPR): ${options.targetsEU ? 'Yes' : 'No'}
- Targets US visitors (CCPA): ${options.targetsUSA ? 'Yes' : 'No'}
- Children may use site (COPPA): ${options.hasChildrenContent ? 'Yes' : 'No'}`;

    return `Analyze this website for legal compliance and security:

DOMAIN: ${domain}
${websiteContext}

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
export async function analyzeWithAI(text, domain, legalPages, cookieInfo, trackingInfo, siteOptions) {
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
                { role: 'user', content: buildUserPrompt(text, domain, legalPages, cookieInfo, trackingInfo, siteOptions) }
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
