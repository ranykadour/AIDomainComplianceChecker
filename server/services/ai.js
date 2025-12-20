import Groq from 'groq-sdk';

const ANALYSIS_PROMPT = `Analyze the following website text for:
1. Exposure of personal data (emails, phone numbers, IDs, names, addresses)
2. Potential data leaks or sensitive information (API keys, passwords, internal data)
3. Legally problematic content (privacy violations, copyright issues, illegal content indicators)
4. Overall compliance risk level (Low / Medium / High)

Website text to analyze:
---
{TEXT}
---

Return ONLY valid JSON with this exact structure (no markdown, no explanation, no code blocks):
{
  "personal_data": ["list of found personal data items"],
  "data_leaks": ["list of potential data leak concerns"],
  "legal_issues": ["list of legal/compliance concerns"],
  "risk_level": "Low|Medium|High",
  "summary": "Brief 1-2 sentence summary of findings"
}`;

/**
 * Analyzes website text using Groq API
 */
export async function analyzeWithAI(text, domain) {
    const apiKey = process.env.GROQ_API_KEY;

    // If no API key, return mock response
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        console.log('No Groq API key configured, using mock response');
        return getMockAnalysis(text, domain);
    }

    try {
        const groq = new Groq({ apiKey });

        const prompt = ANALYSIS_PROMPT.replace('{TEXT}', text);

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a security and compliance analyst. Analyze website content for data privacy and legal compliance issues. Always respond with valid JSON only, no markdown formatting.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        let content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Clean up response - remove markdown code blocks if present
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

        // Parse JSON response
        const parsed = JSON.parse(content);

        return {
            ...parsed,
            source: 'groq'
        };

    } catch (error) {
        console.error('Groq API error:', error.message);

        // Fall back to mock response on error
        console.log('Falling back to mock response');
        return getMockAnalysis(text, domain);
    }
}

/**
 * Returns a mock analysis response for demo purposes
 */
function getMockAnalysis(text, domain) {
    // Simple pattern detection for demo
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phonePattern = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

    const emails = text.match(emailPattern) || [];
    const phones = text.match(phonePattern) || [];
    const ips = text.match(ipPattern) || [];

    const personalData = [];
    const dataLeaks = [];
    const legalIssues = [];

    // Check for personal data
    if (emails.length > 0) {
        personalData.push(`Found ${emails.length} email address(es): ${emails.slice(0, 3).join(', ')}${emails.length > 3 ? '...' : ''}`);
    }
    if (phones.length > 0) {
        personalData.push(`Found ${phones.length} phone number(s)`);
    }

    // Check for potential data leaks
    if (ips.length > 0) {
        dataLeaks.push(`Found ${ips.length} IP address(es) that might be internal`);
    }
    if (text.toLowerCase().includes('api_key') || text.toLowerCase().includes('apikey')) {
        dataLeaks.push('Possible API key reference detected');
    }
    if (text.toLowerCase().includes('password') || text.toLowerCase().includes('secret')) {
        dataLeaks.push('Sensitive keyword detected (password/secret reference)');
    }

    // Check for legal issues
    if (!text.toLowerCase().includes('privacy') && !text.toLowerCase().includes('cookie')) {
        legalIssues.push('No visible privacy policy or cookie notice detected');
    }
    if (text.toLowerCase().includes('©') || text.toLowerCase().includes('copyright')) {
        // This is actually good, but for demo we note it
    } else {
        legalIssues.push('No copyright notice found');
    }

    // Calculate risk level
    let riskLevel = 'Low';
    const totalIssues = personalData.length + dataLeaks.length + legalIssues.length;

    if (totalIssues >= 4) {
        riskLevel = 'High';
    } else if (totalIssues >= 2) {
        riskLevel = 'Medium';
    }

    // If nothing found, add default message
    if (personalData.length === 0) {
        personalData.push('No obvious personal data exposure detected');
    }
    if (dataLeaks.length === 0) {
        dataLeaks.push('No obvious data leaks detected');
    }
    if (legalIssues.length === 0) {
        legalIssues.push('Basic compliance elements appear to be in place');
    }

    return {
        personal_data: personalData,
        data_leaks: dataLeaks,
        legal_issues: legalIssues,
        risk_level: riskLevel,
        summary: `Scanned ${domain} homepage. Found ${totalIssues} potential issue(s). Risk level: ${riskLevel}.`,
        source: 'mock'
    };
}
