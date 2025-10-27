from flask import Flask, render_template, request, jsonify
from googleapiclient.discovery import build
from textblob import TextBlob
from dotenv import load_dotenv
import os, re

app = Flask(__name__)

# Load API key dari file .env
load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# --- ROUTE UTAMA ---
@app.route('/')
def index():
    return render_template('index.html')


# --- ROUTE UNTUK ANALISIS KOMENTAR ---
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    youtube_url = data.get('youtube_url')

    # Ambil video ID dari link panjang & pendek
    match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", youtube_url)
    if not match:
        return jsonify({"error": "Invalid YouTube link"}), 400
    video_id = match.group(1)

    try:
        # Ambil data video dan komentar dari API
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        video_response = youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        ).execute()

        video_info = video_response['items'][0]
        title = video_info['snippet']['title']
        thumbnail = video_info['snippet']['thumbnails']['high']['url']
        like_count = int(video_info['statistics'].get('likeCount', 0))

        comments = []
        comment_response = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=50,
            textFormat="plainText"
        ).execute()

        for item in comment_response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            text = comment['textDisplay']
            likes = comment['likeCount']
            time = comment['publishedAt']
            
            # Sentiment Analysis
            sentiment = TextBlob(text).sentiment.polarity
            if sentiment > 0.1:
                sentiment_label = "positive"
            elif sentiment < -0.1:
                sentiment_label = "negative"
            else:
                sentiment_label = "neutral"

            comments.append({
                "text": text,
                "likes": likes,
                "time": time,
                "sentiment": sentiment_label
            })

        # Hitung summary
        total_comments = len(comments)
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        for c in comments:
            sentiment_counts[c["sentiment"]] += 1

        sentiment_percent = {
            k: round(v / total_comments * 100, 2) if total_comments > 0 else 0
            for k, v in sentiment_counts.items()
        }

        result = {
            "title": title,
            "thumbnail": thumbnail,
            "total_likes": like_count,
            "total_comments": total_comments,
            "sentiment_percent": sentiment_percent,
            "comments": comments
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
