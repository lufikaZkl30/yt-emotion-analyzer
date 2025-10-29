# Gunakan Python 3.12 (kompatibel dengan tokenizers & transformers)
FROM python:3.12-slim

# Buat folder kerja
WORKDIR /app

# Salin daftar dependencies dulu
COPY requirements.txt .

# Install alat build yang dibutuhkan (buat compile library kayak torch)
RUN apt-get update && apt-get install -y \
    build-essential \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip + setuptools + wheel (penting biar build cepet & stabil)
RUN pip install --upgrade pip setuptools wheel

# Install semua library dari requirements.txt
RUN pip install -r requirements.txt

# Salin semua file project ke container
COPY . .

# Jalankan app.py sebagai server utama
CMD ["python", "app.py"]
