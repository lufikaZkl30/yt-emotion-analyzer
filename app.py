from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
import re

# Load variabel dari file .env
load_dotenv()

app = Flask(__name__)

# Ambil API Key dari environment
API_KEY = os.getenv("YOUTUBE_API_KEY")
API_URL = os.getenv("API_URL")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    video_url = request.form.get('youtubeLinkInput')

    # Ambil ID video dari URL (regex)
    video_id_match = re.search(r"v=([a-zA-Z0-9_-]{11})", video_url)
    if not video_id_match:
        return jsonify({"error": "URL YouTube tidak valid."}), 400

    video_id = video_id_match.group(1)

    # Hubungkan ke YouTube API
    youtube = build('youtube', 'v3', developerKey=API_KEY)

    # Ambil komentar (maks 20 komentar)
    request_api = youtube.commentThreads().list(
        part='snippet',
        videoId=video_id,
        maxResults=20,
        textFormat='plainText'
    )
    response = request_api.execute()

    # Ambil teks komentar
    comments = [item['snippet']['topLevelComment']['snippet']['textDisplay'] for item in response['items']]

    # Analisis sentimen
    pos, neg, neu = 0, 0, 0
    for c in comments:
        polarity = TextBlob(c).sentiment.polarity
        if polarity > 0.1:
            pos += 1
        elif polarity < -0.1:
            neg += 1
        else:
            neu += 1

    total = len(comments)
    hasil = {
        "video_url": video_url,
        "total_comments": total,
        "positive": round(pos / total * 100, 2),
        "negative": round(neg / total * 100, 2),
        "neutral": round(neu / total * 100, 2),
        "top_comment": max(comments, key=lambda c: TextBlob(c).sentiment.polarity),
        "worst_comment": min(comments, key=lambda c: TextBlob(c).sentiment.polarity)
    }

    return jsonify(hasil)

if __name__ == '__main__':
    app.run(debug=True)
