# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies for FastAPI and ML model inference
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    "uvicorn[standard]>=0.28.0" \
    scikit-learn>=1.4.0 \
    pandas>=2.2.0 \
    numpy>=1.26.0 \
    joblib>=1.3.0 \
    pydantic>=2.0.0 \
    python-dotenv>=1.0.1

# Copy application and trained model artifacts
COPY app/ ./app/
COPY artifacts/ ./artifacts/

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
