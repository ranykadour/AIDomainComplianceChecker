import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scanDomain } from './services/scanner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Main scan endpoint
app.post('/api/scan', async (req, res) => {
    try {
        const { domain } = req.body;

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

        const result = await scanDomain(cleanDomain);
        res.json(result);

    } catch (error) {
        console.error('Scan error:', error.message);
        res.status(500).json({
            error: 'Scan failed',
            message: error.message || 'An error occurred while scanning the domain'
        });
    }
});

// Simple domain validation
function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain) || domain.includes('.');
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Groq API Key: ${process.env.GROQ_API_KEY ? 'Configured' : 'Not configured (using mock responses)'}`);
});
