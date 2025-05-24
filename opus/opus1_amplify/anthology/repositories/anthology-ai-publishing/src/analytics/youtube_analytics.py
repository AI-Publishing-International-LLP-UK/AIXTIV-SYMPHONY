from googleapiclient.discovery import build

class YouTubeAnalytics:
    def __init__(self, credentials):
        self.credentials = credentials
        self.analytics = self.get_analytics_client()

    def get_analytics_client(self):
        return build('youtubeAnalytics', 'v2', credentials=self.credentials)

    def get_video_views(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',
            metrics='views',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()

    def get_video_watch_time(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31', 
            metrics='estimatedMinutesWatched',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()
    
    def get_video_average_view_duration(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',
            metrics='averageViewDuration',
            dimensions='video',
            filters=f'video=={video_id}'  
        ).execute()

    def get_video_subscribers_gained(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',
            metrics='subscribersGained',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()

    def get_video_likes(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',
            metrics='likes',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()

    def get_video_dislikes(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',  
            metrics='dislikes',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()

    def get_video_shares(self, video_id):
        return self.analytics.reports().query(
            ids=f'channel==MINE',
            startDate='2020-01-01',
            endDate='2025-12-31',
            metrics='shares',
            dimensions='video',
            filters=f'video=={video_id}'
        ).execute()
