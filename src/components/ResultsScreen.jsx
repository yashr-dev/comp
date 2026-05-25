import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Cell } from 'recharts';

function OverviewTab({ brandMetrics }) {
  const igBrands = brandMetrics.filter(b => b.instagram);
  const fbBrands = brandMetrics.filter(b => b.facebook);

  const chartData = igBrands.map((b, i) => ({
    name: b.name,
    Followers: b.instagram.followers,
    EngagementRate: b.instagram.engagementRate,
    isClient: i === 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-200)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ margin: 0, color: payload[0].fill }}>
            {payload[0].name}: {payload[0].name === 'Followers' ? payload[0].value.toLocaleString() : `${payload[0].value}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in">
      <div className="metrics-grid" style={{ marginBottom: 32 }}>
        <div className="metric-card">
          <div className="metric-value">{brandMetrics.length}</div>
          <div className="metric-label">Brands Analyzed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {igBrands.length > 0 ? `${Math.max(...igBrands.map(b => b.instagram.engagementRate))}%` : 'N/A'}
          </div>
          <div className="metric-label">Highest IG ER</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {igBrands.length > 0 ? igBrands.reduce((sum, b) => sum + b.instagram.postsAnalyzed, 0) : 0}
          </div>
          <div className="metric-label">Posts Analyzed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {fbBrands.length > 0 ? `${Math.max(...fbBrands.map(b => b.facebook.engagementRate))}%` : 'N/A'}
          </div>
          <div className="metric-label">Highest FB ER</div>
        </div>
      </div>

      {igBrands.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
          <div className="chart-container" style={{ background: 'var(--surface-100)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, textAlign: 'center', color: 'var(--violet-400)' }}>
              Instagram Followers
            </h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="Followers" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isClient ? 'var(--violet-500)' : '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-container" style={{ background: 'var(--surface-100)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, textAlign: 'center', color: 'var(--pink-400)' }}>
              Instagram Engagement Rate (%)
            </h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="EngagementRate" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isClient ? 'var(--pink-500)' : '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {igBrands.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--violet-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Instagram Comparison
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th data-tooltip="The competitor or client being analyzed">Brand</th>
                <th data-tooltip="Total number of Instagram followers">Followers</th>
                <th data-tooltip="(Avg Likes + Avg Comments) / Followers">Eng. Rate</th>
                <th data-tooltip="Average likes per post">Avg Likes</th>
                <th data-tooltip="Average comments per post">Avg Comments</th>
                <th data-tooltip="Average posts published per week">Frequency (3 Months)</th>
                <th data-tooltip="Number of likes per every 1 comment">L:C Ratio</th>
                <th data-tooltip="Percentage of posts that are Reels/Videos">Video %</th>
                <th data-tooltip="Percentage of posts that are Carousels">Carousel %</th>
              </tr>
            </thead>
            <tbody>
              {igBrands.sort((a, b) => b.instagram.engagementRate - a.instagram.engagementRate).map((b, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.instagram.followers.toLocaleString()}</td>
                  <td style={{ color: b.instagram.engagementRate >= 3 ? 'var(--green-500)' : b.instagram.engagementRate >= 1 ? 'var(--amber-500)' : 'var(--red-500)' }}>
                    {b.instagram.engagementRate}%
                  </td>
                  <td>{b.instagram.avgLikes.toLocaleString()}</td>
                  <td>{b.instagram.avgComments}</td>
                  <td>{b.instagram.postingFrequency}/wk</td>
                  <td>{b.instagram.likeToCommentRatio}:1</td>
                  <td>{b.instagram.formatMix.video}%</td>
                  <td>{b.instagram.formatMix.carousel}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {fbBrands.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 12px', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            Facebook Comparison
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th data-tooltip="The competitor or client being analyzed">Brand</th>
                <th data-tooltip="Total number of page followers/likes">Followers</th>
                <th data-tooltip="(Avg Likes + Avg Comments) / Followers">Eng. Rate</th>
                <th data-tooltip="Average likes per post">Avg Likes</th>
                <th data-tooltip="Average comments per post">Avg Comments</th>
                <th data-tooltip="Average shares per post">Avg Shares</th>
              </tr>
            </thead>
            <tbody>
              {fbBrands.sort((a, b) => b.facebook.engagementRate - a.facebook.engagementRate).map((b, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.facebook.followers.toLocaleString()}</td>
                  {b.facebook.hasPostData ? (
                    <>
                      <td style={{ color: b.facebook.engagementRate >= 1.5 ? 'var(--green-500)' : 'var(--amber-500)' }}>
                        {b.facebook.engagementRate}%
                      </td>
                      <td>{b.facebook.avgLikes.toLocaleString()}</td>
                      <td>{b.facebook.avgComments}</td>
                      <td>{b.facebook.avgShares}</td>
                    </>
                  ) : (
                    <td colSpan="4" style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                      Posts unavailable due to API restrictions
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function ContentTab({ brandMetrics }) {
  return (
    <div className="fade-in">
      {brandMetrics.map((brand, bi) => {
        const hasIG = brand.instagram && (brand.instagram.topPosts?.length > 0 || brand.instagram.worstPosts?.length > 0);
        const hasFB = brand.facebook && brand.facebook.topPosts?.length > 0;
        const hasLI = brand.linkedin && brand.linkedin.recentPosts?.length > 0;
        
        if (!hasIG && !hasFB && !hasLI) return null;
        
        const renderPost = (post, pi, platform) => (
          <div className="post-card" key={pi} style={{ position: 'relative' }}>
            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 12, right: 12, color: 'var(--violet-400)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                View Post ↗
              </a>
            )}
            <div className="post-format">{platform === 'linkedin' ? 'Text/Doc' : post.format}</div>
            <div className="post-meta">
              {platform === 'linkedin' ? (
                <div className="stat">📅 {post.date}</div>
              ) : (
                <>
                  <div className="stat">❤️ {post.likes?.toLocaleString()}</div>
                  <div className="stat">💬 {post.comments?.toLocaleString()}</div>
                  {post.shares !== undefined && <div className="stat">🔁 {post.shares}</div>}
                  <div className="stat highlight">📊 {post.engagementRate}% ER</div>
                </>
              )}
            </div>
            <div className="post-caption">"{post.caption || post.text}"</div>
          </div>
        );

        return (
          <div key={bi} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
              {brand.name}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {hasIG && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--violet-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    Instagram
                  </h3>
                  {brand.instagram.topPosts?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: 'var(--green-400)', marginBottom: 8, fontWeight: 600 }}>🔥 Top Performing</div>
                      {brand.instagram.topPosts.map((p, i) => renderPost(p, i, 'instagram'))}
                    </div>
                  )}
                  {brand.instagram.worstPosts?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--red-400)', marginBottom: 8, fontWeight: 600 }}>📉 Worst Performing</div>
                      {brand.instagram.worstPosts.map((p, i) => renderPost(p, i, 'instagram'))}
                    </div>
                  )}
                </div>
              )}

              {hasFB && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--blue-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    Facebook
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--green-400)', marginBottom: 8, fontWeight: 600 }}>🔥 Top Performing</div>
                  {brand.facebook.topPosts.map((p, i) => renderPost(p, i, 'facebook'))}
                </div>
              )}

              {hasLI && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--sky-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    LinkedIn
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Recent Posts</div>
                  {brand.linkedin.recentPosts.map((p, i) => renderPost(p, i, 'linkedin'))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportTab({ analysisText }) {
  let data = null;
  try {
    const cleanJson = analysisText.replace(/```json/gi, '').replace(/```/g, '').trim();
    data = JSON.parse(cleanJson);
  } catch (e) {
    // Fallback
  }

  if (!data || !data.brandPositioning) {
    return (
      <div id="report-container" className="ai-report fade-in" style={{ padding: '0 12px' }}>
        <p>Run a new audit to generate the presentation matrices.</p>
      </div>
    );
  }

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
    color: '#333333',
    fontFamily: 'Inter, system-ui, sans-serif',
    marginBottom: 60,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const thStyles = {
    background: '#ea580c',
    color: '#ffffff',
    padding: '16px 20px',
    fontWeight: 600,
    fontSize: 14,
    textAlign: 'center',
    border: '1px solid #fdba74'
  };

  const tdStyles = {
    padding: '20px',
    border: '1px solid #fdba74',
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: 'center',
    verticalAlign: 'middle'
  };

  const categoryThStyles = {
    ...tdStyles,
    fontWeight: 700,
    color: '#ea580c',
    background: '#fffcf9'
  };

  const renderPlatformTable = (platformName, icon, platformData) => {
    if (!platformData || platformData.length === 0) return null;
    return (
      <div style={{ marginBottom: 60, pageBreakInside: 'avoid' }}>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={{...thStyles, width: '20%'}}>Brand</th>
              <th style={{...thStyles, width: '20%'}}>Platform</th>
              <th style={{...thStyles, width: '30%'}}>Content Formats<br/>(Last 3 months)</th>
              <th style={{...thStyles, width: '30%'}}>Content Themes</th>
            </tr>
          </thead>
          <tbody>
            {platformData.map((row, i) => (
              <tr key={i}>
                <td style={{...tdStyles, fontWeight: 700, fontSize: 16}}>{row.brand}</td>
                {i === 0 && (
                  <td rowSpan={platformData.length} style={{...tdStyles, background: '#fffcf9', fontSize: 32}}>
                    {icon}
                  </td>
                )}
                <td style={tdStyles}>{row.formats}</td>
                <td style={tdStyles}>{row.themes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="report-container" className="ai-report fade-in" style={{ padding: '40px', background: '#f8fafc', borderRadius: 12 }}>
      
      {/* BRAND POSITIONING MATRIX */}
      <div style={{ marginBottom: 60, pageBreakInside: 'avoid' }}>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={{...tdStyles, width: '20%', background: '#ffffff', color: '#111827', fontWeight: 700, borderBottom: '2px solid #ea580c'}}>Category</th>
              {data.brandPositioning.map((b, i) => (
                <th key={i} style={{...tdStyles, background: '#ffffff', color: '#111827', fontWeight: 700, borderBottom: '2px solid #ea580c', fontSize: 16}}>
                  {b.brand}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={categoryThStyles}>Core Communication Line</td>
              {data.brandPositioning.map((b, i) => <td key={i} style={tdStyles}>{b.communicationLine}</td>)}
            </tr>
            <tr>
              <td style={categoryThStyles}>Tonality</td>
              {data.brandPositioning.map((b, i) => <td key={i} style={tdStyles}>{b.tonality}</td>)}
            </tr>
            <tr>
              <td style={categoryThStyles}>Positioning</td>
              {data.brandPositioning.map((b, i) => <td key={i} style={tdStyles}>{b.positioning}</td>)}
            </tr>
            <tr>
              <td style={categoryThStyles}>Communication Themes</td>
              {data.brandPositioning.map((b, i) => <td key={i} style={tdStyles}>{b.communicationThemes}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* PLATFORM STRATEGY MATRICES */}
      {renderPlatformTable('Instagram', '📸', data.platformStrategy?.instagram)}
      {renderPlatformTable('Facebook', '📘', data.platformStrategy?.facebook)}
      {renderPlatformTable('LinkedIn', '💼', data.platformStrategy?.linkedin)}

    </div>
  );
}

export default function ResultsScreen({ brandMetrics, analysisText, config, onReset }) {
  const [activeTab, setActiveTab] = useState('overview');

  const platformsList = [];
  if (config.platforms.instagram) platformsList.push('Instagram');
  if (config.platforms.facebook) platformsList.push('Facebook');
  if (config.platforms.linkedin) platformsList.push('LinkedIn');

  const handleExportPDF = () => {
    // We use the browser's native print engine to generate a flawless PDF.
    // The @media print CSS rules will automatically hide the interactive UI
    // and expand the hidden print-only container.
    window.print();
  };

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'content', label: '📝 Content Analysis' },
    { key: 'report', label: '🤖 AI Strategic Report' },
  ];

  return (
    <div className="fade-in">
      
      {/* ── INTERACTIVE WEB UI (Hidden during PDF export) ── */}
      <div className="no-print">
        <div className="tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab brandMetrics={brandMetrics} />}
        {activeTab === 'content' && <ContentTab brandMetrics={brandMetrics} />}
        {activeTab === 'report' && <ReportTab analysisText={analysisText} />}

        <div className="export-bar">
          <button className="btn btn-primary btn-lg" onClick={handleExportPDF}>
            📄 Export PDF Report
          </button>
          <button className="btn btn-secondary" onClick={onReset}>
            🔄 New Audit
          </button>
        </div>
      </div>

      {/* ── FULL PDF EXPORT LAYOUT (Visible only during PDF export) ── */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 40, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>Competitive Social Media Audit</h1>
          <p style={{ fontSize: 20, color: '#ea580c', margin: 0 }}>{config.clientName} | {config.industry}</p>
        </div>
        
        <OverviewTab brandMetrics={brandMetrics} />
        
        <div style={{ pageBreakBefore: 'always', paddingTop: 40 }} />
        <div style={{ padding: '0 0 16px 0', borderBottom: '2px solid #ea580c', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Content Analysis</h2>
        </div>
        <ContentTab brandMetrics={brandMetrics} />
        
        <div style={{ pageBreakBefore: 'always', paddingTop: 40 }} />
        <div style={{ padding: '0 0 16px 0', borderBottom: '2px solid #ea580c', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Strategic Presentation Matrices</h2>
        </div>
        <ReportTab analysisText={analysisText} />
      </div>

    </div>
  );
}
