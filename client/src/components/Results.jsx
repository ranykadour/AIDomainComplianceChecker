import { jsPDF } from 'jspdf';
import './Results.css';

function Results({ result }) {
    const { domain, url, scanTime, textAnalyzed, analysis, scannedAt } = result;

    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;
        const lineHeight = 7;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Helper function to add text with word wrap
        const addWrappedText = (text, x, y, maxWidth) => {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * lineHeight);
        };

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Domain Compliance Scan Report', margin, yPos);
        yPos += 15;

        // Risk Level Badge
        doc.setFontSize(14);
        const riskColor = analysis.risk_level?.toLowerCase() === 'high' ? [220, 38, 38] :
            analysis.risk_level?.toLowerCase() === 'medium' ? [217, 119, 6] : [22, 163, 74];
        doc.setTextColor(...riskColor);
        doc.text(`Risk Level: ${analysis.risk_level?.toUpperCase() || 'UNKNOWN'}`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        // Scan Info Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Scan Information', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Domain: ${domain}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`URL: ${url}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Scan Time: ${scanTime}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Text Analyzed: ${textAnalyzed.toLocaleString()} characters`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Analysis Source: ${analysis.source === 'groq' ? 'Groq (Llama 3.3)' : 'Mock Analysis'}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Scanned At: ${new Date(scannedAt).toLocaleString()}`, margin, yPos);
        yPos += 15;

        // Summary
        if (analysis.summary) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Summary', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            yPos = addWrappedText(analysis.summary, margin, yPos, maxWidth);
            yPos += 10;
        }

        // Personal Data Exposure Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Personal Data Exposure', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        if (analysis.personal_data && analysis.personal_data.length > 0) {
            analysis.personal_data.forEach((item) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }
        yPos += 10;

        // Potential Data Leaks Section
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Potential Data Leaks', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        if (analysis.data_leaks && analysis.data_leaks.length > 0) {
            analysis.data_leaks.forEach((item) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }
        yPos += 10;

        // Legal Issues Section
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Legal Issues', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        if (analysis.legal_issues && analysis.legal_issues.length > 0) {
            analysis.legal_issues.forEach((item) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Generated by AI Domain Compliance Checker • Page ${i} of ${pageCount}`,
                pageWidth / 2,
                290,
                { align: 'center' }
            );
        }

        // Save the PDF
        doc.save(`compliance-report-${domain}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

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
                <div className="header-actions">
                    <button className="download-btn" onClick={downloadPDF} title="Download PDF Report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download PDF
                    </button>
                    <div className={`risk-badge ${getRiskColor(analysis.risk_level)}`}>
                        <span className="risk-icon">{getRiskIcon(analysis.risk_level)}</span>
                        <span>{analysis.risk_level} Risk</span>
                    </div>
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
