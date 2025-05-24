from src.core.generators.content_generator import ContentGenerator

class BookGenerator(ContentGenerator):
    def __init__(self, config):
        super().__init__(config)

    def generate(self, parameters):
        """Generate book content"""
        pass