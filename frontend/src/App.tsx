import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Cpu,
  Zap,
  Mail,
  RefreshCw,
  Play,
  Square,
  Server,
  Layers,
  Code2,
  Sliders,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface PredictionResponse {
  prediction: string;
  confidence: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  protocol: string;
  sttl: number;
  total_len: number;
  prediction: string;
  confidence: number;
  latencyMs: number;
}

const PRESETS = [
  {
    name: 'Benign HTTP Traffic',
    protocol: 'tcp',
    sttl: 64,
    total_len: 1500,
    desc: 'Standard Linux/Unix web request'
  },
  {
    name: 'SYN Probe / Port Scan',
    protocol: 'tcp',
    sttl: 48,
    total_len: 40,
    desc: 'Minimal header SYN packet'
  },
  {
    name: 'UDP Flood Spike',
    protocol: 'udp',
    sttl: 254,
    total_len: 1400,
    desc: 'High TTL fragmented burst'
  },
  {
    name: 'DNS Query / Anomaly',
    protocol: 'udp',
    sttl: 128,
    total_len: 68,
    desc: 'Windows standard DNS lookup'
  },
  {
    name: 'Custom Protocol Ping',
    protocol: 'other',
    sttl: 32,
    total_len: 84,
    desc: 'ICMP / custom IoT signaling'
  }
];

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function App() {
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000');
  const [protocol, setProtocol] = useState<'tcp' | 'udp' | 'other'>('tcp');
  const [sttl, setSttl] = useState<number>(64);
  const [totalLen, setTotalLen] = useState<number>(1500);

  const [loading, setLoading] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{
    prediction: string;
    confidence: number;
    latencyMs: number;
    timestamp: string;
    payload: { protocol_m: string; sttl: number; total_len: number };
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Health check API
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/`);
      if (res.ok) {
        const data = await res.json();
        setApiConnected(true);
        if (data.classes && Array.isArray(data.classes)) {
          setAvailableClasses(data.classes);
        }
      } else {
        setApiConnected(false);
      }
    } catch {
      setApiConnected(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const runPrediction = async (
    customProtocol = protocol,
    customSttl = sttl,
    customTotalLen = totalLen
  ) => {
    setLoading(true);
    setErrorMsg(null);
    const start = performance.now();
    const payload = {
      protocol_m: customProtocol,
      sttl: Number(customSttl),
      total_len: Number(customTotalLen)
    };

    try {
      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const end = performance.now();
      const latencyMs = Math.round(end - start);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API returned ${res.status}: ${errText}`);
      }

      const data: PredictionResponse = await res.json();
      const timestamp = new Date().toLocaleTimeString();

      const resultObj = {
        prediction: data.prediction,
        confidence: data.confidence,
        latencyMs,
        timestamp,
        payload
      };

      setLastResult(resultObj);
      setHistory(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp,
          protocol: customProtocol,
          sttl: customSttl,
          total_len: customTotalLen,
          prediction: data.prediction,
          confidence: data.confidence,
          latencyMs
        },
        ...prev.slice(0, 49)
      ]);
      setApiConnected(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend';
      setErrorMsg(message);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Continuous live simulation loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isSimulating) {
      timer = setInterval(() => {
        const randomPreset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
        const jitterSttl = Math.max(1, randomPreset.sttl + Math.floor(Math.random() * 9 - 4));
        const jitterLen = Math.max(20, randomPreset.total_len + Math.floor(Math.random() * 200 - 100));
        
        runPrediction(
          randomPreset.protocol as 'tcp' | 'udp' | 'other',
          jitterSttl,
          jitterLen
        );
      }, 1400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, apiUrl, protocol, sttl, totalLen]);

  // Aggregate Stats
  const totalScanned = history.length;
  const threatCount = history.filter(h => h.prediction.toLowerCase() !== 'normal' && h.prediction.toLowerCase() !== 'benign').length;
  const safePercentage = totalScanned > 0 ? Math.round(((totalScanned - threatCount) / totalScanned) * 100) : 100;
  const avgLatency = totalScanned > 0 ? Math.round(history.reduce((a, b) => a + b.latencyMs, 0) / totalScanned) : 0;

  const isSafeVerdict = (pred: string) => {
    const low = pred.toLowerCase();
    return low === 'normal' || low === 'benign';
  };

  return (
    <div className="app-container">
      {/* SaaS Top Navigation */}
      <header className="navbar">
        <div className="nav-content">
          <div className="brand-badge-container">
            <div className="brand-logo-icon">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="brand-text">
                NetShield AI
                <span className="brand-tag">IoT Intrusion Engine</span>
              </div>
            </div>
          </div>

          <div className="nav-links">
            {/* Live Model Status */}
            <div className={`live-indicator ${apiConnected ? 'online' : 'offline'}`}>
              <span className="pulse-dot"></span>
              {apiConnected ? 'API Connected' : 'API Offline'}
            </div>

            {/* Author Profile Links */}
            <a
              href="https://github.com/kleofr"
              target="_blank"
              rel="noopener noreferrer"
              className="author-pill"
              title="GitHub Profile"
            >
              <GithubIcon size={14} />
              <span>kleofr</span>
            </a>

            <a
              href="mailto:morehimanish@gmail.com"
              className="author-pill"
              title="Contact Developer"
            >
              <Mail size={14} />
              <span>morehimanish@gmail.com</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-layout">
        {/* Hero Section */}
        <div className="hero-header">
          <div className="hero-title-row">
            <div>
              <h1 className="hero-title">Network Packet Anomaly Inspector</h1>
              <p className="hero-subtitle">
                Enterprise ML inference interface for real-time IoT network intrusion detection and packet telemetry scoring via <code>/predict</code>.
              </p>
            </div>

            {/* API Endpoint Config & Simulation toggle */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="chip-btn"
                style={{
                  background: isSimulating ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  borderColor: isSimulating ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)',
                  color: isSimulating ? '#f87171' : '#a5b4fc',
                  fontWeight: 600
                }}
              >
                {isSimulating ? <Square size={13} /> : <Play size={13} />}
                {isSimulating ? 'Stop Live Stream' : 'Auto Stream Simulation'}
              </button>

              <button
                onClick={checkHealth}
                className="chip-btn"
                title="Refresh API Connection"
              >
                <RefreshCw size={13} />
                Health Check
              </button>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Inspected</span>
              <span className="stat-value">{totalScanned}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <ShieldAlert size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Intrusions Caught</span>
              <span className="stat-value">{threatCount}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <ShieldCheck size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Safe Traffic Ratio</span>
              <span className="stat-value">{safePercentage}%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Inference Latency</span>
              <span className="stat-value">{lastResult ? `${lastResult.latencyMs}ms` : `${avgLatency}ms`}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Core Workspace */}
        <div className="dashboard-grid">
          {/* Left Panel: Packet Feature Configurator */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders size={18} color="#818cf8" />
                Packet Telemetry Parameters
              </div>
              <span className="form-badge">POST /predict</span>
            </div>

            <div className="panel-body">
              {/* Endpoint Override */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Backend Host URL</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FastAPI Gateway</span>
                </div>
                <input
                  type="text"
                  className="text-input"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                />
              </div>

              {/* Protocol Selector */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Transport Protocol (<code>protocol_m</code>)</label>
                  <span className="form-badge">{protocol.toUpperCase()}</span>
                </div>
                <div className="segmented-control">
                  {(['tcp', 'udp', 'other'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`segment-btn ${protocol === p ? 'active' : ''}`}
                      onClick={() => setProtocol(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* STTL Slider & Numeric */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Source-to-Destination TTL (<code>sttl</code>)</label>
                  <span className="form-badge">{sttl} hops</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={1}
                  max={255}
                  value={sttl}
                  onChange={e => setSttl(Number(e.target.value))}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                  {[32, 64, 128, 255].map(presetTtl => (
                    <button
                      key={presetTtl}
                      type="button"
                      className="chip-btn"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setSttl(presetTtl)}
                    >
                      TTL {presetTtl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Packet Length */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Total Packet Length (<code>total_len</code>)</label>
                  <span className="form-badge">{totalLen} Bytes</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={20}
                  max={9000}
                  step={10}
                  value={totalLen}
                  onChange={e => setTotalLen(Number(e.target.value))}
                />
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  {[40, 68, 512, 1460, 1500, 9000].map(presetLen => (
                    <button
                      key={presetLen}
                      type="button"
                      className="chip-btn"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setTotalLen(presetLen)}
                    >
                      {presetLen}B
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets Section */}
              <div className="presets-section">
                <span className="presets-label">Attack & Anomaly Scenario Presets:</span>
                <div className="presets-chips">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      className="chip-btn"
                      onClick={() => {
                        setProtocol(preset.protocol as 'tcp' | 'udp' | 'other');
                        setSttl(preset.sttl);
                        setTotalLen(preset.total_len);
                      }}
                      title={preset.desc}
                    >
                      <Sparkles size={12} color="#a5b4fc" />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: '#f87171',
                  fontSize: '0.82rem'
                }}>
                  <strong>Connection Error:</strong> {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => runPrediction()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="pulse-dot" />
                    Executing Inference...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Classify Packet (/predict)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Inference Verdict & Inspection */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Cpu size={18} color="#34d399" />
                Live Classification Verdict
              </div>
              {lastResult && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {lastResult.timestamp}
                </span>
              )}
            </div>

            <div className="panel-body">
              {lastResult ? (
                <div className="result-box">
                  {/* Hero Verdict Banner */}
                  <div className={`result-badge-hero ${isSafeVerdict(lastResult.prediction) ? 'safe' : 'danger'}`}>
                    <div className="result-badge-title">
                      {isSafeVerdict(lastResult.prediction) ? (
                        <ShieldCheck size={26} />
                      ) : (
                        <ShieldAlert size={26} />
                      )}
                      <span>{lastResult.prediction}</span>
                    </div>
                    <span className="result-badge-tag">
                      {isSafeVerdict(lastResult.prediction) ? 'CLEARED' : 'MALICIOUS THREAT'}
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="confidence-wrapper">
                    <div className="confidence-header">
                      <span>Model Confidence</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {(lastResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="confidence-bar-bg">
                      <div
                        className={`confidence-bar-fill ${isSafeVerdict(lastResult.prediction) ? 'safe' : 'danger'}`}
                        style={{ width: `${Math.min(100, lastResult.confidence * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Key Metrics Breakdown */}
                  <div className="metrics-row">
                    <div className="metric-box">
                      <span className="metric-key">Protocol</span>
                      <span className="metric-val">{lastResult.payload.protocol_m.toUpperCase()}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-key">Hop TTL</span>
                      <span className="metric-val">{lastResult.payload.sttl}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-key">Frame Size</span>
                      <span className="metric-val">{lastResult.payload.total_len} B</span>
                    </div>
                  </div>

                  {/* JSON Payload & Response Inspection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        RAW API PAYLOAD & RESPONSE
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                        {lastResult.latencyMs} ms
                      </span>
                    </div>
                    <pre className="json-box">
                      {JSON.stringify(
                        {
                          request: lastResult.payload,
                          response: {
                            prediction: lastResult.prediction,
                            confidence: lastResult.confidence
                          }
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px dashed var(--border-subtle)'
                  }}>
                    <Zap size={24} color="var(--text-muted)" />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.35rem' }}>No Inferences Yet</h3>
                  <p style={{ fontSize: '0.82rem', maxWidth: 300 }}>
                    Configure telemetry parameters on the left or select a preset scenario to evaluate against the ML model.
                  </p>
                </div>
              )}

              {/* Model Info Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={15} color="#818cf8" />
                  <span>Classes: {availableClasses.length > 0 ? availableClasses.join(', ') : 'Binary / Multi-class'}</span>
                </div>
                <a
                  href={`${apiUrl}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                >
                  Swagger Docs <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* History Stream Table */}
        <div className="panel-card history-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={18} color="#818cf8" />
              Real-time Ingress Stream & Audit Trail
            </div>
            {history.length > 0 && (
              <button
                type="button"
                className="chip-btn"
                onClick={() => setHistory([])}
                style={{ fontSize: '0.72rem' }}
              >
                Clear History
              </button>
            )}
          </div>

          <div className="table-responsive">
            {history.length > 0 ? (
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Protocol</th>
                    <th>STTL</th>
                    <th>Packet Size</th>
                    <th>Verdict</th>
                    <th>Confidence</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{item.timestamp}</td>
                      <td>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#e2e8f0'
                        }}>
                          {item.protocol.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.sttl}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.total_len} B</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: isSafeVerdict(item.prediction) ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
                          color: isSafeVerdict(item.prediction) ? '#34d399' : '#f87171',
                          border: `1px solid ${isSafeVerdict(item.prediction) ? 'var(--color-safe-border)' : 'var(--color-danger-border)'}`
                        }}>
                          {item.prediction}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{(item.confidence * 100).toFixed(1)}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{item.latencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No packets processed in the current session. Run a single prediction or start the auto stream simulation above.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SaaS Minimal Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={16} color="#818cf8" />
            <span>NetShield AI &bull; IoT Intrusion Detection Platform</span>
          </div>

          <div className="footer-links">
            <a
              href="https://github.com/kleofr"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <GithubIcon size={14} />
              <span>GitHub: @kleofr</span>
            </a>

            <a
              href="mailto:morehimanish@gmail.com"
              className="footer-link"
            >
              <Mail size={14} />
              <span>morehimanish@gmail.com</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
