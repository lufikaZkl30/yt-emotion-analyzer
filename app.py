from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    video_url = request.form['videoUrl']

    # Simulasi hasil analisis (nanti bisa kamu ganti pakai NLP sungguhan)
    hasil = {
        "video_url": video_url,
        "positive": random.randint(60, 90),
        "negative": random.randint(5, 20),
        "neutral": random.randint(5, 15),
        "top_comment": "Video ini sangat menginspirasi!",
        "worst_comment": "Kurang menarik, maaf."
    }

    return jsonify(hasil)

if __name__ == '__main__':
    app.run(debug=True)
