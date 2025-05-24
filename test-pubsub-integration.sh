#!/bin/bash
# This script publishes a message to the drive-updates PubSub topic using gcloud CLI

# Generate a random ID
FILE_ID="file_$(date +%s)_$RANDOM"

# Create a sample message JSON
MESSAGE="{
  \"fileId\": \"$FILE_ID\",
  \"name\": \"Test Document.docx\",
  \"mimeType\": \"application/vnd.openxmlformats-officedocument.wordprocessingml.document\",
  \"driveId\": \"coaching2100\",
  \"updateTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\"
}"

# Convert to base64
MESSAGE_BASE64=$(echo "$MESSAGE" | base64)

# Display info
echo "Publishing message to drive-updates topic:"
echo "$MESSAGE"
echo

# Publish to PubSub
gcloud pubsub topics publish drive-updates --message="$MESSAGE_BASE64"

echo
echo "Message published to PubSub topic drive-updates"
echo "Check Firebase console for logs and Firestore for created document"
echo "File ID: $FILE_ID"