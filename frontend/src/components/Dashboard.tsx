import { useRef, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { AnalysisResult } from '../types';
import CommentFeed from './CommentFeed';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps { data: AnalysisResult; onBack: () => void; }

const EMOTION_META: Record<string, { emoji: string; color: string; grad: string }> = {
  anger:    { emoji: '😡', color: '#F87171', grad: 'from-red-500 to-rose-400' },
  fear:     { emoji: '😨', color: '#A78BFA', grad: 'from-violet-500 to-purple-400' },
  joy:      { emoji: '😄', color: '#FBBF24', grad: 'from-yellow-400 to-amber-300' },
  sadness:  { emoji: '😢', color: '#60A5FA', grad: 'from-blue-500 to-sky-400' },
  disgust:  { emoji: '🤢', color: '#34D399', grad: 'from-emerald-400 to-green-300' },
  surprise: { emoji: '😲', color: '#38BDF8', grad: 'from-sky-400 to-cyan-300' },
  neutral:  { emoji: '😐', color: '#94A3B8', grad: 'from-slate-400 to-slate-300' },
};

function meta(k: string) { return EMOTION_META[k.toLowerCase()] ?? { emoji: '💬', color: '#94A3B8', grad: '' }; }

const Mono = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span className="mono" style={style}>{children}</span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mono" style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22D3EE', marginBottom: '4px' }}>
    {children}
  </div>
);

