from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
from transformers import pipeline
from googleapiclient.discovery import build
import re

app = Flask(__name__)

# === SET YOUR YOUTUBE API KEY ===
YOUTUBE_API_KEY = "YOUR_API_KEY_HERE"  # ← ganti dengan API key kamu

# === NLP Models ===
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

# === Helper: Extract Video ID from YouTube URL ===
def extract_video_id(url):
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)
    return match.group(1) if match else None

# === Helper: Get YouTube Comments ===
def get_video_comments(video_id, max_comments=50):
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    request = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=100,
        textFormat="plainText"
    )
    response = request.execute()

    comments_data = []
    for item in response.get('items', [])[:max_comments]:
        snippet = item['snippet']['topLevelComment']['snippet']
        comments_data.append({
            "text": snippet['textDisplay'],
            "likes": snippet['likeCount'],
            "time": snippet['publishedAt']
        })
    return comments_data

# === Helper: Analyze Sentiment ===
def analyze_sentiment(text):
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    if polarity > 0.1:
        return "positive"
    elif polarity < -0.1:
        return "negative"
    else:
        return "neutral"

# === Helper: Analyze Emotion ===
def analyze_emotion(text):
    emotions = emotion_model(text)
    top_emotion = max(emotions[0], key=lambda x: x["score"])
    return top_emotion["label"]

# === ROUTES ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    youtube_url = data.get("youtube_url")

    video_id = extract_video_id(youtube_url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL."}), 400

    try:
        comments = get_video_comments(video_id)
        if not comments:
            return jsonify({"error": "No comments found."}), 404

        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        emotion_counts = {}

        for comment in comments:
            sentiment = analyze_sentiment(comment["text"])
            emotion = analyze_emotion(comment["text"])

            comment["sentiment"] = sentiment
            comment["emotion"] = emotion

            sentiment_counts[sentiment] += 1
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1

        # Sort by likes to find top comments
        comments_sorted = sorted(comments, key=lambda x: x["likes"], reverse=True)
        total_comments = len(comments)

        # Prepare response
        result = {
            "video_id": video_id,
            "total_comments": total_comments,
            "total_likes": sum([c["likes"] for c in comments]),
            "sentiment_summary": sentiment_counts,
            "emotion_summary": emotion_counts,
            "comments": comments_sorted,
            "highlights": {
                "positive": next((c for c in comments if c["sentiment"] == "positive"), None),
                "negative": next((c for c in comments if c["sentiment"] == "negative"), None),
                "liked": comments_sorted[0] if comments_sorted else None
            }
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
