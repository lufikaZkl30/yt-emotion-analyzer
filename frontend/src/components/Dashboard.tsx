import { useRef, useEffect } from 'react';
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
import CommentFeed from './CommentFeed';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps {
  data: AnalysisResult;
  onBack: () => void;
}

export default function Dashboard({ data, onBack }: DashboardProps) {
  const dashRef = useRef<HTMLDivElement>(null);

  // Trigger animation after mount
  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add('active'), 50);
    return () => clearTimeout(t);
  }, []);

  // Download report
  const handleDownload = async () => {
    try {
      const res = await fetch('/download-report', { method: 'POST' });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'YTEmotionReport.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download report!');
    }
  };

  // Sentiment chart data
  const sentimentData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [data.sentiment_percent.positive, data.sentiment_percent.negative, data.sentiment_percent.neutral],
      backgroundColor: ['#10B981', '#EF4444', '#9CA3AF'],
      borderColor: '#0f172a',
      borderWidth: 2,
      hoverOffset: 10,
    }],
  };

  const sentimentOptions = {
    cutout: '75%' as const,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#cbd5e1', font: { size: 13, weight: 500 as const } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) => `${ctx.label}: ${ctx.parsed}%`,
        },
      },
    },
  };

  const sentimentTotal = (
    data.sentiment_percent.positive +
    data.sentiment_percent.negative +
    data.sentiment_percent.neutral
  ).toFixed(0);

  // Emotion chart data
  const emotionLabels = Object.keys(data.emotion_percent);
  const emotionValues = Object.values(data.emotion_percent);

  const emotionData = {
    labels: emotionLabels,
    datasets: [{
      label: 'Emotion %',
      data: emotionValues,
      backgroundColor: ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#F87171', '#38BDF8'],
      borderRadius: 6,
    }],
  };

  const emotionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y}%` } },
    },
    scales: {
      x: {
        ticks: { color: '#cbd5e1', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 12 }, stepSize: 20 },
        grid: { color: 'rgba(148,163,184,0.1)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div
      ref={dashRef}
      className="dashboard-page main-background min-h-screen p-4 md:p-8"
    >
      <div style={{ maxWidth: '96rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10 }}>

        {/* ===== HEADER ===== */}
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button id="backButton" onClick={onBack} title="Back to Home" style={{ padding: '0.5rem' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#f1f5f9' }}>Analysis Dashboard</h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>YouTube Comment Emotion Insights</p>
            </div>
          </div>

          <button id="downloadReportBtn" onClick={handleDownload}>
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
        </header>

        {/* ===== MAIN GRID ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }} className="dashboard-grid">

          {/* ========== LEFT COLUMN ========== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* VIDEO DETAILS */}
            <div className="card p-5">
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                Video Details
              </p>
              <img
                className="video-thumbnail"
                src={data.thumbnail}
                alt="Video Thumbnail"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/0a0f1e/1e293b?text=Error'; }}
              />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
                {data.title}
              </h4>
            </div>

            {/* TOTAL STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card p-5" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comments</p>
                <h3 className="stat-number">{data.total_comments.toLocaleString()}</h3>
              </div>
              <div className="card p-5" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Likes</p>
                <h3 className="stat-number">{data.total_likes.toLocaleString()}</h3>
              </div>
            </div>

            {/* COMMENT HIGHLIGHTS */}
            <div className="card p-5">
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                Comment Highlights
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* POSITIVE */}
                <div className="highlight-positive p-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <svg style={{ width: '1rem', height: '1rem', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H7a2 2 0 01-2-2V9a2 2 0 012-2h4" />
                    </svg>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Positive</h5>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem' }}>Komentar dengan skor sentimen positif paling tinggi dari seluruh komentar yang dianalisis.</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{data.highlights.positive}"
                  </p>
                </div>

                {/* NEGATIVE */}
                <div className="highlight-negative p-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <svg style={{ width: '1rem', height: '1rem', color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3H17a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                    </svg>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Negative</h5>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem' }}>Komentar dengan skor sentimen negatif paling tinggi — menggambarkan kritik atau ketidakpuasan penonton.</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{data.highlights.negative}"
                  </p>
                </div>

                {/* LIKED */}
                <div className="highlight-liked p-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <svg style={{ width: '1rem', height: '1rem', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Liked</h5>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem' }}>Komentar yang mendapat jumlah likes terbanyak dari penonton lain di kolom komentar.</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{data.highlights.liked}"
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN ========== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.25rem' }} className="charts-grid">

              {/* Sentiment Doughnut */}
              <div className="card p-5" style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Sentiment Summary</p>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>Overall comment sentiment (%)</p>
                <div style={{ position: 'relative', flex: 1, minHeight: '220px' }}>
                  <Doughnut data={sentimentData} options={sentimentOptions} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: '3rem' }}>
                    <span style={{ fontSize: '1.875rem', fontWeight: 700, color: '#f1f5f9' }}>{sentimentTotal}%</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Total</span>
                  </div>
                </div>
              </div>

              {/* Emotion Bar Chart */}
              <div className="card p-5" style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Emotion Distribution</p>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>Detected emotions (%)</p>
                <div style={{ flex: 1, minHeight: '220px' }}>
                  <Bar data={emotionData} options={emotionOptions} />
                </div>

                {/* Emotion Descriptions */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    📘 Emotion Guide
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                    {[
                      { emoji: '😡', label: 'Anger', color: '#F87171', desc: 'Komentar yang mengekspresikan kemarahan, frustrasi, atau ketidakpuasan yang kuat.' },
                      { emoji: '😨', label: 'Fear', color: '#A78BFA', desc: 'Komentar yang menunjukkan rasa takut, khawatir, atau cemas terhadap konten.' },
                      { emoji: '😄', label: 'Joy', color: '#FBBF24', desc: 'Komentar yang mencerminkan kesenangan, kebahagiaan, atau antusias yang tinggi.' },
                      { emoji: '😢', label: 'Sadness', color: '#60A5FA', desc: 'Komentar yang mengungkapkan kesedihan, kekecewaan, atau perasaan kehilangan.' },
                      { emoji: '🤢', label: 'Disgust', color: '#34D399', desc: 'Komentar yang mengekspresikan rasa jijik atau penolakan terhadap sesuatu.' },
                      { emoji: '😲', label: 'Surprise', color: '#38BDF8', desc: 'Komentar yang mencerminkan rasa terkejut atau kagum terhadap isi video.' },
                      { emoji: '😐', label: 'Neutral', color: '#9CA3AF', desc: 'Komentar yang bersifat informatif atau deskriptif tanpa emosi yang dominan.' },
                    ].map(({ emoji, label, color, desc }) => (
                      <div key={label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1rem', lineHeight: 1.3 }}>{emoji}</span>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color, display: 'block', marginBottom: '1px' }}>{label}</span>
                          <span style={{ fontSize: '0.65rem', color: '#475569', lineHeight: 1.4 }}>{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* COMMENT FEED */}
            <CommentFeed comments={data.comments} />
          </div>
        </div>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 1280px) {
          .dashboard-grid {
            grid-template-columns: 1fr 2fr !important;
          }
        }
        @media (min-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
