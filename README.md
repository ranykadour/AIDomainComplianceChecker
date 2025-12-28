# Website Legal Compliance Checker

A comprehensive web application that scans websites for legal compliance issues, data privacy concerns, GDPR/CCPA compliance, and security risks using AI analysis.

![Demo Screenshot](docs/screenshot.png)

## 🎯 Features

### Legal Compliance Analysis

- **Legal Page Detection**: Automatically finds and analyzes Privacy Policy, Terms of Service, Cookie Policy, GDPR pages, Disclaimers, Refund Policy, and DMCA/Copyright pages
- **Privacy Policy Analysis**: Checks for required elements (data collection, sharing, retention, user rights, contact info, children's privacy)
- **Terms of Service Analysis**: Validates acceptance terms, liability limits, termination clauses, dispute resolution, IP rights
- **GDPR Compliance**: Checks for consent mechanisms, data subject rights, DPO contact information
- **CCPA Compliance**: Detects "Do Not Sell" links and consumer rights disclosures
- **Cookie Compliance**: Detects cookie banners, consent mechanisms, and cookie categorization

### Security Analysis

- **Personal Data Exposure**: Detects exposed emails, phone numbers, IDs, names, addresses
- **Data Leak Detection**: Finds API keys, passwords, internal data, debug information
- **Third-Party Risk Assessment**: Analyzes trackers, advertising networks, social widgets

### Tracking & Data Collection Analysis

- **Analytics Tools**: Detects Google Analytics, Mixpanel, Hotjar, Segment, and more
- **Advertising Networks**: Identifies Google Ads, Facebook Pixel, LinkedIn Ads, Criteo, etc.
- **Social Media Widgets**: Finds Facebook, Twitter, LinkedIn, Pinterest embeds
- **Data Collection Points**: Identifies newsletters, forms, registration, payment processing, live chat

### Reports & Export

- **Separate PDF Reports**: Download dedicated Security Report or Legal Compliance Report
- **Scoring System**: Get numerical scores (0-100) for both security and legal compliance
- **Actionable Recommendations**: Receive specific suggestions to improve compliance

## 🛠️ Tech Stack

- **Frontend**: Vite + React (JavaScript)
- **Backend**: Node.js + Express
- **AI**: Groq API with Llama 3.3
- **Web Scraping**: Cheerio + Axios
- **PDF Generation**: jsPDF

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Scanner.jsx    # Domain input form
│   │   │   ├── Scanner.css
│   │   │   ├── Results.jsx    # Tabbed results (Security/Legal)
│   │   │   └── Results.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
│
├── server/                 # Express backend
│   ├── services/
│   │   ├── scanner.js      # Domain fetching, legal page detection
│   │   └── ai.js           # Groq API integration
│   ├── index.js            # Express server
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── api/                    # Vercel serverless functions
│   ├── scan.js             # Main scan endpoint
│   └── health.js           # Health check endpoint
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone and navigate to the project:**

   ```bash
   cd AIDomainComplianceChecker
   ```

2. **Install dependencies for Server:**

   ```bash
   cd server
   npm install
   ```

3. **Install dependencies for Client:**

   ```bash
   cd ../client
   npm install
   ```

3. **(Optional) Configure Groq API:**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

### Running the Application

**Run servers separately**

Terminal 1 - Backend:

```bash
cd server
npm run dev
```

Terminal 2 - Frontend:

```bash
cd client
npm run dev
```

### Access the App

Open your browser and navigate to: **<http://localhost:5173>**

## 📡 API Endpoints

### POST /api/scan

Scans a domain's homepage and returns compliance analysis.

**Request:**

```json
{
  "domain": "example.com"
}
```

**Response:**

```json
{
  "success": true,
  "domain": "example.com",
  "url": "https://example.com",
  "scanTime": "2.34s",
  "textAnalyzed": 3500,
  "analysis": {
    "personal_data": ["Found 2 email address(es): contact@example.com, support@example.com"],
    "data_leaks": ["No obvious data leaks detected"],
    "legal_issues": ["No visible privacy policy detected"],
    "risk_level": "Medium",
    "summary": "Scanned example.com homepage. Found 2 potential issue(s). Risk level: Medium.",
    "source": "mock"
  },
  "scannedAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🔧 Configuration

### Environment Variables (server/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | Yes |
| `PORT` | Server port | No (defaults to 3001) |

## 📋 Sample Output

### Low Risk Example

```
🟢 Low Risk
- No personal data exposure detected
- No data leaks found
- Privacy policy and cookie notice present
```

### High Risk Example

```
🔴 High Risk
- Found 5 email addresses exposed
- Possible API key reference detected
- No privacy policy found
- Sensitive keywords detected (password references)
```

## ⚠️ Limitations

- **Demo Only**: This is not production software
- **Homepage Only**: Only scans the main page (no deep crawling)
- **No Authentication**: No user accounts or sessions
- **No Database**: All data is in-memory only
- **Rate Limits**: Subject to OpenAI API rate limits
- **Text Limit**: Analyzes max 5,000 characters per scan

## 🔒 Security Notes

- Never expose API keys in client-side code
- Some websites may block automated requests
- Always respect robots.txt and website terms of service

## 📝 Development

### Adding New Features

1. **New detection patterns**: Edit `server/services/ai.js`
2. **UI changes**: Edit components in `client/src/components/`
3. **New API endpoints**: Add routes in `server/index.js`

### Testing

```bash
# Test the API directly
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

## 📄 License

MIT License - This is a demo/educational project.

---

**Note**: This tool is for educational and demonstration purposes only. Always obtain proper authorization before scanning websites you don't own.
