from flask import Flask, render_template, request, jsonify, send_file
from googleapiclient.discovery import build
from textblob import TextBlob
from dotenv import load_dotenv
from transformers import pipeline
from openpyxl import Workbook
import os, re, io

# --- Setup dasar ---
app = Flask(__name__)
load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Model emosi (Hugging Face)
emotion_model = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion")

# --- Ekstrak ID video dari URL ---
def extract_video_id(url):
    match = re.search(r"(?:v=|youtu\.be/|embed/)([a-zA-Z0-9_-]{11})", url)
    return match.group(1) if match else None

# --- Halaman utama ---
@app.route('/')
def index():
    return render_template('index.html')


# --- Analisis komentar YouTube ---
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    youtube_url = data.get('youtube_url')

    video_id = extract_video_id(youtube_url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube link"}), 400

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        # --- Info video ---
        video = youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        ).execute()["items"][0]

        title = video["snippet"]["title"]
        thumbnail = video["snippet"]["thumbnails"]["high"]["url"]
        like_count = int(video["statistics"].get("likeCount", 0))

        # --- Komentar ---
        comments = []
        response = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=500,
            textFormat="plainText"
        ).execute()

        for item in response["items"]:
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            text = snippet["textDisplay"]
            likes = snippet["likeCount"]
            time = snippet["publishedAt"]

            polarity = TextBlob(text).sentiment.polarity
            sentiment = "positive" if polarity > 0.1 else "negative" if polarity < -0.1 else "neutral"

            try:
                emotion_pred = emotion_model(text[:512])
                top_emotion = max(emotion_pred, key=lambda x: x['score'])['label']
            except:
                top_emotion = "unknown"

            comments.append({
                "text": text,
                "likes": likes,
                "time": time,
                "sentiment": sentiment,
                "emotion": top_emotion
            })

        total_comments = len(comments)

        sentiment_count = {"positive": 0, "negative": 0, "neutral": 0}
        emotion_count = {}

        for c in comments:
            sentiment_count[c["sentiment"]] += 1
            emotion_count[c["emotion"]] = emotion_count.get(c["emotion"], 0) + 1

        sentiment_percent = {k: round(v / total_comments * 100, 2) for k, v in sentiment_count.items()}
        emotion_percent = {k: round(v / total_comments * 100, 2) for k, v in sorted(emotion_count.items(), key=lambda x: x[1], reverse=True)}

        # Most positive / negative / liked
        most_positive = max([c for c in comments if c["sentiment"] == "positive"], key=lambda x: TextBlob(x["text"]).sentiment.polarity, default={"text": "..."})
        most_negative = min([c for c in comments if c["sentiment"] == "negative"], key=lambda x: TextBlob(x["text"]).sentiment.polarity, default={"text": "..."})
        most_liked = max(comments, key=lambda x: x["likes"], default={"text": "..."})

        result = {
            "title": title,
            "thumbnail": thumbnail,
            "total_likes": like_count,
            "total_comments": total_comments,
            "sentiment_percent": sentiment_percent,
            "emotion_percent": emotion_percent,
            "highlights": {
                "positive": most_positive["text"],
                "negative": most_negative["text"],
                "liked": most_liked["text"]
            },
            "comments": comments
        }

        # Simpan hasil ke memori sementara
        app.config["LAST_RESULT"] = result

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Download Excel Report ---
@app.route('/download-report', methods=['POST'])
def download_report():
    hasil = app.config.get("LAST_RESULT")
    if not hasil:
        return jsonify({"error": "No data to export"}), 400

    wb = Workbook()
    ws = wb.active
    ws.title = "YTEmotion Report"

    ws.append(["Title", hasil["title"]])
    ws.append(["Total Likes", hasil["total_likes"]])
    ws.append(["Total Comments", hasil["total_comments"]])
    ws.append([])
    ws.append(["Sentiment", "Percentage"])
    for k, v in hasil["sentiment_percent"].items():
        ws.append([k.capitalize(), v])
    ws.append([])
    ws.append(["Emotion", "Percentage"])
    for k, v in hasil["emotion_percent"].items():
        ws.append([k.capitalize(), v])
    ws.append([])
    ws.append(["Highlights"])
    ws.append(["Most Positive", hasil["highlights"]["positive"]])
    ws.append(["Most Negative", hasil["highlights"]["negative"]])
    ws.append(["Most Liked", hasil["highlights"]["liked"]])
    ws.append([])
    ws.append(["Text", "Likes", "Time", "Sentiment", "Emotion"])
    for c in hasil["comments"]:
        ws.append([c["text"], c["likes"], c["time"], c["sentiment"], c["emotion"]])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        download_name="YTEmotionReport.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))  #
    app.run(host="0.0.0.0", port=port)


