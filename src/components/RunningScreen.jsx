import { useEffect, useRef } from 'react';

export default function RunningScreen({ logs, progress, status }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

  return (
    <div className="progress-container fade-in">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {status !== 'done' && status !== 'error' && (
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
        )}
        {status === 'done' && (
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        )}
        {status === 'error' && (
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        )}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {status === 'fetching' && 'Fetching Social Media Data...'}
          {status === 'calculating' && 'Calculating Metrics...'}
          {status === 'analyzing' && 'Running AI Strategic Analysis...'}
          {status === 'done' && 'Audit Complete!'}
          {status === 'error' && 'Something went wrong'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {status === 'analyzing' && 'Gemini 3.1 Pro Preview is analyzing your competitive landscape...'}
          {status === 'fetching' && 'Pulling data from Apify Actors...'}
          {status === 'done' && 'Your competitive audit report is ready.'}
        </p>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-status">{Math.round(progress)}% complete</div>

      <div className="progress-log" ref={logRef}>
        {logs.map((log, i) => (
          <div
            key={i}
            className={`line ${log.startsWith('✓') ? 'success' : ''} ${log.startsWith('✗') ? 'error' : ''}`}
          >
            <span className="time">[{getTime()}]</span>
            <span>{log}</span>
          </div>
        ))}
        {status !== 'done' && status !== 'error' && (
          <div className="line pulse">
            <span className="time">[{getTime()}]</span>
            <span>▋</span>
          </div>
        )}
      </div>
    </div>
  );
}
