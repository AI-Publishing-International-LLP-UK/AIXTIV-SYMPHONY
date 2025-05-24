import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

class YouTubePublisher:
    def __init__(self, secrets_file):
        self.secrets_file = secrets_file
        self.credentials = self.get_credentials()
        self.youtube = self.get_youtube_client()
        
    def get_credentials(self):
        return Credentials.from_authorized_user_file(self.secrets_file)
    
    def get_youtube_client(self):
        return build('youtube', 'v3', credentials=self.credentials)
        
    def upload_video(self, video_file, metadata):
        try:
            media = MediaFileUpload(video_file, chunksize=-1, resumable=True)
            
            request = self.youtube.videos().insert(
                part="snippet,status",
                body={
                    "snippet": {
                        "title": metadata['title'],
                        "description": metadata['description'],
                        "tags": metadata['tags'],  
                        "categoryId": metadata['category_id']
                    },
                    "status": {
                        "privacyStatus": metadata['privacy_status']
                    }
                },
                media_body=media
            )
            
            response = request.execute()
            print(f'Video upload successful. Video ID: {response["id"]}')
            return response['id']
            
        except HttpError as e:
            print(f'Error uploading video: {e}')
            return None
        
    def set_thumbnail(self, video_id, thumbnail_file):  
        try:
            request = self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=thumbnail_file
            )
            response = request.execute()
            print(f'Thumbnail set successfully for video ID: {video_id}')
            
        except HttpError as e:
            print(f'Error setting thumbnail: {e}')

    def add_to_playlist(self, playlist_id, video_id):
        try:
            request = self.youtube.playlistItems().insert(
                part="snippet",
                body={
                    "snippet": {
                        "playlistId": playlist_id,
                        "resourceId": {
                            "kind": "youtube#video",
                            "videoId": video_id
                        }
                    }
                }
            )
            response = request.execute()
            print(f'Video added to playlist. Playlist item ID: {response["id"]}')
            
        except HttpError as e:
            print(f'Error adding video to playlist: {e}')
