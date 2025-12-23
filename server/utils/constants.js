// Constants used across the application

export const MAX_TEXT_LENGTH = 8000;
export const MAX_LEGAL_PAGE_LENGTH = 15000;

export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

// Common paths for legal pages
export const LEGAL_PAGE_PATHS = {
    privacy: ['/privacy', '/privacy-policy', '/privacypolicy', '/privacy.html', '/legal/privacy', '/about/privacy'],
    terms: ['/terms', '/terms-of-service', '/tos', '/terms-and-conditions', '/termsofservice', '/legal/terms', '/terms.html'],
    cookies: ['/cookies', '/cookie-policy', '/cookiepolicy', '/cookies.html', '/legal/cookies'],
    gdpr: ['/gdpr', '/gdpr-compliance', '/data-protection'],
    disclaimer: ['/disclaimer', '/legal-disclaimer', '/legal/disclaimer'],
    refund: ['/refund', '/refund-policy', '/returns', '/return-policy'],
    dmca: ['/dmca', '/copyright', '/dmca-policy']
};

// Cookie banner detection patterns
export const COOKIE_BANNER_PATTERNS = [
    'cookie-banner', 'cookie-consent', 'cookie-notice', 'cookie-popup',
    'gdpr-banner', 'consent-banner', 'privacy-banner', 'cookieconsent',
    'cc-banner', 'onetrust', 'cookiebot', 'trustarc', 'quantcast'
];

// Cookie types patterns
export const COOKIE_TYPES_PATTERNS = {
    'Essential/Necessary': ['essential cookie', 'necessary cookie', 'strictly necessary'],
    'Analytics': ['analytics cookie', 'google analytics', '_ga', 'analytics'],
    'Marketing/Advertising': ['marketing cookie', 'advertising cookie', 'ad cookie', 'targeting'],
    'Functional': ['functional cookie', 'preference cookie', 'functionality'],
    'Performance': ['performance cookie']
};

// Analytics tracker patterns
export const ANALYTICS_PATTERNS = {
    'Google Analytics': ['google-analytics', 'googletagmanager', 'gtag', 'ga.js', 'analytics.js', '_ga'],
    'Google Tag Manager': ['googletagmanager', 'gtm.js'],
    'Facebook Pixel': ['fbq(', 'facebook.com/tr', 'connect.facebook.net'],
    'Hotjar': ['hotjar', 'hjid'],
    'Mixpanel': ['mixpanel'],
    'Segment': ['segment.com', 'segment.io'],
    'Amplitude': ['amplitude'],
    'Heap': ['heap.io', 'heapanalytics'],
    'Matomo/Piwik': ['matomo', 'piwik'],
    'Plausible': ['plausible.io']
};

// Advertising network patterns
export const ADVERTISING_PATTERNS = {
    'Google Ads': ['googlesyndication', 'googleadservices', 'doubleclick'],
    'Facebook Ads': ['facebook.com/tr'],
    'LinkedIn Ads': ['linkedin.com/px', 'snap.licdn.com'],
    'Twitter Ads': ['static.ads-twitter.com'],
    'Criteo': ['criteo.com', 'criteo.net'],
    'AdRoll': ['adroll.com'],
    'Taboola': ['taboola.com'],
    'Outbrain': ['outbrain.com']
};

// Social media widget patterns
export const SOCIAL_PATTERNS = {
    'Facebook': ['facebook.com/plugins', 'fb-root', 'facebook-jssdk'],
    'Twitter': ['platform.twitter.com', 'twitter-wjs'],
    'LinkedIn': ['platform.linkedin.com'],
    'Pinterest': ['assets.pinterest.com'],
    'Instagram': ['instagram.com/embed']
};

// Helper function to get random user agent
export const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Domain validation
export function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain) || domain.includes('.');
}
