import { useState } from 'react';
import './Scanner.css';

function Scanner({ onScan, isLoading }) {
    const [domain, setDomain] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (domain.trim() && !isLoading) {
            onScan(domain.trim());
        }
    };

    const exampleDomains = ['example.com', 'github.com', 'google.com'];

    return (
        <section className="scanner">
            <form onSubmit={handleSubmit} className="scanner-form">
                <div className="input-group">
                    <span className="input-prefix">https://</span>
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter domain name (e.g., example.com)"
                        disabled={isLoading}
                        className="domain-input"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !domain.trim()}
                    className="scan-button"
                >
                    {isLoading ? 'Scanning...' : 'Scan Domain'}
                </button>
            </form>

            <div className="examples">
                <span>Try:</span>
                {exampleDomains.map((example) => (
                    <button
                        key={example}
                        type="button"
                        onClick={() => setDomain(example)}
                        className="example-button"
                        disabled={isLoading}
                    >
                        {example}
                    </button>
                ))}
            </div>
        </section>
    );
}

export default Scanner;
