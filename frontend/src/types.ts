export interface YTComment {
  text: string;
  likes: number;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  emotion: string;
}

export interface AnalysisResult {
  title: string;
  thumbnail: string;
  total_likes: number;
  total_comments: number;
  sentiment_percent: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotion_percent: Record<string, number>;
  highlights: {
    positive: string;
    negative: string;
    liked: string;
  };
  comments: YTComment[];
}
