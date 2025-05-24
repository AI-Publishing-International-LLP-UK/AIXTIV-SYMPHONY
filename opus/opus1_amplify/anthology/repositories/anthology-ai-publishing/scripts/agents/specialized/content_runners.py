# Content Acquisition and Processing Runners

class GoogleDriveRunner:
    def __init__(self):
        self.drive_connector = DriveConnector()
        self.content_processor = ContentProcessor()
        self.metadata_manager = MetadataManager()

    async def sync_drive_content(self):
        """Continuously monitor and sync Google Drive content"""
        try:
            # Monitor changes
            changes = await self.drive_connector.watch_changes()
            
            # Process new content
            for change in changes:
                content = await self.drive_connector.fetch_content(change.file_id)
                processed = await self.content_processor.process(content)
                await self.repository_manager.store(processed)

            return True

        except Exception as e:
            self.logger.error(f'Drive sync error: {e}')
            return False

class ContentHarvestingRunner:
    def __init__(self):
        self.harvesters = {
            'drive': GoogleDriveHarvester(),
            'docs': GoogleDocsHarvester(),
            'sheets': GoogleSheetsHarvester()
        }
        self.processor = ContentProcessor()

    async def harvest_content(self, source_type):
        """Harvest content from various sources"""
        harvester = self.harvesters.get(source_type)
        if not harvester:
            return None

        content = await harvester.harvest()
        processed = await self.processor.process(content)
        return processed