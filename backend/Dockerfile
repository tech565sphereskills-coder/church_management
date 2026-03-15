FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies needed for psycopg2 / general compilation
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN DEFAULT_AUTO_FIELD=django.db.models.BigAutoField python manage.py collectstatic --noinput

# Run gunicorn
# Note: In a real environment, you probably want to run migrations first or use a wrapper script
CMD gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
