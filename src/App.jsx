import { useState, useCallback } from 'react';
import './index.css';
import SetupScreen from './components/SetupScreen';
import BrandInputsScreen from './components/BrandInputsScreen';
import RunningScreen from './components/RunningScreen';
import ResultsScreen from './components/ResultsScreen';
import { fetchBrandData } from './utils/apify';
import { calculateInstagramMetrics, calculateFacebookMetrics, calculateLinkedInMetrics } from './utils/metrics';
import { buildAnalysisPrompt } from './utils/promptBuilder';
import { runGeminiAnalysis } from './utils/gemini';

const STEPS = [
  { label: 'Setup', key: 'setup' },
  { label: 'Brand Inputs', key: 'inputs' },
  { label: 'Running', key: 'running' },
  { label: 'Results', key: 'results' },
];

function StepsBar({ currentStep }) {
  const idx = STEPS.findIndex(s => s.key === currentStep);
  return (
    <div className="steps">
      {STEPS.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`step ${i === idx ? 'active' : ''} ${i < idx ? 'completed' : ''}`}>
            <div className="step-dot">{i < idx ? '✓' : i + 1}</div>
            <span className="step-label">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [runStatus, setRunStatus] = useState('fetching');
  const [brandMetrics, setBrandMetrics] = useState([]);
  const [analysisText, setAnalysisText] = useState('');

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev, msg]);
  }, []);

  const handleSetupDone = (cfg) => {
    setConfig(cfg);
    setScreen('inputs');
  };

  const handleInputsDone = async ({ client, competitors }) => {
    setScreen('running');
    setLogs([]);
    setProgress(0);
    setRunStatus('fetching');

    const allBrands = [client, ...competitors];
    const totalSteps = allBrands.length + 2; // fetch each brand + calculate + analyze
    let step = 0;

    try {
      // 1. Fetch data for each brand
      const rawData = [];
      for (const brand of allBrands) {
        addLog(`── Fetching data for ${brand.name} ──`);
        const data = await fetchBrandData(brand, config.platforms, addLog);
        rawData.push({ ...brand, ...data });
        step++;
        setProgress((step / totalSteps) * 100);
      }

      // 2. Calculate metrics locally
      setRunStatus('calculating');
      addLog('── Calculating metrics locally ──');
      
      const metricsData = rawData.map(brand => {
        const result = { name: brand.name };
        
        if (brand.instagramProfile || brand.instagramPosts) {
          result.instagram = calculateInstagramMetrics(brand.instagramProfile, brand.instagramPosts);
        }
        if (brand.facebookProfile || brand.facebookPosts) {
          result.facebook = calculateFacebookMetrics(brand.facebookProfile, brand.facebookPosts);
        }
        if (brand.linkedinCompany) {
          result.linkedin = calculateLinkedInMetrics(brand.linkedinCompany);
        }
        
        return result;
      });
      
      setBrandMetrics(metricsData);
      step++;
      setProgress((step / totalSteps) * 100);
      addLog('✓ Metrics calculated successfully');

      // 3. Build prompt and run Gemini analysis
      setRunStatus('analyzing');
      addLog('── Building analysis prompt ──');
      
      const clientMetrics = metricsData[0];
      const competitorMetrics = metricsData.slice(1);
      const prompt = buildAnalysisPrompt(clientMetrics, competitorMetrics, config.industry);
      
      addLog(`Prompt built: ${prompt.length.toLocaleString()} characters`);
      
      const analysis = await runGeminiAnalysis(prompt, addLog);
      setAnalysisText(analysis);
      step++;
      setProgress(100);
      setRunStatus('done');
      addLog('✓ Competitive audit complete!');

      // Auto-advance to results after a short delay
      setTimeout(() => setScreen('results'), 1500);
    } catch (error) {
      setRunStatus('error');
      addLog(`✗ Fatal error: ${error.message}`);
    }
  };

  const handleReset = () => {
    setScreen('setup');
    setConfig(null);
    setLogs([]);
    setProgress(0);
    setRunStatus('fetching');
    setBrandMetrics([]);
    setAnalysisText('');
  };

  return (
    <>
      <div className="ambient-glow violet" />
      <div className="ambient-glow pink" />
      
      <div className="app-container">
        <header className="app-header">
          <div className="logo-badge">⚡ ChefsAI</div>
          <h1>Competitor Audit Bot</h1>
          <p>AI-powered competitive social media intelligence, built for strategists.</p>
        </header>

        <StepsBar currentStep={screen} />

        {screen === 'setup' && (
          <SetupScreen onNext={handleSetupDone} />
        )}
        
        {screen === 'inputs' && config && (
          <BrandInputsScreen
            config={config}
            onNext={handleInputsDone}
            onBack={() => setScreen('setup')}
          />
        )}
        
        {screen === 'running' && (
          <RunningScreen logs={logs} progress={progress} status={runStatus} />
        )}
        
        {screen === 'results' && (
          <ResultsScreen
            brandMetrics={brandMetrics}
            analysisText={analysisText}
            config={config}
            onReset={handleReset}
          />
        )}
      </div>
    </>
  );
}
