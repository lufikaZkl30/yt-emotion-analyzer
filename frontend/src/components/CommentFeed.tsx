import { useState, useMemo } from 'react';
import type { YTComment } from '../types';

interface CommentFeedProps { comments: YTComment[]; }

const EMOTION_COLOR: Record<string, string> = {
  anger: '#F87171', fear: '#A78BFA', joy: '#FBBF24',
  sadness: '#60A5FA', disgust: '#34D399', surprise: '#38BDF8', neutral: '#94A3B8',
};
const EMOTION_EMOJI: Record<string, string> = {
  anger: '😡', fear: '😨', joy: '😄', sadness: '😢', disgust: '🤢', surprise: '😲', neutral: '😐',
};

function emotionColor(e: string) { return EMOTION_COLOR[e.toLowerCase()] ?? '#94A3B8'; }
function emotionEmoji(e: string) { return EMOTION_EMOJI[e.toLowerCase()] ?? '💬'; }

function initials(i: number) {
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return pool[i % pool.length] + pool[(i * 7 + 3) % pool.length];
}

const GRAD_POOLS = [
  'linear-gradient(135deg,#10B981,#22D3EE)',
  'linear-gradient(135deg,#22D3EE,#8B5CF6)',
  'linear-gradient(135deg,#F59E0B,#F43F5E)',
  'linear-gradient(135deg,#8B5CF6,#22D3EE)',
  'linear-gradient(135deg,#38BDF8,#475569)',
  'linear-gradient(135deg,#10B981,#6366F1)',
];

