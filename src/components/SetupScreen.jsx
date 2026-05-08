import { useState } from 'react';
import { INDUSTRY_OPTIONS } from '../utils/knowledgeBase';

export default function SetupScreen({ onNext }) {
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('');
  const [platforms, setPlatforms] = useState({ instagram: true, facebook: true, linkedin: true });

  const togglePlatform = (p) => setPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
  const anyPlatform = platforms.instagram || platforms.facebook || platforms.linkedin;
  const canProceed = clientName.trim() && industry && anyPlatform;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div className="icon violet">🎯</div>
          <div>
            <h3>Audit Setup</h3>
            <p>Configure your competitive analysis</p>
          </div>
        </div>

        <div className="form-group">
          <label>Client Brand Name</label>
          <input
            type="text"
            placeholder="e.g. DigiChefs"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Industry Category</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}>
            <option value="">Select industry...</option>
            {INDUSTRY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Platforms to Analyze</label>
          <div className="checkbox-group">
            {[
              { key: 'instagram', emoji: '📸', label: 'Instagram' },
              { key: 'facebook', emoji: '📘', label: 'Facebook' },
              { key: 'linkedin', emoji: '💼', label: 'LinkedIn' },
            ].map(p => (
              <div
                key={p.key}
                className={`checkbox-item ${platforms[p.key] ? 'active' : ''}`}
                onClick={() => togglePlatform(p.key)}
              >
                <div className="check">{platforms[p.key] ? '✓' : ''}</div>
                <span>{p.emoji} {p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button
          className="btn btn-primary btn-lg"
          disabled={!canProceed}
          onClick={() => onNext({ clientName: clientName.trim(), industry, platforms })}
        >
          Continue to Brand Inputs →
        </button>
      </div>
    </div>
  );
}
