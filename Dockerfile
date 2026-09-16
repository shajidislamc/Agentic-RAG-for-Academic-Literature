# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Final Image
FROM python:3.11-slim
WORKDIR /app

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy compiled frontend assets from Stage 1 into the container
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Hugging Face Spaces default port
EXPOSE 7860

# Run FastAPI via Uvicorn on 0.0.0.0:7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]