export default function Dashboard({ data, onBack }: DashboardProps) {
  const dashRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add('active'), 50);
    return () => clearTimeout(t);
  }, []);

  const handleDownload = async () => {
    try {
      const res = await fetch('/download-report', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'YTEmotionReport.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download report!'); }
  };

  const netScore = (data.sentiment_percent.positive - data.sentiment_percent.negative).toFixed(1);
  const isPositive = Number(netScore) >= 0;

  const dominant = useMemo(() => {
    const entries = Object.entries(data.emotion_percent);
    if (!entries.length) return null;
    const [key, val] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    return { key, val, ...meta(key) };
  }, [data.emotion_percent]);

  const emotionEntries = Object.entries(data.emotion_percent).sort((a, b) => b[1] - a[1]);

  const doughnutData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{ data: [data.sentiment_percent.positive, data.sentiment_percent.negative, data.sentiment_percent.neutral], backgroundColor: ['#10B981','#F43F5E','#38BDF8'], borderColor: '#050816', borderWidth: 3, hoverOffset: 6 }],
  };
  const doughnutOpts = {
    cutout: '78%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#64748b', font: { size: 11, weight: 500 as const }, padding: 14 } },
      tooltip: { callbacks: { label: (c: { label: string; parsed: number }) => `${c.label}: ${c.parsed}%` } },
    },
  };

  const barData = {
    labels: emotionEntries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ label: '%', data: emotionEntries.map(([, v]) => v), backgroundColor: emotionEntries.map(([k]) => meta(k).color + 'cc'), borderRadius: 4, borderSkipped: false as const }],
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { parsed: { y: number } }) => `${c.parsed.y}%` } } },
    scales: {
      x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(30,41,88,0.5)' }, beginAtZero: true },
    },
  };

  return (
    <div ref={dashRef} className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--cyber-void)', position: 'relative', zIndex: 1 }}>
      <div className="orb-cyan" /><div className="orb-violet" />
      <div className="scanline-anim" />

      <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 2 }}>

        {/* ── HEADER ── */}
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(8,11,26,0.95)', border: '1px solid var(--cyber-border)', borderRadius: '4px', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button id="backButton" onClick={onBack} style={{ padding: '6px 10px', background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '4px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }} className="mono">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="mono" style={{ fontSize: '0.5625rem', color: '#22D3EE', letterSpacing: '0.1em', marginBottom: '2px' }}>[ NEURAL_OUTPUT // LIVE INTELLIGENCE DASHBOARD ]</div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>{data.title}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {[
              { label: 'COMMENTS', value: data.total_comments.toLocaleString(), color: '#22D3EE' },
              { label: 'LIKES', value: data.total_likes.toLocaleString(), color: '#A78BFA' },
              { label: 'NET SCORE', value: `${isPositive ? '+' : ''}${netScore}`, color: isPositive ? '#10B981' : '#F43F5E' },
            ].map(c => (
              <div key={c.label} className="kpi-chip">
                <span className="kpi-chip-label">{c.label}</span>
                <span className="kpi-chip-value" style={{ color: c.color }}>{c.value}</span>
              </div>
            ))}
            <button id="downloadReportBtn" onClick={handleDownload} className="btn-ghost" style={{ padding: '8px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6875rem' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              EXPORT
            </button>
          </div>
        </header>

        {/* ── VIDEO CARD + SENTIMENT KPIs ── */}
        <div style={{ display: 'grid', gap: '1.25rem' }} className="dash-row1">
          {/* Video Card */}
          <div className="cyber-frame chamfer" style={{ boxShadow: '0 0 30px rgba(34,211,238,0.08)' }}>
            <div className="cyber-frame-inner chamfer" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem', alignItems: 'center' }} className="video-inner-grid">
                {/* Thumbnail */}
                <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg, #080B1A, #11183C)', border: '1px solid var(--cyber-border)', overflow: 'hidden', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={data.thumbnail} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,8,22,0.4), transparent)' }} />
                </div>
                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="mono" style={{ padding: '3px 8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '3px', fontSize: '0.5625rem', color: '#A78BFA' }}>YT // EMOTION.AI</span>
                    <span className="mono" style={{ padding: '3px 8px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '3px', fontSize: '0.5625rem', color: '#22D3EE' }}>ANALYZED LIVE</span>
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>{data.title}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--cyber-border)' }}>
                    {[
                      { label: 'TOTAL COMMENTS', value: data.total_comments.toLocaleString(), color: '#22D3EE' },
                      { label: 'TOTAL LIKES', value: data.total_likes.toLocaleString(), color: '#A78BFA' },
                      { label: 'NET SENTIMENT', value: `${isPositive ? '+' : ''}${netScore}`, color: isPositive ? '#10B981' : '#F43F5E' },
                      { label: 'DOMINANT EMOTION', value: dominant ? `${dominant.emoji} ${dominant.key}` : '—', color: dominant?.color ?? '#94A3B8' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="mono" style={{ fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
                        <div className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: s.color, textTransform: 'capitalize' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment KPI Rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { label: 'POSITIVE AFFINITY', icon: '😊', value: data.sentiment_percent.positive, color: '#10B981', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.06)', fillClass: 'progress-fill-emerald', desc: `${Math.round(data.total_comments * data.sentiment_percent.positive / 100).toLocaleString()} comments expressed admiration and enthusiasm for the content.` },
              { label: 'OBJECTIVE / NEUTRAL', icon: '😐', value: data.sentiment_percent.neutral, color: '#38BDF8', border: 'rgba(56,189,248,0.3)', bg: 'rgba(56,189,248,0.06)', fillClass: 'progress-fill-sky', desc: `${Math.round(data.total_comments * data.sentiment_percent.neutral / 100).toLocaleString()} comments were factual inquiries or balanced observations.` },
              { label: 'CRITICAL FRICTION', icon: '😠', value: data.sentiment_percent.negative, color: '#F43F5E', border: 'rgba(244,63,94,0.3)', bg: 'rgba(244,63,94,0.06)', fillClass: 'progress-fill-rose', desc: `${Math.round(data.total_comments * data.sentiment_percent.negative / 100).toLocaleString()} comments highlighted friction points or disagreements.` },
            ].map(k => (
              <div key={k.label} className="chamfer-sm" style={{ padding: '1rem 1.125rem', background: k.bg, border: `1px solid ${k.border}`, display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <div className="mono" style={{ fontSize: '0.5625rem', color: k.color, fontWeight: 700, letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{k.label}</span><span>{k.icon}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="mono" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{k.value.toFixed(1)}</span>
                  <span className="mono" style={{ fontSize: '1.125rem', color: k.color }}>%</span>
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.5, fontWeight: 300 }}>{k.desc}</p>
                <div className="progress-track">
                  <div className={k.fillClass} style={{ width: `${k.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── EMOTION SPECTRUM + DOSSIER ── */}
        <div style={{ display: 'grid', gap: '1.25rem' }} className="dash-row2">
          {/* Emotion Spectrum Bars */}
          <div style={{ padding: '1.25rem', background: 'var(--cyber-deep)', border: '1px solid var(--cyber-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--cyber-border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <SectionLabel>EMOTION SPECTRUM DENSITY</SectionLabel>
                <p style={{ fontSize: '0.75rem', color: '#475569' }}>Fine-grained emotional decomposition of audience sentiment</p>
              </div>
              <Mono style={{ fontSize: '0.5625rem', color: '#334155' }}>PLUTCHIK MATRIX</Mono>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {emotionEntries.map(([key, val]) => {
                const m = meta(key);
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{m.emoji}</span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key}</span>
                      </span>
                      <Mono style={{ fontSize: '0.75rem', fontWeight: 700, color: m.color }}>{val.toFixed(1)}%</Mono>
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div style={{ width: `${val}%`, background: `linear-gradient(90deg, ${m.color}88, ${m.color})`, height: '100%', borderRadius: '99px', boxShadow: `0 0 8px ${m.color}44`, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Executive Dossier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="chamfer-asym" style={{ padding: '1.25rem', background: 'rgba(17,24,60,0.6)', border: '1px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div className="mono" style={{ fontSize: '0.625rem', color: '#A78BFA', fontWeight: 700, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖</span> SYNTHESIS DOSSIER // EXECUTIVE SUMMARY
              </div>
              <blockquote style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 300, lineHeight: 1.75, fontStyle: 'italic', borderLeft: '2px solid #22D3EE', paddingLeft: '1rem' }}>
                "Audience sentiment analysis complete. The distribution reveals{' '}
                {data.sentiment_percent.positive > 50 ? 'a predominantly positive audience response' : 'a mixed audience response'} with{' '}
                {data.sentiment_percent.positive.toFixed(1)}% positive engagement.{' '}
                {dominant ? `The dominant emotion is ${dominant.key} at ${dominant.val.toFixed(1)}% of total comments.` : ''}"
              </blockquote>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px' }}>
                  <div className="mono" style={{ fontSize: '0.5625rem', color: '#10B981', fontWeight: 700, marginBottom: '8px' }}>👍 WHAT RESONATED</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 300 }}>"{data.highlights.positive}"</p>
                </div>
                <div style={{ padding: '0.875rem', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '4px' }}>
                  <div className="mono" style={{ fontSize: '0.5625rem', color: '#F43F5E', fontWeight: 700, marginBottom: '8px' }}>⚠️ FRICTION POINTS</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 300 }}>"{data.highlights.negative}"</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '4px' }}>
              <div className="mono" style={{ fontSize: '0.5625rem', color: '#22D3EE', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>👍 MOST LIKED COMMENT</div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 300 }}>"{data.highlights.liked}"</p>
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }} className="dash-row3">
          <div style={{ padding: '1.25rem', background: 'var(--cyber-deep)', border: '1px solid var(--cyber-border)', display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>SENTIMENT DISTRIBUTION</SectionLabel>
            <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>Overall comment sentiment (%)</p>
            <div style={{ position: 'relative', flex: 1, minHeight: '200px' }}>
              <Doughnut data={doughnutData} options={doughnutOpts} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: '3rem' }}>
                <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>100%</span>
                <span className="mono" style={{ fontSize: '0.5625rem', color: '#334155', letterSpacing: '0.1em' }}>ANALYZED</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '1.25rem', background: 'var(--cyber-deep)', border: '1px solid var(--cyber-border)', display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>EMOTION FREQUENCY CHART</SectionLabel>
            <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>Detected emotions by percentage</p>
            <div style={{ flex: 1, minHeight: '200px' }}>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>

        {/* ── AUDIENCE VOICE / COMMENT FEED ── */}
        <CommentFeed comments={data.comments} />

      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dash-row1 { grid-template-columns: 1.6fr 1fr !important; }
          .dash-row2 { grid-template-columns: 1fr 1fr !important; }
          .video-inner-grid { grid-template-columns: 2fr 3fr !important; }
        }
        @media (max-width: 640px) {
          .dash-row3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
