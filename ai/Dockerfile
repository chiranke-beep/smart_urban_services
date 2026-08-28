# ---- AI Service Dockerfile (FastAPI / Python) ----
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (skip jupyter for production)
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi==0.110.0 uvicorn==0.28.0 pydantic==2.6.4 \
    python-multipart==0.0.9 numpy==1.26.4 pillow==10.2.0 \
    scikit-learn==1.4.1.post1 pandas==2.2.1 requests==2.31.0

# Copy app source and trained models
COPY main.py ./
COPY models/ ./models/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
