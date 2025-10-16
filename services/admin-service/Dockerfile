# ============================================
# Multi-stage build for MINIMAL image size
# CPU-ONLY - No GPU/CUDA packages
# ============================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# CRITICAL: Install CPU-ONLY PyTorch FIRST (prevents CUDA download - saves 5GB!)
# Must be done before requirements.txt to ensure CPU version
RUN pip install --no-cache-dir \
    torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu

# Install all other dependencies from requirements.txt
# PyTorch is already installed (CPU version), so it will be skipped
RUN pip install --no-cache-dir -r requirements.txt

# ============================================
# Final stage - smaller runtime image
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies (no build-essential!)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/faiss_index uploads logs

# Expose port
EXPOSE 8009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8009/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8009", "--log-level", "info"]
