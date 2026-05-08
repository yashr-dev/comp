import { useState } from 'react';
import { calculateCredits } from '../utils/apify';

const TOTAL_CREDITS = 50;

function isValidUrl(string) {
  if (!string) return true; // empty is allowed (optional field)
  return string.startsWith('http://') || string.startsWith('https://');
}

function BrandForm({ brand, onChange, platforms, tag, onRemove }) {
  const fbError = platforms.facebook && brand.facebook && !isValidUrl(brand.facebook) 
    ? "Facebook URL must start with 'https://'" : null;
    
  const liError = platforms.linkedin && brand.linkedin && !isValidUrl(brand.linkedin)
    ? "LinkedIn URL must start with 'https://'" : null;

  return (
    <div className="brand-card">
      <div className="brand-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3>{brand.name || 'New Brand'}</h3>
          <span className={`brand-tag ${tag}`}>{tag}</span>
        </div>
        {onRemove && (
          <button className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
        )}
      </div>

      {tag === 'competitor' && (
        <div className="form-group">
          <label>Brand Name</label>
          <input
            type="text"
            placeholder="Competitor name"
            value={brand.name}
            onChange={e => onChange({ ...brand, name: e.target.value })}
          />
        </div>
      )}

      {platforms.instagram && (
        <div className="form-group">
          <label>📸 Instagram Handle</label>
          <input
            type="text"
            placeholder="@username (without @)"
            value={brand.instagram || ''}
            onChange={e => onChange({ ...brand, instagram: e.target.value.replace(/^@/, '') })}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
            We auto-extract the handle if you paste a full URL.
          </small>
        </div>
      )}

      {platforms.facebook && (
        <div className="form-group">
          <label>📘 Facebook Page URL</label>
          <input
            type="text"
            placeholder="https://facebook.com/pagename"
            value={brand.facebook || ''}
            style={fbError ? { borderColor: 'var(--red-500)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
            onChange={e => onChange({ ...brand, facebook: e.target.value })}
          />
          {fbError ? (
            <small style={{ color: 'var(--red-500)', fontSize: 11, marginTop: 4, display: 'block', fontWeight: 500 }}>
              {fbError}
            </small>
          ) : (
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
              Must be the full URL including https://
            </small>
          )}
        </div>
      )}

      {platforms.linkedin && (
        <div className="form-group">
          <label>💼 LinkedIn Company URL</label>
          <input
            type="text"
            placeholder="https://linkedin.com/company/name"
            value={brand.linkedin || ''}
            style={liError ? { borderColor: 'var(--red-500)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
            onChange={e => onChange({ ...brand, linkedin: e.target.value })}
          />
          {liError ? (
            <small style={{ color: 'var(--red-500)', fontSize: 11, marginTop: 4, display: 'block', fontWeight: 500 }}>
              {liError}
            </small>
          ) : (
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
              Must be the full URL including https://
            </small>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrandInputsScreen({ config, onNext, onBack }) {
  const [client, setClient] = useState({
    name: config.clientName,
    instagram: '',
    facebook: '',
    linkedin: '',
  });

  const [competitors, setCompetitors] = useState([
    { name: '', instagram: '', facebook: '', linkedin: '' },
  ]);

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, { name: '', instagram: '', facebook: '', linkedin: '' }]);
    }
  };

  const removeCompetitor = (i) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const updateCompetitor = (i, data) => {
    const updated = [...competitors];
    updated[i] = data;
    setCompetitors(updated);
  };

  const allBrands = [client, ...competitors];
  const credits = calculateCredits(allBrands, config.platforms);
  
  // Validation checks
  const hasInputs = competitors.some(c => c.name && (c.instagram || c.facebook || c.linkedin));
  const hasErrors = allBrands.some(b => 
    (config.platforms.facebook && b.facebook && !isValidUrl(b.facebook)) ||
    (config.platforms.linkedin && b.linkedin && !isValidUrl(b.linkedin))
  );
  const canProceed = hasInputs && !hasErrors;

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <BrandForm
        brand={client}
        onChange={setClient}
        platforms={config.platforms}
        tag="client"
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 12px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Competitors</h3>
        {competitors.length < 5 && (
          <button className="btn btn-secondary btn-sm" onClick={addCompetitor}>
            + Add Competitor
          </button>
        )}
      </div>

      {competitors.map((comp, i) => (
        <BrandForm
          key={i}
          brand={comp}
          onChange={(data) => updateCompetitor(i, data)}
          platforms={config.platforms}
          tag="competitor"
          onRemove={competitors.length > 1 ? () => removeCompetitor(i) : null}
        />
      ))}

      <div className="credit-banner">
        <div className="credit-info">
          <h4>Credit Usage Estimate</h4>
          <p>This audit will use {credits} of your {TOTAL_CREDITS} credits</p>
        </div>
        <div className="credit-count">{credits}/{TOTAL_CREDITS}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          disabled={!canProceed}
          onClick={() => onNext({ client, competitors: competitors.filter(c => c.name) })}
        >
          🚀 Run Audit ({credits} credits)
        </button>
      </div>
    </div>
  );
}
