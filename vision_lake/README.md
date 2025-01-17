# Vision Lake Integration

This module provides integration between Vision Lake and Vertex AI Notebooks.

## Features
- Direct notebook connectivity to Vision Lake storage
- BigQuery integration for data analysis
- Vertex AI integration for ML workflows

## Usage
```python
from vision_lake.notebook_integration import init_vision_lake

# Initialize Vision Lake connection
clients = init_vision_lake()

# Access storage
bucket = clients['storage'].get_bucket('vision-lake-main')

# Run queries
results = clients['bigquery'].query('SELECT * FROM `vision_lake.dataset.table`')
```
