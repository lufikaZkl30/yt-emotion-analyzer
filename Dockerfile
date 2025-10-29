# Gunakan Python 3.12 supaya library tokenizers & transformers bisa jalan
FROM python:3.12-slim

# Buat folder kerja
WORKDIR /app

# Salin daftar dependencies
COPY requirements.txt .

# Install alat build (biar torch/tokenizers bisa diinstall)
RUN apt-get update && apt-get install -y build-essential rustc cargo && rm -rf /var/lib/apt/lists/*

# Upgrade pip dan install semua library
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Salin semua file project ke container
COPY . .

# Jalankan app.py sebagai server utama
CMD ["python", "app.py"]
