import { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '../types';

interface LandingPageProps {
  onResult: (data: AnalysisResult) => void;
}

const SAMPLE_URLS = [
  'https://youtube.com/watch?v=k7Z-rW8jZ7Q',
  'https://youtube.com/watch?v=3dYqXmB_78k',
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
];

export default function LandingPage({ onResult }: LandingPageProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleIdx, setSampleIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url }),
      });
      const ct = response.headers.get('content-type');
      if (!ct?.includes('application/json')) {
        throw new Error('Server returned non-JSON. Is the backend running?');
      }
      const data = await response.json();
      setLoading(false);
      if (!response.ok) { setError(data?.error || 'Unknown error'); return; }
      onResult(data);
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Network error. Is the backend running?');
    }
  };

  const pasteSample = () => {
    const next = (sampleIdx + 1) % SAMPLE_URLS.length;
    setSampleIdx(next);
    setUrl(SAMPLE_URLS[next]);
    inputRef.current?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="orb-cyan" />
      <div className="orb-violet" />
      <div className="scanline-anim" />

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(5,8,22,0.9)', backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
        }}>
          <div className="loader" />
          <div style={{ textAlign: 'center' }}>
            <p className="mono" style={{ color: '#22D3EE', fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.08em', marginBottom: '4px' }}>
              PARSING COMMENT TREES...
            </p>
            <p className="mono" style={{ color: '#334155', fontSize: '0.6875rem' }}>
              NEURAL SYNTHESIS IN PROGRESS
            </p>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(30,41,88,0.6)',
        background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 1.5rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="chamfer-sm" style={{
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#22D3EE,#8B5CF6)',
              boxShadow: '0 0 15px rgba(34,211,238,0.35)',
            }}>
              <svg width="20" height="20" fill="none" stroke="#050816" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" />
                <rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.05em', color: '#fff' }}>
                  YT // <span style={{ background: 'linear-gradient(90deg,#22D3EE,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EMOTION.AI</span>
                </span>
                <span className="mono" style={{ fontSize: '0.5625rem', padding: '2px 6px', border: '1px solid rgba(34,211,238,0.35)', borderRadius: '4px', color: '#22D3EE', background: 'rgba(34,211,238,0.06)' }}>v2.4-PRO</span>
              </div>
              <div className="mono" style={{ fontSize: '0.5625rem', letterSpacing: '0.15em', color: '#475569', marginTop: '1px' }}>COMMENT SENTIMENT MATRIX</div>
            </div>
          </div>

          {/* Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '4px', background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)', fontSize: '0.6875rem', color: '#22D3EE' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', animation: 'pulseSlow 2s infinite', display: 'inline-block' }} />
              <span style={{ color: '#10B981', fontWeight: 700 }}>● ONLINE</span>
              <span style={{ color: '#334155' }}>|</span>
              <span>API READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── TELEMETRY RIBBON ── */}
      <div className="tele-ribbon" style={{ position: 'sticky', top: '80px', zIndex: 40 }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.6875rem', color: '#22D3EE', fontWeight: 700, letterSpacing: '0.08em' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22D3EE', display: 'inline-block', animation: 'pulseSlow 1.5s infinite' }} />
            [ LIVE SYSTEM STATUS // YT EMOTION ANALYZER ]
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="sent-bar-stack" style={{ width: '160px' }}>
              <div style={{ width: '68%', background: '#10B981', borderRadius: '1px', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
              <div style={{ width: '21%', background: '#38BDF8', borderRadius: '1px' }} />
              <div style={{ width: '11%', background: '#F43F5E', borderRadius: '1px' }} />
            </div>
            <div className="mono" style={{ display: 'flex', gap: '1rem', fontSize: '0.6875rem' }}>
              <span style={{ color: '#10B981' }}>● 68% POS</span>
              <span style={{ color: '#38BDF8' }}>● 21% NEU</span>
              <span style={{ color: '#F43F5E' }}>● 11% CRIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section style={{ padding: '3.5rem 0 5rem', position: 'relative' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'stretch' }} className="hero-grid">
            
            {/* LEFT: Copy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: '#A78BFA', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                  <span style={{ color: '#22D3EE' }}>✦</span> YT AUDIENCE EMOTION MATRIX // SYS.ONLINE
                </div>
                <h1 style={{ fontSize: 'clamp(2.25rem,5vw,3.75rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#fff', marginBottom: '1.25rem' }}>
                  Understand What Your Audience<br />
                  <span style={{ background: 'linear-gradient(90deg,#22D3EE,#A78BFA,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Actually Feels.
                  </span>
                </h1>
                <p style={{ fontSize: '1.0625rem', color: '#94a3b8', lineHeight: 1.75, fontWeight: 300, maxWidth: '38rem' }}>
                  Transform thousands of unstructured YouTube comments into precise psychological sentiment maps, pinpointing audience affection, friction, and hidden behavioral triggers in real-time.
                </p>
              </div>

              {/* KPI Rail */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingTop: '0.5rem' }}>
                {[
                  { val: '99.4%', label: 'Semantic Accuracy', color: '#22D3EE' },
                  { val: '14.8M+', label: 'Comments Parsed', color: '#A78BFA' },
                  { val: '< 3.2s', label: 'Synthesis Speed', color: '#10B981' },
                ].map(k => (
                  <div key={k.label} className="chamfer-sm" style={{ padding: '14px', background: 'rgba(13,19,45,0.8)', border: '1px solid var(--cyber-border)' }}>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: k.color, marginBottom: '2px' }}>{k.val}</div>
                    <div className="mono" style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Input Panel */}
            <div id="analyzer-engine" style={{ position: 'relative' }}>
              <div className="cyber-frame chamfer" style={{ boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>
                <div className="cyber-frame-inner chamfer" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Decorative number */}
                  <div className="mono" style={{ position: 'absolute', right: '-1rem', bottom: '-1rem', fontSize: '6rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)', userSelect: 'none', pointerEvents: 'none' }}>01</div>

                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cyber-border)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', background: '#22D3EE', borderRadius: '2px', animation: 'pulseSlow 2s infinite', display: 'inline-block' }} />
                      <span className="mono" style={{ fontSize: '0.625rem', color: '#22D3EE', fontWeight: 700, letterSpacing: '0.1em' }}>[ STREAM_INPUT // BUFFER: 4K TOKENS ]</span>
                    </div>
                    {/* Waveform */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px' }}>
                      {[8, 16, 12, 16, 6, 14, 10].map((h, i) => (
                        <div key={i} className="wave-bar" style={{ width: '3px', height: `${h}px`, background: i % 2 === 0 ? '#22D3EE' : '#8B5CF6', borderRadius: '1px', animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      <span>TARGET YOUTUBE CONTENT URL</span>
                      <span style={{ color: '#22D3EE' }}>SUPPORTS VIDEOS &amp; SHORTS</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#F43F5E', zIndex: 1 }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                        <input
                          ref={inputRef}
                          id="youtubeLinkInput"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          required
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          style={{ width: '100%', height: '48px', paddingLeft: '44px', paddingRight: '90px', fontSize: '0.8125rem', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={pasteSample}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px 10px', background: 'var(--cyber-surface)', border: '1px solid var(--cyber-border)', borderRadius: '4px', fontSize: '0.625rem', color: '#94a3b8' }}
                          className="mono"
                        >
                          Sample
                        </button>
                      </div>

                      {/* Mode Selection */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                        {[
                          { label: 'Deep Semantic', sub: 'All comments + reply trees', active: true, color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.4)' },
                          { label: 'Fast Snapshot', sub: 'Top 1,000 algorithmic tier', active: false, color: 'rgba(30,41,88,0.3)', border: 'var(--cyber-border)' },
                        ].map(m => (
                          <div key={m.label} style={{ padding: '10px', background: m.color, border: `1px solid ${m.border}`, borderRadius: '4px', cursor: 'pointer' }}>
                            <div className="mono" style={{ fontSize: '0.6875rem', fontWeight: 600, color: m.active ? '#f1f5f9' : '#94a3b8', marginBottom: '2px' }}>{m.label}</div>
                            <div className="mono" style={{ fontSize: '0.5625rem', color: '#475569' }}>{m.sub}</div>
                          </div>
                        ))}
                      </div>

                      <button
                        id="analyzeButton"
                        type="submit"
                        disabled={loading}
                        className="btn-primary chamfer-sm"
                        style={{ width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.6 : 1 }}
                      >
                        <svg width="18" height="18" fill="#050816" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        INITIATE NEURAL ANALYSIS ⚡
                      </button>
                    </form>
                  </div>

                  {/* Mini Sentiment Preview */}
                  <div style={{ padding: '12px', background: 'rgba(5,8,22,0.8)', border: '1px solid var(--cyber-border)', borderRadius: '4px' }}>
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#475569', marginBottom: '8px' }}>
                      <span>LIVE CACHED SAMPLE SENTIMENT</span>
                      <span style={{ color: '#22D3EE', fontWeight: 700 }}>18,420 PARSED</span>
                    </div>
                    <div className="sent-bar-stack" style={{ width: '100%', marginBottom: '8px' }}>
                      <div style={{ width: '68%', background: '#10B981', borderRadius: '1px', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                      <div style={{ width: '21%', background: '#38BDF8', borderRadius: '1px' }} />
                      <div style={{ width: '11%', background: '#F43F5E', borderRadius: '1px' }} />
                    </div>
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem' }}>
                      <span style={{ color: '#10B981' }}>● Positive 68%</span>
                      <span style={{ color: '#38BDF8' }}>● Neutral 21%</span>
                      <span style={{ color: '#F43F5E' }}>● Critical 11%</span>
                    </div>
                  </div>

                  {error && <div className="error-msg"><strong>Error:</strong> {error}</div>}
                </div>
              </div>
              {/* Corner accents */}
              <div className="mono" style={{ position: 'absolute', top: '-8px', left: '-8px', color: '#22D3EE', fontSize: '1rem', pointerEvents: 'none' }}>+</div>
              <div className="mono" style={{ position: 'absolute', bottom: '-8px', right: '-8px', color: '#8B5CF6', fontSize: '1rem', pointerEvents: 'none' }}>+</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PIPELINE STAGES ── */}
      <section style={{ padding: '3.5rem 0', borderTop: '1px solid var(--cyber-border)', borderBottom: '1px solid var(--cyber-border)', background: 'rgba(8,11,26,0.6)' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(30,41,88,0.5)' }}>
            <div>
              <div className="mono" style={{ fontSize: '0.625rem', color: '#22D3EE', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>[ 4-STAGE PIPELINE ]</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Autonomous Emotional Synthesis</h2>
            </div>
            <div className="mono" style={{ fontSize: '0.625rem', color: '#334155', display: 'none' }}>FLOW: INGEST ➔ SCRUB ➔ CLASSIFY ➔ SYNTHESIZE</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {[
              { stage: 'STAGE_01', color: '#22D3EE', border: 'rgba(34,211,238,0.35)', bg: 'rgba(34,211,238,0.06)', title: 'Stream Ingestion', desc: 'Fetches complete comment chains, reply nodes, and engagement timestamps via streaming buffer.', status: 'READY ➔ STAGE_02' },
              { stage: 'STAGE_02', color: '#A78BFA', border: 'rgba(167,139,250,0.35)', bg: 'rgba(139,92,246,0.06)', title: 'Noise Filtering', desc: 'Cleans bot spam, ASCII spam, self-promotion, and multi-language gibberish via heuristic filters.', status: 'PASSED ➔ STAGE_03' },
              { stage: 'STAGE_03', color: '#38BDF8', border: 'rgba(56,189,248,0.35)', bg: 'rgba(14,165,233,0.06)', title: 'Emotion Spectrum', desc: "Classifies comments across Plutchik's 8 emotional axes: Joy, Surprise, Trust, Frustration, and Awe.", status: 'VECTORS ➔ STAGE_04' },
              { stage: 'STAGE_04', color: '#10B981', border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.06)', title: 'Creator Intelligence', desc: 'Produces actionable editorial dossiers highlighting exact retention spikes and audience pain points.', status: 'FINALIZED ➔ DASHBOARD' },
            ].map(s => (
              <div key={s.stage} className="stage-card chamfer-sm" style={{ borderColor: s.border, background: `${s.bg}` }}>
                <div className="mono" style={{ fontSize: '0.625rem', color: s.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ padding: '2px 6px', borderRadius: '3px', background: `${s.bg}`, border: `1px solid ${s.border}` }}>SYS.{s.stage}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p>
                </div>
                <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(30,41,88,0.5)', display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="mono" style={{ fontSize: '0.5625rem', color: s.color }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--cyber-border)', background: '#03050F', padding: '3rem 0' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div className="mono" style={{ fontSize: '0.625rem', color: '#334155', letterSpacing: '0.08em' }}>
              © 2025 YT // EMOTION.AI MATRIX. ALL RIGHTS RESERVED.
            </div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: '#22D3EE' }}>
              SYSTEM_UPTIME: 99.994% // NODE_CLUSTER: FRA-01
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 1024px) {
          .hero-grid { grid-template-columns: 7fr 5fr !important; }
        }
      `}</style>
    </div>
  );
}
