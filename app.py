from flask import Flask, render_template, request, jsonify
from textblob import TextBlob

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    # Ambil data dari form input di HTML
    video_url = request.form.get('youtubeLinkInput')

    # (Sementara) simulasi komentar
    comments = [
        "Video ini keren banget!",
        "Agak membosankan sih.",
        "Suka banget sama pembahasan ini!",
        "Kurang jelas di bagian akhir."
    ]

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
        "positive": round(pos / total * 100, 2),
        "negative": round(neg / total * 100, 2),
        "neutral": round(neu / total * 100, 2),
        "top_comment": max(comments, key=lambda c: TextBlob(c).sentiment.polarity),
        "worst_comment": min(comments, key=lambda c: TextBlob(c).sentiment.polarity)
    }

    return jsonify(hasil)

if __name__ == '__main__':
    app.run(debug=True)
