import { useState } from 'react';
import { jsPDF } from 'jspdf';
import './Results.css';

function Results({ result }) {
    const { domain, url, scanTime, textAnalyzed, analysis, legalPages, cookieInfo, trackingInfo, scannedAt } = result;
    const [activeTab, setActiveTab] = useState('security');

    const downloadSecurityPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;
        const lineHeight = 7;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        const addWrappedText = (text, x, y, maxWidth) => {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * lineHeight);
        };

        const checkNewPage = (currentY, neededSpace = 30) => {
            if (currentY > 270 - neededSpace) {
                doc.addPage();
                return 20;
            }
            return currentY;
        };

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Security Analysis Report', margin, yPos);
        yPos += 12;

        // Risk Badge
        doc.setFontSize(14);
        const securityRisk = analysis.security?.risk_level || 'Unknown';
        const riskColor = securityRisk === 'High' ? [220, 38, 38] :
            securityRisk === 'Medium' ? [217, 119, 6] : [22, 163, 74];
        doc.setTextColor(...riskColor);
        doc.text(`Security Risk: ${securityRisk.toUpperCase()} (${analysis.security?.score || 'N/A'}/100)`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        // Scan Info
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
        doc.text(`Scanned At: ${new Date(scannedAt).toLocaleString()}`, margin, yPos);
        yPos += 15;

        // Personal Data Exposure
        yPos = checkNewPage(yPos);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Personal Data Exposure', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const personalData = analysis.security?.personal_data_exposure || [];
        if (personalData.length > 0) {
            personalData.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }
        yPos += 10;

        // Data Leaks
        yPos = checkNewPage(yPos);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Potential Data Leaks', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const dataLeaks = analysis.security?.data_leaks || [];
        if (dataLeaks.length > 0) {
            dataLeaks.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }
        yPos += 10;

        // Third-Party Risks
        yPos = checkNewPage(yPos);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Third-Party Risks', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const thirdParty = analysis.security?.third_party_risks || [];
        if (thirdParty.length > 0) {
            thirdParty.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        } else {
            doc.text('• No issues detected', margin, yPos);
            yPos += lineHeight;
        }
        yPos += 10;

        // Tracking Info
        if (trackingInfo) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Tracking & Analytics Detected', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            if (trackingInfo.analytics?.length > 0) {
                yPos = addWrappedText(`• Analytics: ${trackingInfo.analytics.join(', ')}`, margin, yPos, maxWidth - 5);
            }
            if (trackingInfo.advertising?.length > 0) {
                yPos = addWrappedText(`• Advertising: ${trackingInfo.advertising.join(', ')}`, margin, yPos, maxWidth - 5);
            }
            if (trackingInfo.socialMedia?.length > 0) {
                yPos = addWrappedText(`• Social Media: ${trackingInfo.socialMedia.join(', ')}`, margin, yPos, maxWidth - 5);
            }
            if (!trackingInfo.analytics?.length && !trackingInfo.advertising?.length && !trackingInfo.socialMedia?.length) {
                doc.text('• No tracking detected', margin, yPos);
                yPos += lineHeight;
            }
            yPos += 10;
        }

        // Recommendations
        const recommendations = analysis.security?.recommendations || [];
        if (recommendations.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Security Recommendations', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            recommendations.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Security Report - ${domain} • Generated by Legal Compliance Checker • Page ${i} of ${pageCount}`,
                pageWidth / 2,
                290,
                { align: 'center' }
            );
        }

        doc.save(`security-report-${domain}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadLegalPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;
        const lineHeight = 7;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        const addWrappedText = (text, x, y, maxWidth) => {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * lineHeight);
        };

        const checkNewPage = (currentY, neededSpace = 30) => {
            if (currentY > 270 - neededSpace) {
                doc.addPage();
                return 20;
            }
            return currentY;
        };

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Legal Compliance Report', margin, yPos);
        yPos += 12;

        // Compliance Badge
        doc.setFontSize(14);
        const complianceLevel = analysis.legal?.compliance_level || 'Unknown';
        const compColor = complianceLevel === 'Low' ? [220, 38, 38] :
            complianceLevel === 'Medium' ? [217, 119, 6] : [22, 163, 74];
        doc.setTextColor(...compColor);
        doc.text(`Compliance Level: ${complianceLevel.toUpperCase()} (${analysis.legal?.score || 'N/A'}/100)`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        // Scan Info
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
        doc.text(`Scanned At: ${new Date(scannedAt).toLocaleString()}`, margin, yPos);
        yPos += 15;

        // Legal Pages Found
        yPos = checkNewPage(yPos);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Legal Pages Status', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const pageTypes = [
            { key: 'privacy', label: 'Privacy Policy' },
            { key: 'terms', label: 'Terms of Service' },
            { key: 'cookies', label: 'Cookie Policy' },
            { key: 'gdpr', label: 'GDPR Page' },
            { key: 'disclaimer', label: 'Disclaimer' },
            { key: 'refund', label: 'Refund Policy' },
            { key: 'dmca', label: 'DMCA/Copyright' }
        ];

        pageTypes.forEach(({ key, label }) => {
            const found = legalPages?.[key]?.found;
            const status = found ? '✓ Found' : '✗ Not Found';
            doc.text(`• ${label}: ${status}`, margin, yPos);
            yPos += lineHeight;
        });
        yPos += 5;

        // Missing Pages
        const missingPages = analysis.legal?.missing_pages || [];
        if (missingPages.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(220, 38, 38);
            doc.text('Missing Required Pages', margin, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            missingPages.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
            yPos += 10;
        }

        // GDPR Issues
        const gdprIssues = analysis.legal?.gdpr_issues || [];
        if (gdprIssues.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('GDPR Compliance Issues', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            gdprIssues.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
            yPos += 10;
        }

        // CCPA Issues
        const ccpaIssues = analysis.legal?.ccpa_issues || [];
        if (ccpaIssues.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('CCPA Compliance Issues', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            ccpaIssues.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
            yPos += 10;
        }

        // Cookie Compliance
        yPos = checkNewPage(yPos);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Cookie Compliance', margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const hasBanner = analysis.legal?.cookie_compliance?.has_banner || cookieInfo?.hasCookieBanner;
        const hasConsent = analysis.legal?.cookie_compliance?.has_consent || cookieInfo?.hasCookieConsent;
        doc.text(`• Cookie Banner: ${hasBanner ? 'Detected' : 'Not Detected'}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`• Consent Mechanism: ${hasConsent ? 'Present' : 'Not Found'}`, margin, yPos);
        yPos += lineHeight;
        if (cookieInfo?.consentMechanism) {
            doc.text(`• Platform: ${cookieInfo.consentMechanism}`, margin, yPos);
            yPos += lineHeight;
        }

        const cookieIssues = analysis.legal?.cookie_compliance?.issues || [];
        if (cookieIssues.length > 0) {
            yPos += 3;
            doc.text('Issues:', margin, yPos);
            yPos += lineHeight;
            cookieIssues.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`  • ${item}`, margin, yPos, maxWidth - 5);
            });
        }
        yPos += 10;

        // Privacy Policy Issues
        const privacyIssues = analysis.legal?.privacy_policy_issues || [];
        if (privacyIssues.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Privacy Policy Issues', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            privacyIssues.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
            yPos += 10;
        }

        // Terms Issues
        const termsIssues = analysis.legal?.terms_issues || [];
        if (termsIssues.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Terms of Service Issues', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            termsIssues.forEach((item) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`• ${item}`, margin, yPos, maxWidth - 5);
            });
            yPos += 10;
        }

        // Recommendations
        const recommendations = analysis.legal?.recommendations || [];
        if (recommendations.length > 0) {
            yPos = checkNewPage(yPos);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Legal Recommendations', margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            recommendations.forEach((item, index) => {
                yPos = checkNewPage(yPos);
                yPos = addWrappedText(`${index + 1}. ${item}`, margin, yPos, maxWidth - 5);
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Legal Compliance Report - ${domain} • Generated by Legal Compliance Checker • Page ${i} of ${pageCount}`,
                pageWidth / 2,
                290,
                { align: 'center' }
            );
        }

        doc.save(`legal-report-${domain}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'score-good';
        if (score >= 60) return 'score-medium';
        return 'score-bad';
    };

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'risk-high';
            case 'medium': return 'risk-medium';
            case 'low': return 'risk-low';
            default: return 'risk-unknown';
        }
    };

    const getComplianceColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'low': return 'compliance-low';
            case 'medium': return 'compliance-medium';
            case 'high': return 'compliance-high';
            default: return 'compliance-unknown';
        }
    };

    return (
        <section className="results">
            {/* Header with scores overview */}
            <div className="results-header">
                <h2>Compliance Report</h2>
                <div className="scores-overview">
                    <div className={`score-card ${getScoreColor(analysis.security?.score)}`}>
                        <span className="score-label">Security</span>
                        <span className="score-value">{analysis.security?.score || 'N/A'}</span>
                        <span className={`score-badge ${getRiskColor(analysis.security?.risk_level)}`}>
                            {analysis.security?.risk_level || 'Unknown'} Risk
                        </span>
                    </div>
                    <div className={`score-card ${getScoreColor(analysis.legal?.score)}`}>
                        <span className="score-label">Legal</span>
                        <span className="score-value">{analysis.legal?.score || 'N/A'}</span>
                        <span className={`score-badge ${getComplianceColor(analysis.legal?.compliance_level)}`}>
                            {analysis.legal?.compliance_level || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Scan metadata */}
            <div className="scan-meta">
                <div className="meta-item">
                    <span className="meta-label">Domain</span>
                    <a href={url} target="_blank" rel="noopener noreferrer">{domain}</a>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Scan Time</span>
                    <span>{scanTime}</span>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Text Analyzed</span>
                    <span>{textAnalyzed?.toLocaleString()} chars</span>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Analysis</span>
                    <span className="source-badge">{analysis.source === 'groq' ? '⚡ AI Analysis' : '📋 Pattern Analysis'}</span>
                </div>
            </div>

            {/* Summary */}
            {analysis.summary && (
                <div className="summary-box">
                    <strong>Summary:</strong> {analysis.summary}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    🛡️ Security Analysis
                </button>
                <button
                    className={`tab-btn ${activeTab === 'legal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('legal')}
                >
                    ⚖️ Legal Compliance
                </button>
            </div>

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3>🛡️ Security Analysis</h3>
                        <button className="download-btn" onClick={downloadSecurityPDF}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Security PDF
                        </button>
                    </div>

                    <div className="results-grid">
                        <ResultCard
                            title="Personal Data Exposure"
                            icon="👤"
                            items={analysis.security?.personal_data_exposure}
                            type="personal"
                        />
                        <ResultCard
                            title="Potential Data Leaks"
                            icon="🔓"
                            items={analysis.security?.data_leaks}
                            type="leaks"
                        />
                        <ResultCard
                            title="Third-Party Risks"
                            icon="🔗"
                            items={analysis.security?.third_party_risks}
                            type="third-party"
                        />
                    </div>

                    {/* Tracking Details */}
                    <div className="tracking-section">
                        <h4>📊 Tracking & Data Collection</h4>
                        <div className="tracking-grid">
                            <div className="tracking-card">
                                <h5>Analytics Tools</h5>
                                {trackingInfo?.analytics?.length > 0 ? (
                                    <ul>
                                        {trackingInfo.analytics.map((tool, i) => (
                                            <li key={i}>{tool}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-items">None detected</p>
                                )}
                            </div>
                            <div className="tracking-card">
                                <h5>Advertising Networks</h5>
                                {trackingInfo?.advertising?.length > 0 ? (
                                    <ul>
                                        {trackingInfo.advertising.map((tool, i) => (
                                            <li key={i}>{tool}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-items">None detected</p>
                                )}
                            </div>
                            <div className="tracking-card">
                                <h5>Social Media Widgets</h5>
                                {trackingInfo?.socialMedia?.length > 0 ? (
                                    <ul>
                                        {trackingInfo.socialMedia.map((tool, i) => (
                                            <li key={i}>{tool}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-items">None detected</p>
                                )}
                            </div>
                            <div className="tracking-card">
                                <h5>Data Collection Points</h5>
                                {trackingInfo?.dataCollection?.length > 0 ? (
                                    <ul>
                                        {trackingInfo.dataCollection.map((point, i) => (
                                            <li key={i}>{point}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-items">None detected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {analysis.security?.recommendations?.length > 0 && (
                        <div className="recommendations-section">
                            <h4>💡 Security Recommendations</h4>
                            <ul>
                                {analysis.security.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Legal Tab */}
            {activeTab === 'legal' && (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3>⚖️ Legal Compliance</h3>
                        <button className="download-btn" onClick={downloadLegalPDF}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Legal PDF
                        </button>
                    </div>

                    {/* Legal Pages Status */}
                    <div className="legal-pages-section">
                        <h4>📄 Legal Pages Status</h4>
                        <div className="legal-pages-grid">
                            {[
                                { key: 'privacy', label: 'Privacy Policy', icon: '🔒' },
                                { key: 'terms', label: 'Terms of Service', icon: '📜' },
                                { key: 'cookies', label: 'Cookie Policy', icon: '🍪' },
                                { key: 'gdpr', label: 'GDPR Page', icon: '🇪🇺' },
                                { key: 'disclaimer', label: 'Disclaimer', icon: '⚠️' },
                                { key: 'refund', label: 'Refund Policy', icon: '💰' },
                                { key: 'dmca', label: 'DMCA/Copyright', icon: '©️' }
                            ].map(({ key, label, icon }) => (
                                <div key={key} className={`legal-page-item ${legalPages?.[key]?.found ? 'found' : 'missing'}`}>
                                    <span className="page-icon">{icon}</span>
                                    <span className="page-label">{label}</span>
                                    <span className="page-status">
                                        {legalPages?.[key]?.found ? (
                                            <a href={legalPages[key].url} target="_blank" rel="noopener noreferrer">✓ Found</a>
                                        ) : (
                                            '✗ Missing'
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cookie Compliance */}
                    <div className="cookie-compliance-section">
                        <h4>🍪 Cookie Compliance</h4>
                        <div className="cookie-status">
                            <div className={`cookie-item ${cookieInfo?.hasCookieBanner ? 'good' : 'bad'}`}>
                                <span>Cookie Banner</span>
                                <span>{cookieInfo?.hasCookieBanner ? '✓ Detected' : '✗ Not Found'}</span>
                            </div>
                            <div className={`cookie-item ${cookieInfo?.hasCookieConsent ? 'good' : 'bad'}`}>
                                <span>Consent Mechanism</span>
                                <span>{cookieInfo?.hasCookieConsent ? '✓ Present' : '✗ Not Found'}</span>
                            </div>
                            {cookieInfo?.consentMechanism && (
                                <div className="cookie-item neutral">
                                    <span>Platform</span>
                                    <span>{cookieInfo.consentMechanism}</span>
                                </div>
                            )}
                            {cookieInfo?.cookieTypes?.length > 0 && (
                                <div className="cookie-item neutral">
                                    <span>Cookie Categories</span>
                                    <span>{cookieInfo.cookieTypes.join(', ')}</span>
                                </div>
                            )}
                        </div>
                        {analysis.legal?.cookie_compliance?.issues?.length > 0 && (
                            <div className="cookie-issues">
                                <h5>Issues:</h5>
                                <ul>
                                    {analysis.legal.cookie_compliance.issues.map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Compliance Issues Grid */}
                    <div className="results-grid">
                        {analysis.legal?.missing_pages?.length > 0 && (
                            <ResultCard
                                title="Missing Required Pages"
                                icon="📄"
                                items={analysis.legal.missing_pages}
                                type="missing"
                            />
                        )}
                        {analysis.legal?.gdpr_issues?.length > 0 && (
                            <ResultCard
                                title="GDPR Compliance Issues"
                                icon="🇪🇺"
                                items={analysis.legal.gdpr_issues}
                                type="gdpr"
                            />
                        )}
                        {analysis.legal?.ccpa_issues?.length > 0 && (
                            <ResultCard
                                title="CCPA Compliance Issues"
                                icon="🇺🇸"
                                items={analysis.legal.ccpa_issues}
                                type="ccpa"
                            />
                        )}
                        {analysis.legal?.privacy_policy_issues?.length > 0 && (
                            <ResultCard
                                title="Privacy Policy Issues"
                                icon="🔒"
                                items={analysis.legal.privacy_policy_issues}
                                type="privacy"
                            />
                        )}
                        {analysis.legal?.terms_issues?.length > 0 && (
                            <ResultCard
                                title="Terms of Service Issues"
                                icon="📜"
                                items={analysis.legal.terms_issues}
                                type="terms"
                            />
                        )}
                    </div>

                    {analysis.legal?.recommendations?.length > 0 && (
                        <div className="recommendations-section">
                            <h4>💡 Legal Recommendations</h4>
                            <ol>
                                {analysis.legal.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <div className="timestamp">
                Scanned at: {new Date(scannedAt).toLocaleString()}
            </div>
        </section>
    );
}

function ResultCard({ title, icon, items, type }) {
    const hasIssues = items && items.length > 0 &&
        !items[0]?.toLowerCase().includes('no obvious') &&
        !items[0]?.toLowerCase().includes('appear to be') &&
        !items[0]?.toLowerCase().includes('no issues');

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
