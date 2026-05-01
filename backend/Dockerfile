FROM python:3.11-slim

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Change ownership of the app directory to the new user
RUN chown -R user:user /app

# Switch to the non-root user
USER user

# Hugging Face Spaces require exposing port 7860
EXPOSE 7860

# We pass the port to uvicorn explicitly to guarantee it binds correctly
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
