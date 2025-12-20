# Sample Output

Below is a sample JSON response from the `/api/scan` endpoint:

## Request

```json
POST /api/scan
{
  "domain": "example.com"
}
```

## Response (Mock Analysis)

```json
{
  "success": true,
  "domain": "example.com",
  "url": "https://example.com",
  "scanTime": "1.25s",
  "textAnalyzed": 1256,
  "analysis": {
    "personal_data": [
      "No obvious personal data exposure detected"
    ],
    "data_leaks": [
      "No obvious data leaks detected"
    ],
    "legal_issues": [
      "No copyright notice found"
    ],
    "risk_level": "Low",
    "summary": "Scanned example.com homepage. Found 1 potential issue(s). Risk level: Low.",
    "source": "mock"
  },
  "scannedAt": "2024-12-20T10:30:00.000Z"
}
```

## Response (OpenAI Analysis)

When configured with an OpenAI API key:

```json
{
  "success": true,
  "domain": "some-website.com",
  "url": "https://some-website.com",
  "scanTime": "3.42s",
  "textAnalyzed": 4521,
  "analysis": {
    "personal_data": [
      "Email address found: contact@some-website.com",
      "Phone number visible: +1 (555) 123-4567",
      "Staff names listed in team section"
    ],
    "data_leaks": [
      "Internal server version exposed in footer",
      "Debug mode indicator found"
    ],
    "legal_issues": [
      "Privacy policy link present but may be incomplete",
      "Cookie consent banner not detected",
      "Terms of service page referenced"
    ],
    "risk_level": "Medium",
    "summary": "The website exposes some personal contact information and internal technical details. While basic legal notices are present, cookie consent implementation should be verified for GDPR compliance.",
    "source": "openai"
  },
  "scannedAt": "2024-12-20T10:32:15.000Z"
}
```

## UI Screenshot

The application displays results in a clean, organized format:

```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ AI Domain Compliance Checker                            │
│     Scan websites for data privacy issues                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https:// │ example.com                │ Scan Domain │   │
│  └─────────────────────────────────────────────────────┘   │
│  Try: [example.com] [github.com] [google.com]              │
├─────────────────────────────────────────────────────────────┤
│  Scan Results                            🟢 Low Risk        │
│  ──────────────────────────────────────────────────────    │
│  Domain: example.com    Scan Time: 1.25s                   │
│  Text Analyzed: 1,256 chars    Source: 📋 Mock Analysis    │
│                                                             │
│  Summary: Scanned example.com homepage. Found 1 potential  │
│  issue(s). Risk level: Low.                                │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 👤 Personal │ │ 🔓 Data     │ │ ⚖️ Legal    │          │
│  │ Data        │ │ Leaks       │ │ Issues      │          │
│  │─────────────│ │─────────────│ │─────────────│          │
│  │ No obvious  │ │ No obvious  │ │ No copyright│          │
│  │ exposure    │ │ leaks       │ │ notice found│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  Scanned at: 12/20/2024, 10:30:00 AM                       │
└─────────────────────────────────────────────────────────────┘
```

## Risk Level Indicators

| Level | Badge | Description |
|-------|-------|-------------|
| Low | 🟢 | Few or no issues detected |
| Medium | 🟡 | Some concerns that should be reviewed |
| High | 🔴 | Significant privacy/compliance risks |
