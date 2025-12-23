import { useState } from 'react';
import './Scanner.css';

const websiteOptions = [
    { id: 'hasPayments', label: 'Accepts payments / E-commerce', description: 'Requires refund/return policies' },
    { id: 'collectsPersonalData', label: 'Collects personal data', description: 'Contact forms, accounts, newsletters' },
    { id: 'usesTracking', label: 'Uses analytics/tracking', description: 'Google Analytics, Meta Pixel, etc.' },
    { id: 'hasUserAccounts', label: 'Has user accounts', description: 'Login/registration functionality' },
    { id: 'targetsEU', label: 'Targets EU visitors', description: 'GDPR compliance required' },
    { id: 'targetsUSA', label: 'Targets US visitors', description: 'CCPA compliance for California' },
    { id: 'hasChildrenContent', label: 'Children may use the site', description: 'COPPA compliance required' },
];

function Scanner({ onScan, isLoading }) {
    const [domain, setDomain] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [siteOptions, setSiteOptions] = useState({
        hasPayments: false,
        collectsPersonalData: true,
        usesTracking: true,
        hasUserAccounts: false,
        targetsEU: true,
        targetsUSA: true,
        hasChildrenContent: false,
    });

    const handleOptionChange = (optionId) => {
        setSiteOptions(prev => ({
            ...prev,
            [optionId]: !prev[optionId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (domain.trim() && !isLoading) {
            onScan(domain.trim(), siteOptions);
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

            <div className="options-toggle">
                <button
                    type="button"
                    className="toggle-button"
                    onClick={() => setShowOptions(!showOptions)}
                >
                    <span className={`toggle-icon ${showOptions ? 'open' : ''}`}>▶</span>
                    Website Options
                    <span className="toggle-hint">(customize compliance checks)</span>
                </button>
            </div>

            {showOptions && (
                <div className="website-options">
                    <p className="options-description">
                        Select what applies to your website. This helps provide more accurate compliance scores by not penalizing you for requirements that don't apply.
                    </p>
                    <div className="options-grid">
                        {websiteOptions.map((option) => (
                            <label key={option.id} className="option-item">
                                <input
                                    type="checkbox"
                                    checked={siteOptions[option.id]}
                                    onChange={() => handleOptionChange(option.id)}
                                    disabled={isLoading}
                                />
                                <span className="option-content">
                                    <span className="option-label">{option.label}</span>
                                    <span className="option-desc">{option.description}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default Scanner;
