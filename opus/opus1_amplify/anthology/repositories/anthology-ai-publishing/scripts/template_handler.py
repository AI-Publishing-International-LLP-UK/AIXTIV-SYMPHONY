from typing import Dict, List
from bs4 import BeautifulSoup

class TemplateHandler:
    def __init__(self):
        self.variable_pattern = re.compile(r'^[a-zA-Z][a-zA-Z0-9_]*$')