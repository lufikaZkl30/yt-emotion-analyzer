import { useState, useMemo } from 'react';
import type { YTComment } from '../types';

interface CommentFeedProps {
  comments: YTComment[];
}

export default function CommentFeed({ comments }: CommentFeedProps) {
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'likes' | 'newest' | 'oldest'>('default');

  const filtered = useMemo(() => {
    let result = [...comments];

    // Filter by sentiment
    if (sentimentFilter !== 'all') {
      result = result.filter(c => c.sentiment === sentimentFilter);
    }

    // Filter by search text
    if (search.trim()) {
      result = result.filter(c => c.text.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort
    if (sortOrder === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }

    return result;
  }, [comments, search, sentimentFilter, sortOrder]);

  const getBadgeClass = (sentiment: string) => {
    if (sentiment === 'positive') return 'sentiment-badge badge-positive';
    if (sentiment === 'negative') return 'sentiment-badge badge-negative';
    return 'sentiment-badge badge-neutral';
  };

  return (
    <div className="card p-5">
      <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
        Comment Feed
      </p>
      <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
        Live comments with sentiment analysis
      </p>

      {/* Filter & Sort Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
        <input
          id="commentSearch"
          type="text"
          placeholder="Search comments..."
          className="comment-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flexGrow: 1, minWidth: '180px' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            id="sentimentFilter"
            className="sentiment-filter"
            value={sentimentFilter}
            onChange={e => setSentimentFilter(e.target.value as typeof sentimentFilter)}
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
          <select
            id="sortOrder"
            className="sort-order"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
          >
            <option value="default">Default</option>
            <option value="likes">Most Liked</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Comment Table */}
      <div className="custom-scrollbar" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '24rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', minWidth: '600px', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px' }}>Comment</th>
              <th style={{ padding: '12px 16px' }}>Sentiment</th>
              <th style={{ padding: '12px 16px' }}>Likes</th>
              <th style={{ padding: '12px 16px' }}>Time</th>
            </tr>
          </thead>
          <tbody id="commentsTableBody">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
                  No comments found.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '20rem' }}>
                    {c.text}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={getBadgeClass(c.sentiment)}>{c.sentiment}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                    {c.likes}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem' }}>
                    {new Date(c.time).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
