import { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '../types';

interface LandingPageProps {
  onResult: (data: AnalysisResult) => void;
}

export default function LandingPage({ onResult }: LandingPageProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response. Is the backend running?`);
      }

      setLoading(false);

      if (!response.ok) {
        setError(data?.error || 'Unknown error');
        return;
      }

      onResult(data);
      
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Network error. Make sure the backend server is running.');
    }
  };

  return (
    <main className="main-background flex flex-col items-center justify-center min-h-screen p-4 text-center">

      {/* Loading Overlay */}
      {loading && (
        <div
          id="loadingIndicator"
          style={{
            background: 'rgba(5, 8, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          className="fixed inset-0 flex flex-col items-center justify-center z-50 gap-5"
        >
          <div className="loader" />
          <div className="text-center">
            <p style={{ color: '#e2e8f0' }} className="text-base font-semibold mb-1">Analyzing comments...</p>
            <p style={{ color: '#64748b' }} className="text-sm">This may take a moment for large datasets</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="logo-img"
            style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }}
          />
          <span className="brand-name" style={{ fontSize: '1.125rem' }}>YT Emotion Analyzer</span>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5"
          style={{
            fontSize: '0.75rem',
            color: '#64748b',
            border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: '9999px',
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22d3ee', display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          Youtube Sentiment Analysis
        </span>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center max-w-3xl w-full px-4" style={{ position: 'relative', zIndex: 10 }}>

        {/* Eyebrow label */}
        <div
          className="inline-flex items-center gap-2"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#22d3ee',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: '9999px',
            padding: '6px 16px',
          }}
        >
          <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          YouTube Comment Analyzer
        </div>

        <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
          Understand Audience<br />Emotions
        </h1>
        <p style={{ fontSize: '1.0625rem', color: '#94a3b8', maxWidth: '36rem', marginBottom: '2.5rem', lineHeight: 1.75, fontWeight: 300 }}>
          Paste a YouTube video link to get an AI-powered analysis of audience sentiment and emotions straight from the comments.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '42rem' }}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div style={{ position: 'relative', flexGrow: 1, width: '100%' }}>
              <svg
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#64748b' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                id="youtubeLinkInput"
                type="text"
                placeholder="Paste a YouTube video link..."
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={{ width: '100%', height: '3.5rem', paddingLeft: '3rem', paddingRight: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', color: '#f1f5f9' }}
              />
            </div>
            <button
              id="analyzeButton"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', maxWidth: 'fit-content', height: '3.5rem', padding: '0 2rem',
                borderRadius: '0.75rem', fontSize: '0.875rem', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="error-message" role="alert">
            <strong style={{ fontWeight: 600 }}>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Decorative blobs */}
      <div style={{ pointerEvents: 'none', position: 'absolute', left: 0, bottom: 0, width: '18rem', height: '18rem', background: 'rgba(37,99,235,0.05)', borderRadius: '50%', filter: 'blur(64px)' }} />
      <div style={{ pointerEvents: 'none', position: 'absolute', right: 0, top: '33%', width: '24rem', height: '24rem', background: 'rgba(109,40,217,0.05)', borderRadius: '50%', filter: 'blur(64px)' }} />
    </main>
  );
}
