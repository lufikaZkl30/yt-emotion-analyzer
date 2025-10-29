from flask import Flask, render_template, request, jsonify, send_file
from textblob import TextBlob
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
import re
import io
from openpyxl import Workbook

load_dotenv()
app = Flask(__name__)
API_KEY = os.getenv("YOUTUBE_API_KEY")

def extract_video_id(url):
    pattern = r"(?:v=|youtu\.be/|embed/)([a-zA-Z0-9_-]{11})"
    match = re.search(pattern, url)
    return match.group(1) if match else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    video_url = request.form.get('youtubeLinkInput')
    video_id = extract_video_id(video_url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube link"}), 400

    youtube = build('youtube', 'v3', developerKey=API_KEY)

    comments = []
    response = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=30,
        textFormat="plainText"
    ).execute()

    for item in response.get("items", []):
        comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        comments.append(comment)

    if not comments:
        return jsonify({"error": "No comments found"}), 404

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
        "positive": round(pos / total * 100, 2),
        "negative": round(neg / total * 100, 2),
        "neutral": round(neu / total * 100, 2),
        "total_comments": total,
        "top_comment": max(comments, key=lambda c: TextBlob(c).sentiment.polarity),
        "worst_comment": min(comments, key=lambda c: TextBlob(c).sentiment.polarity),
        "comments": comments
    }

    # Simpan hasil analisis di sesi sementara (opsional)
    app.config["LAST_RESULT"] = hasil

    return jsonify(hasil)

@app.route('/download-report', methods=['POST'])
def download_report():
    hasil = app.config.get("LAST_RESULT")
    if not hasil:
        return jsonify({"error": "No data to export"}), 400

    # Buat file Excel dari hasil analisis
    wb = Workbook()
    ws = wb.active
    ws.title = "Sentiment Report"

    ws.append(["Metric", "Value"])
    ws.append(["Positive (%)", hasil["positive"]])
    ws.append(["Negative (%)", hasil["negative"]])
    ws.append(["Neutral (%)", hasil["neutral"]])
    ws.append(["Total Comments", hasil["total_comments"]])
    ws.append([])
    ws.append(["Top Comment", hasil["top_comment"]])
    ws.append(["Worst Comment", hasil["worst_comment"]])
    ws.append([])
    ws.append(["All Comments"])
    for c in hasil["comments"]:
        ws.append([c])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(output,
                     download_name="YTEmotionReport.xlsx",
                     as_attachment=True,
                     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

if __name__ == '__main__':
    app.run(debug=True)
