#!/bin/bash
# ==============================================================================
# Automated Daily Backup Script (PostgreSQL + Uploads) to Google Drive
# ==============================================================================

# Configuration
DB_NAME="paktest_db"
DB_USER="paktest_user"
UPLOAD_DIR="/var/www/paktest/backend/uploads"
BACKUP_DIR="/tmp/backups"
RCLONE_DRIVE_NAME="gdrive" # The name you gave to your rclone remote
RCLONE_DESTINATION="gdrive:Paktest_Backups" # Folder in your Google Drive

# Timestamp
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$DATE.tar.gz"

echo "Starting Backup Process: $DATE"

# 1. Create temporary backup directory
mkdir -p "$BACKUP_DIR"

# 2. Backup PostgreSQL Database
echo "Backing up database..."
sudo -u postgres pg_dump "$DB_NAME" > "$DB_BACKUP_FILE"

# 3. Compress Uploads Folder
echo "Compressing uploads folder..."
tar -czf "$UPLOADS_BACKUP_FILE" -C "$UPLOAD_DIR" .

# 4. Upload to Google Drive using rclone
echo "Uploading to Google Drive..."
rclone copy "$DB_BACKUP_FILE" "$RCLONE_DESTINATION/Database/"
rclone copy "$UPLOADS_BACKUP_FILE" "$RCLONE_DESTINATION/Uploads/"

# 5. Cleanup local backups older than 7 days (optional, keeps VPS disk clean)
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -exec rm {} \;

# Also cleanup Google Drive backups older than 30 days (optional)
# rclone delete "$RCLONE_DESTINATION/Database/" --min-age 30d
# rclone delete "$RCLONE_DESTINATION/Uploads/" --min-age 30d

echo "Backup Complete!"
