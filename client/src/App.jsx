import { useState } from 'react';
import axios from 'axios';
import Scanner from './components/Scanner';
import Results from './components/Results';
import './App.css';

function App() {
    const [scanResult, setScanResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleScan = async (domain, siteOptions) => {
        setIsLoading(true);
        setError(null);
        setScanResult(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await axios.post(`${apiUrl}/api/scan`, { domain, siteOptions });
            setScanResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred while scanning');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app">
            <header className="header">
                <div className="logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M9 12l2 2 4-4"></path>
                    </svg>
                    <h1>Website Legal Compliance Checker</h1>
                </div>
                <p className="subtitle">
                    Check if your website is legally compliant - Privacy Policy, Terms of Service, GDPR, Cookies & more
                </p>
            </header>

            <main className="main">
                <Scanner onScan={handleScan} isLoading={isLoading} />

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Scanning domain and analyzing content...</p>
                    </div>
                )}

                {scanResult && !isLoading && (
                    <Results result={scanResult} />
                )}
            </main>

            <footer className="footer">
                <p>Demo Project • For educational purposes only</p>
            </footer>
        </div>
    );
}

export default App;
