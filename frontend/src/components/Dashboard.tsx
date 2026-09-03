import { useRef, useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { AnalysisResult } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps {
  data: AnalysisResult;
  onBack: () => void;
}

const EMOTION_META: Record<string, { emoji: string; color: string; desc: string }> = {
  anger:    { emoji: '😡', color: '#F87171', desc: 'Frustration & strong displeasure' },
  fear:     { emoji: '😨', color: '#A78BFA', desc: 'Worry, anxiety & concern' },
  joy:      { emoji: '😄', color: '#FBBF24', desc: 'Happiness, excitement & delight' },
  sadness:  { emoji: '😢', color: '#60A5FA', desc: 'Disappointment & sorrow' },
  disgust:  { emoji: '🤢', color: '#34D399', desc: 'Rejection & strong dislike' },
  surprise: { emoji: '😲', color: '#38BDF8', desc: 'Amazement & shock' },
  neutral:  { emoji: '😐', color: '#9CA3AF', desc: 'Informational & balanced' },
};

function getMeta(key: string) {
  return EMOTION_META[key.toLowerCase()] ?? { emoji: '💬', color: '#9CA3AF', desc: '' };
}

export default function Dashboard({ data, onBack }: DashboardProps) {
  const dashRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [sentFilter, setSentFilter] = useState<'all'|'positive'|'negative'|'neutral'>('all');

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
      const a = document.createElement('a');
      a.href = url; a.download = 'YTEmotionReport.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download report!'); }
  };

  const dominantEmotion = useMemo(() => {
    const entries = Object.entries(data.emotion_percent);
    if (!entries.length) return null;
    const [key, val] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    return { key, val, ...getMeta(key) };
  }, [data.emotion_percent]);

  const sentimentScore = useMemo(() => {
    return (data.sentiment_percent.positive - data.sentiment_percent.negative).toFixed(1);
  }, [data.sentiment_percent]);

  const filteredComments = useMemo(() => {
    let r = [...data.comments];
    if (sentFilter !== 'all') r = r.filter(c => c.sentiment === sentFilter);
    if (search.trim()) r = r.filter(c => c.text.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [data.comments, sentFilter, search]);

  const emotionEntries = Object.entries(data.emotion_percent).sort((a, b) => b[1] - a[1]);

  const doughnutData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [data.sentiment_percent.positive, data.sentiment_percent.negative, data.sentiment_percent.neutral],
      backgroundColor: ['#10B981', '#EF4444', '#9CA3AF'],
      borderColor: '#050816', borderWidth: 3, hoverOffset: 8,
    }],
  };

  const doughnutOpts = {
    cutout: '78%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 12, weight: 500 as const }, padding: 16 } },
      tooltip: { callbacks: { label: (c: { label: string; parsed: number }) => `${c.label}: ${c.parsed}%` } },
    },
  };

  const barData = {
    labels: emotionEntries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      label: '%',
      data: emotionEntries.map(([, v]) => v),
      backgroundColor: emotionEntries.map(([k]) => getMeta(k).color + 'cc'),
      borderRadius: 6, borderSkipped: false,
    }],
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { parsed: { y: number } }) => `${c.parsed.y}%` } } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
    },
  };

  return (
    <div ref={dashRef} className="dashboard-page main-background" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 10 }}>

        {/* ── HEADER ── */}
        <header className="db-header card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button id="backButton" onClick={onBack} title="Back" style={{ padding: '6px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <img
                src={data.thumbnail} alt="thumb"
                style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x34/0a0f1e/1e293b?text=YT'; }}
              />
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Live Intelligence Dashboard
                </p>
                <h1 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.title}
                </h1>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="db-stat-chip">
              <span className="db-chip-label">Comments</span>
              <span className="db-chip-value">{data.total_comments.toLocaleString()}</span>
            </div>
            <div className="db-stat-chip">
              <span className="db-chip-label">Likes</span>
              <span className="db-chip-value">{data.total_likes.toLocaleString()}</span>
            </div>
            <div className="db-stat-chip" style={{ borderColor: Number(sentimentScore) >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <span className="db-chip-label">Net Sentiment</span>
              <span className="db-chip-value" style={{ color: Number(sentimentScore) >= 0 ? '#34d399' : '#f87171' }}>
                {Number(sentimentScore) >= 0 ? '+' : ''}{sentimentScore}%
              </span>
            </div>
            <button id="downloadReportBtn" onClick={handleDownload}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </header>

        {/* ── ROW 1: KPI METRICS ── */}
        <div className="db-kpi-row">

          {/* Positive Activity */}
          <div className="card db-kpi-card">
            <div className="db-kpi-label">
              <span className="db-kpi-dot" style={{ background: '#34d399' }} />
              Positive Activity
            </div>
            <div className="db-kpi-big" style={{ color: '#34d399' }}>
              {data.sentiment_percent.positive.toFixed(1)}%
            </div>
            <p className="db-kpi-desc">
              Audience expressing support, excitement, and appreciation in their comments.
            </p>
            <div className="db-progress-bar">
              <div style={{ width: `${data.sentiment_percent.positive}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: '99px', height: '100%', transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
            </div>
          </div>

          {/* Negative / Neutral */}
          <div className="card db-kpi-card">
            <div className="db-kpi-label">
              <span className="db-kpi-dot" style={{ background: '#f87171' }} />
              Negative / Neutral
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
              <div>
                <div className="db-kpi-big" style={{ color: '#f87171', fontSize: '2rem' }}>
                  {data.sentiment_percent.negative.toFixed(1)}%
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>Negative</p>
              </div>
              <div>
                <div className="db-kpi-big" style={{ color: '#94a3b8', fontSize: '2rem' }}>
                  {data.sentiment_percent.neutral.toFixed(1)}%
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>Neutral</p>
              </div>
            </div>
            <p className="db-kpi-desc">Criticism, disputes, and informational commentary.</p>
            <div className="db-progress-bar">
              <div style={{ width: `${data.sentiment_percent.negative}%`, background: 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: '99px 0 0 99px', height: '100%' }} />
              <div style={{ width: `${data.sentiment_percent.neutral}%`, background: 'rgba(148,163,184,0.4)', height: '100%' }} />
            </div>
          </div>

          {/* Dominant Emotion */}
          {dominantEmotion && (
            <div className="card db-kpi-card">
              <div className="db-kpi-label">
                <span className="db-kpi-dot" style={{ background: dominantEmotion.color }} />
                Dominant Emotion
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{dominantEmotion.emoji}</span>
                <div>
                  <div className="db-kpi-big" style={{ color: dominantEmotion.color, fontSize: '1.75rem', textTransform: 'capitalize' }}>
                    {dominantEmotion.key}
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>{dominantEmotion.val.toFixed(1)}% of comments</p>
                </div>
              </div>
              <p className="db-kpi-desc">{dominantEmotion.desc}</p>
            </div>
          )}

        </div>

        {/* ── ROW 2: CHARTS + EMOTION BARS ── */}
        <div className="db-row2">

          {/* Sentiment Doughnut */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <p className="db-section-label">Sentiment Summary</p>
            <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '1rem' }}>Overall comment distribution (%)</p>
            <div style={{ position: 'relative', flex: 1, minHeight: '200px' }}>
              <Doughnut data={doughnutData} options={doughnutOpts} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: '3rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>100%</span>
                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Analyzed</span>
              </div>
            </div>
          </div>

          {/* Emotion Bar */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <p className="db-section-label">Emotion Distribution</p>
            <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '1rem' }}>Detected emotions by percentage (%)</p>
            <div style={{ flex: 1, minHeight: '200px' }}>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>

          {/* Emotion Intensity Bars */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p className="db-section-label">Emotion Intensity</p>
            <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '1rem' }}>Ranked breakdown with context</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {emotionEntries.map(([key, val]) => {
                const m = getMeta(key);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: 500 }}>
                        <span>{m.emoji}</span>
                        <span style={{ textTransform: 'capitalize' }}>{key}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.color }}>{val.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${val}%`, background: m.color, height: '100%', borderRadius: '99px', boxShadow: `0 0 8px ${m.color}66`, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── ROW 3: HIGHLIGHTS ── */}
        <div className="db-row3">
          <div className="card" style={{ padding: '1.25rem' }}>
            <p className="db-section-label" style={{ marginBottom: '1rem' }}>Comment Highlights</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              <div className="highlight-positive" style={{ padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.875rem' }}>✅</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most Positive</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>"{data.highlights.positive}"</p>
              </div>

              <div className="highlight-negative" style={{ padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.875rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most Negative</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>"{data.highlights.negative}"</p>
              </div>

              <div className="highlight-liked" style={{ padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.875rem' }}>👍</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most Liked</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>"{data.highlights.liked}"</p>
              </div>

            </div>
          </div>

          {/* Emotion Guide */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p className="db-section-label" style={{ marginBottom: '1rem' }}>Emotion Guide</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {Object.entries(EMOTION_META).map(([key, m]) => (
                <div key={key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '1.125rem', lineHeight: 1.2 }}>{m.emoji}</span>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: m.color, display: 'block', textTransform: 'capitalize' }}>{key}</span>
                    <span style={{ fontSize: '0.625rem', color: '#475569', lineHeight: 1.4 }}>{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 4: AUDIENCE VOICE SPECTRUM (top comments) ── */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p className="db-section-label">Audience Voice Spectrum</p>
              <p style={{ fontSize: '0.8125rem', color: '#475569' }}>Top comments across all sentiments</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['all', 'positive', 'negative', 'neutral'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSentFilter(s)}
                  style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 600,
                    textTransform: 'capitalize', border: '1px solid',
                    background: sentFilter === s ? (s === 'positive' ? 'rgba(16,185,129,0.15)' : s === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)') : 'transparent',
                    borderColor: sentFilter === s ? (s === 'positive' ? '#34d399' : s === 'negative' ? '#f87171' : '#818cf8') : 'rgba(99,102,241,0.15)',
                    color: sentFilter === s ? (s === 'positive' ? '#34d399' : s === 'negative' ? '#f87171' : '#94a3b8') : '#64748b',
                    cursor: 'pointer',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {filteredComments.slice(0, 6).map((c, i) => {
              const em = getMeta(c.emotion);
              const sentColor = c.sentiment === 'positive' ? '#34d399' : c.sentiment === 'negative' ? '#f87171' : '#94a3b8';
              return (
                <div key={i} style={{ padding: '0.875rem', borderRadius: '10px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.6, flex: 1 }}>"{c.text}"</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>{em.emoji}</span>
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, color: em.color, textTransform: 'capitalize' }}>{c.emotion}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {c.likes > 0 && <span style={{ fontSize: '0.625rem', color: '#64748b' }}>👍 {c.likes}</span>}
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, color: sentColor, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '99px', background: sentColor + '18', border: `1px solid ${sentColor}30` }}>{c.sentiment}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ROW 5: FULL COMMENT TABLE ── */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p className="db-section-label">Full Comment Feed</p>
              <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{filteredComments.length} comments</p>
            </div>
            <input
              id="commentSearch"
              type="text"
              placeholder="Search comments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: '36px', padding: '0 14px', fontSize: '0.8125rem', borderRadius: '8px', minWidth: '200px' }}
            />
          </div>
          <div className="custom-scrollbar" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '22rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', minWidth: '600px', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Comment</th>
                  <th style={{ padding: '10px 14px' }}>Emotion</th>
                  <th style={{ padding: '10px 14px' }}>Sentiment</th>
                  <th style={{ padding: '10px 14px' }}>Likes</th>
                  <th style={{ padding: '10px 14px' }}>Time</th>
                </tr>
              </thead>
              <tbody id="commentsTableBody">
                {filteredComments.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>No comments found.</td></tr>
                ) : filteredComments.map((c, i) => {
                  const em = getMeta(c.emotion);
                  const sentColor = c.sentiment === 'positive' ? '#34d399' : c.sentiment === 'negative' ? '#f87171' : '#94a3b8';
                  return (
                    <tr key={i}>
                      <td style={{ padding: '10px 14px', maxWidth: '22rem', color: '#cbd5e1', fontSize: '0.8125rem', lineHeight: 1.5 }}>{c.text}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: em.color, fontWeight: 600, textTransform: 'capitalize' }}>
                          {em.emoji} {c.emotion}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: sentColor, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '99px', background: sentColor + '18', border: `1px solid ${sentColor}30` }}>{c.sentiment}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.8125rem' }}>{c.likes}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.75rem' }}>{new Date(c.time).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
