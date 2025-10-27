from flask import Flask, request, jsonify, send_from_directory
app = Flask(__name__)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/script.js')
def serve_script():
    return send_from_directory('.', 'script.js')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    video_url = data.get('url', '')
    # Dummy response (buat testing)
    return jsonify({
        "video_title": "Sample Video",
        "video_thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        "total_comments": 523,
        "total_likes": 1200,
        "sentiment_summary": {"positive": 70, "neutral": 20, "negative": 10},
        "emotions": {"joy": 60, "anger": 5, "sadness": 8, "surprise": 12, "fear": 5, "neutral": 10},
        "most_positive_comment": "I love this video!",
        "most_negative_comment": "Worst thing I’ve ever seen.",
        "most_liked_comment": "Amazing work!",
        "comments": [
            {"text": "Great video!", "sentiment": "positive", "likes": 45, "time": "2h ago"},
            {"text": "Not my taste", "sentiment": "negative", "likes": 3, "time": "5h ago"},
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)
