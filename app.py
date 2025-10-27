from flask import Flask, request, jsonify, render_template
from googleapiclient.discovery import build
from textblob import TextBlob
import re

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html') # Halaman index 

YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY"

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    video_url = data.get('url')

    # ambil video ID dari URL
    match = re.search(r"v=([a-zA-Z0-9_-]+)", video_url)
    if not match:
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    video_id = match.group(1)

    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

    # ambil komentar
    comments = []
    request_api = youtube.commentThreads().list(
        part='snippet',
        videoId=video_id,
        maxResults=50
    )
    response = request_api.execute()

    for item in response['items']:
        comment = item['snippet']['topLevelComment']['snippet']
        text = comment['textDisplay']
        likes = comment['likeCount']
        time = comment['publishedAt']

        analysis = TextBlob(text)
        sentiment = (
            'positive' if analysis.sentiment.polarity > 0.1 else
            'negative' if analysis.sentiment.polarity < -0.1 else
            'neutral'
        )

        comments.append({
            'text': text,
            'sentiment': sentiment,
            'likes': likes,
            'time': time
        })

    # hitung summary
    pos = sum(1 for c in comments if c['sentiment'] == 'positive')
    neg = sum(1 for c in comments if c['sentiment'] == 'negative')
    neu = sum(1 for c in comments if c['sentiment'] == 'neutral')
    total = len(comments)

    sentiment_summary = {
        'positive': round(pos / total * 100, 2),
        'neutral': round(neu / total * 100, 2),
        'negative': round(neg / total * 100, 2),
    }

    return jsonify({
        'video_title': 'Example Title',
        'video_thumbnail': 'https://placehold.co/600x400',
        'total_comments': total,
        'total_likes': 12345,
        'sentiment_summary': sentiment_summary,
        'emotions': {'joy': 40, 'anger': 10, 'sadness': 10, 'surprise': 20, 'fear': 5, 'neutral': 15},
        'most_positive_comment': max(comments, key=lambda c: c['likes'])['text'],
        'most_negative_comment': min(comments, key=lambda c: c['likes'])['text'],
        'most_liked_comment': max(comments, key=lambda c: c['likes'])['text'],
        'comments': comments
    })

if __name__ == '__main__':
    app.run(debug=True)
