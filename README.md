# AI-Powered Domain Compliance & Data Leak Checker

A demo web application that scans websites for data privacy issues, potential data leaks, and compliance risks using AI analysis.

![Demo Screenshot](docs/screenshot.png)

## 🎯 Features

- **Domain Scanning**: Enter any domain to scan its homepage
- **Text Extraction**: Automatically extracts visible text content (strips scripts/styles)
- **AI Analysis**: Uses OpenAI GPT to analyze content for:
  - Personal data exposure (emails, phone numbers, IDs)
  - Potential data leaks (API keys, passwords, internal data)
  - Legal/compliance issues (privacy policy, copyright)
  - Overall risk level assessment (Low/Medium/High)
- **Mock Mode**: Works without an OpenAI API key using pattern-based analysis
- **Clean UI**: Modern, responsive interface

## 🛠️ Tech Stack

- **Frontend**: Vite + React (JavaScript)
- **Backend**: Node.js + Express
- **AI**: OpenAI API (with mock fallback)
- **Web Scraping**: Cheerio + Axios

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Scanner.jsx    # Domain input form
│   │   │   ├── Scanner.css
│   │   │   ├── Results.jsx    # Results display
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
│   │   ├── scanner.js      # Domain fetching & text extraction
│   │   └── ai.js           # OpenAI integration & mock analysis
│   ├── index.js            # Express server
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── package.json            # Root package.json with dev scripts
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

2. **Install all dependencies:**

   ```bash
   npm run install:all
   ```

3. **(Optional) Configure OpenAI API:**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

### Running the Application

**Option 1: Run both servers together (recommended)**

```bash
npm run dev
```

**Option 2: Run servers separately**

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
| `OPENAI_API_KEY` | Your OpenAI API key | No (uses mock if missing) |
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
- The mock analyzer uses simple pattern matching (not secure analysis)
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
