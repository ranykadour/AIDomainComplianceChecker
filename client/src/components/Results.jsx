import './Results.css';

function Results({ result }) {
    const { domain, url, scanTime, textAnalyzed, analysis, scannedAt } = result;

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'risk-high';
            case 'medium': return 'risk-medium';
            case 'low': return 'risk-low';
            default: return 'risk-unknown';
        }
    };

    const getRiskIcon = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    return (
        <section className="results">
            <div className="results-header">
                <h2>Scan Results</h2>
                <div className={`risk-badge ${getRiskColor(analysis.risk_level)}`}>
                    <span className="risk-icon">{getRiskIcon(analysis.risk_level)}</span>
                    <span>{analysis.risk_level} Risk</span>
                </div>
            </div>

            <div className="scan-meta">
                <div className="meta-item">
                    <span className="meta-label">Domain:</span>
                    <a href={url} target="_blank" rel="noopener noreferrer">{domain}</a>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Scan Time:</span>
                    <span>{scanTime}</span>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Text Analyzed:</span>
                    <span>{textAnalyzed.toLocaleString()} characters</span>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Analysis Source:</span>
                    <span className="source-badge">{analysis.source === 'groq' ? '⚡ Groq (Llama 3.3)' : '📋 Mock Analysis'}</span>
                </div>
            </div>

            {analysis.summary && (
                <div className="summary-box">
                    <strong>Summary:</strong> {analysis.summary}
                </div>
            )}

            <div className="results-grid">
                <ResultCard
                    title="Personal Data Exposure"
                    icon="👤"
                    items={analysis.personal_data}
                    type="personal"
                />

                <ResultCard
                    title="Potential Data Leaks"
                    icon="🔓"
                    items={analysis.data_leaks}
                    type="leaks"
                />

                <ResultCard
                    title="Legal Issues"
                    icon="⚖️"
                    items={analysis.legal_issues}
                    type="legal"
                />
            </div>

            <div className="timestamp">
                Scanned at: {new Date(scannedAt).toLocaleString()}
            </div>
        </section>
    );
}

function ResultCard({ title, icon, items, type }) {
    const hasIssues = items && items.length > 0 &&
        !items[0].toLowerCase().includes('no obvious') &&
        !items[0].toLowerCase().includes('appear to be in place');

    return (
        <div className={`result-card ${type} ${hasIssues ? 'has-issues' : ''}`}>
            <h3>
                <span className="card-icon">{icon}</span>
                {title}
            </h3>
            <ul>
                {items && items.length > 0 ? (
                    items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))
                ) : (
                    <li className="no-issues">No issues detected</li>
                )}
            </ul>
        </div>
    );
}

export default Results;
