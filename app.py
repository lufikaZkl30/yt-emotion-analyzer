from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os, re

load_dotenv()
app = Flask(__name__)

API_KEY = os.getenv("YOUTUBE_API_KEY")

def extract_video_id(url):
    match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", url)
    return match.group(1) if match else None

def get_youtube_comments(video_id):
    youtube = build("youtube", "v3", developerKey=API_KEY)
    comments = []

    request = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=20,
        textFormat="plainText"
    )
    response = request.execute()

    for item in response["items"]:
        comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        comments.append(comment)

    return comments

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    video_url = request.form.get('youtubeLinkInput')
    video_id = extract_video_id(video_url)

    if not video_id:
        return jsonify({"error": "URL YouTube tidak valid!"}), 400

    try:
        comments = get_youtube_comments(video_id)
    except Exception as e:
        return jsonify({"error": f"Gagal ambil komentar: {e}"}), 500

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
        "positive": round(pos / total * 100, 2),
        "negative": round(neg / total * 100, 2),
        "neutral": round(neu / total * 100, 2),
        "total_comments": total,
        "top_comment": max(comments, key=lambda c: TextBlob(c).sentiment.polarity),
        "worst_comment": min(comments, key=lambda c: TextBlob(c).sentiment.polarity)
    }

    return jsonify(hasil)

if __name__ == '__main__':
    app.run(debug=True)
