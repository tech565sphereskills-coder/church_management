#!/bin/bash

# Configuration
# Path to docker-compose file (adjust if the script is run from a different directory)
COMPOSE_PATH="."
# Where to store backups
BACKUP_DIR="backups/postgres"
# Number of days to keep backups
KEEP_DAYS=7

# Define variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/sanctuary_db_$TIMESTAMP.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup: $FILENAME"

# Run pg_dump inside the 'db' container and gzip the output
# Using the credentials defined indocker-compose.yml
# We assume the container name or service name is 'db' and database is 'sanctuary_db', user 'sanctuary_user'
docker compose -f "$COMPOSE_PATH/docker-compose.yml" exec -T db pg_dump -U sanctuary_user sanctuary_db | gzip > "$FILENAME"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully."
else
    echo "Error: Database backup failed."
    rm -f "$FILENAME"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $KEEP_DAYS days in $BACKUP_DIR..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$KEEP_DAYS -exec rm {} \;
echo "Cleanup complete."