export default function CommentFeed({ comments }: CommentFeedProps) {
  const [search, setSearch] = useState('');
  const [sentFilter, setSentFilter] = useState<'all'|'positive'|'negative'|'neutral'>('all');
  const [sortOrder, setSortOrder] = useState<'default'|'likes'>('default');

  const filtered = useMemo(() => {
    let r = [...comments];
    if (sentFilter !== 'all') r = r.filter(c => c.sentiment === sentFilter);
    if (search.trim()) r = r.filter(c => c.text.toLowerCase().includes(search.toLowerCase()));
    if (sortOrder === 'likes') r.sort((a, b) => b.likes - a.likes);
    return r;
  }, [comments, sentFilter, search, sortOrder]);

  const counts = useMemo(() => ({
    all: comments.length,
    positive: comments.filter(c => c.sentiment === 'positive').length,
    negative: comments.filter(c => c.sentiment === 'negative').length,
    neutral:  comments.filter(c => c.sentiment === 'neutral').length,
  }), [comments]);

  const topSix = filtered.slice(0, 6);

  const sentMeta = (s: string) => {
    if (s === 'positive') return { color: '#10B981', border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.08)', label: 'JOY' };
    if (s === 'negative') return { color: '#F43F5E', border: 'rgba(244,63,94,0.35)', bg: 'rgba(244,63,94,0.08)', label: 'FRICTION' };
    return { color: '#38BDF8', border: 'rgba(56,189,248,0.35)', bg: 'rgba(56,189,248,0.08)', label: 'NEUTRAL' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── AUDIENCE VOICE SPECTRUM (card grid) ── */}
      <div style={{ padding: '1.5rem', background: 'rgba(8,11,26,0.5)', border: '1px solid var(--cyber-border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(30,41,88,0.6)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: '#22D3EE', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>[ RAW NEURAL STREAMS ]</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Audience Voice Spectrum</h2>
            <p className="mono" style={{ fontSize: '0.5625rem', color: '#475569', marginTop: '2px' }}>Verbatim comments categorized with real-time sentiment tokens</p>
          </div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', padding: '5px', background: 'var(--cyber-void)', border: '1px solid var(--cyber-border)', borderRadius: '4px' }}>
            {(['all','positive','neutral','negative'] as const).map(f => (
              <button key={f} className={`filter-tab ${sentFilter === f ? 'active' : ''}`} onClick={() => setSentFilter(f)}>
                {f.toUpperCase()} ({counts[f === 'neutral' ? 'neutral' : f === 'negative' ? 'negative' : f === 'positive' ? 'positive' : 'all'].toLocaleString()})
              </button>
            ))}
          </div>
        </div>

        {/* Comment Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {topSix.length === 0 ? (
            <div className="mono" style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: '#334155', fontSize: '0.75rem' }}>NO COMMENTS MATCHING FILTER</div>
          ) : topSix.map((c, i) => {
            const sm = sentMeta(c.sentiment);
            const ec = emotionColor(c.emotion);
            return (
              <div key={i} className={`comment-card chamfer-sm ${c.sentiment === 'positive' ? 'pos' : c.sentiment === 'negative' ? 'neg' : 'neu'}`} style={{ borderColor: sm.border }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar" style={{ background: GRAD_POOLS[i % GRAD_POOLS.length] }}>{initials(i)}</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }} className="mono">@user_{(1000 + i * 13).toString(16)}</div>
                      <div className="mono" style={{ fontSize: '0.5625rem', color: '#475569' }}>{new Date(c.time).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: '3px', fontSize: '0.5625rem', color: sm.color }} className="mono">
                    {emotionEmoji(c.emotion)} {sm.label}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.65, fontWeight: 300 }}>"{c.text}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(30,41,88,0.5)' }}>
                  <span className="mono" style={{ fontSize: '0.5625rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#F43F5E' }}>♥</span> {c.likes} Likes
                  </span>
                  <span className="mono" style={{ fontSize: '0.5625rem', color: ec, textTransform: 'capitalize' }}>#{c.emotion}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FULL COMMENT TABLE ── */}
      <div style={{ padding: '1.25rem', background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: '#22D3EE', letterSpacing: '0.1em', marginBottom: '2px' }}>[ CACHED NEURAL LOGS // FULL FEED ]</div>
            <p className="mono" style={{ fontSize: '0.6875rem', color: '#475569' }}>{filtered.length.toLocaleString()} ENTRIES</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              id="commentSearch"
              type="text"
              placeholder="SEARCH COMMENTS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: '34px', padding: '0 12px', fontSize: '0.6875rem', borderRadius: '4px', minWidth: '200px' }}
            />
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
              style={{ height: '34px', padding: '0 10px', fontSize: '0.6875rem', borderRadius: '4px' }}
            >
              <option value="default">DEFAULT ORDER</option>
              <option value="likes">MOST LIKED</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '24rem', border: '1px solid rgba(30,41,88,0.6)', borderRadius: '4px' }} className="custom-scrollbar">
          <table style={{ width: '100%', minWidth: '640px', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px' }}>COMMENT</th>
                <th style={{ padding: '10px 14px' }}>EMOTION</th>
                <th style={{ padding: '10px 14px' }}>SENTIMENT</th>
                <th style={{ padding: '10px 14px' }}>LIKES</th>
                <th style={{ padding: '10px 14px' }}>TIME</th>
              </tr>
            </thead>
            <tbody id="commentsTableBody">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#334155' }} className="mono">NO COMMENTS FOUND</td></tr>
              ) : filtered.map((c, i) => {
                const ec = emotionColor(c.emotion);
                const sm = sentMeta(c.sentiment);
                return (
                  <tr key={i}>
                    <td style={{ maxWidth: '22rem', color: '#cbd5e1', lineHeight: 1.55 }}>{c.text}</td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.6875rem', color: ec, fontWeight: 600, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {emotionEmoji(c.emotion)} {c.emotion}
                      </span>
                    </td>
                    <td>
                      <span className="mono badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>{c.sentiment}</span>
                    </td>
                    <td style={{ color: '#94a3b8' }} className="mono">{c.likes}</td>
                    <td style={{ color: '#475569', fontSize: '0.6875rem' }} className="mono">{new Date(c.time).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
