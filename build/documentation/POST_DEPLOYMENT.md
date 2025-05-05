# Post-Deployment Testing & Usage Guide

## 1. System Verification

### Infrastructure Tests
```bash
# Verify GCP setup
./scripts/verify_infrastructure.sh

# Test service account permissions
python scripts/test_permissions.py

# Verify Kubernetes deployments
kubectl get deployments -n coaching2100
```

### Integration Tests
```bash
# Test Synthesia integration
python tests/integration/test_synthesia.py

# Test Google Docs sync
python tests/integration/test_gdocs.py

# Test Vertex AI connection
python tests/integration/test_vertex.py
```

## 2. Usage Scenarios

### Content Generation Pipeline
```python
# Initialize content generator
from scripts.content_generator import ContentGenerator
generator = ContentGenerator()

# Generate personalized content
profile = {
    'job_cluster': 'human_resources',
    'grade_level': 2,
    'enterprise_type': 'large_enterprise'
}
result = generator.generate_content(profile)
```

### Agent Interaction
```python
# Initialize agent manager
from scripts.agent_manager import AgentManager
manager = AgentManager()

# Assign task to specific agent
response = manager.assign_task(
    agent='dr-grant',
    task_type='STRATEGY',
    content=content_data
)
```

### Video Generation
```python
# Initialize video processor
from scripts.video_processor import VideoProcessor
processor = VideoProcessor()

# Create batch of videos
videos = processor.create_video_batch(
    template_id='leadership_series',
    data_list=content_batch
)
```

## 3. Monitoring & Maintenance

### Health Checks
```bash
# Check system health
./scripts/health_check.sh

# Monitor processor status
python scripts/monitor_processors.py

# View agent status
python scripts/check_agents.py
```

### Performance Monitoring
```python
# Initialize monitoring
from scripts.monitor import SystemMonitor
monitor = SystemMonitor()

# Get system metrics
metrics = monitor.get_metrics()
print(f'System Performance:\n{metrics}')
```

## 4. Troubleshooting Guide

### Common Issues
1. Content Generation Failures
   ```python
   # Debug content generation
   from scripts.debug import ContentDebugger
   debugger = ContentDebugger()
   debug_info = debugger.analyze_failure(content_id)
   ```

2. Agent Communication Issues
   ```python
   # Test agent communication
   from scripts.debug import AgentDebugger
   agent_debug = AgentDebugger()
   status = agent_debug.check_communication('dr-grant')
   ```

3. Integration Failures
   ```python
   # Verify integrations
   from scripts.debug import IntegrationDebugger
   integration_debug = IntegrationDebugger()
   status = integration_debug.verify_all_integrations()
   ```

## 5. Deployment Verification Checklist

- [ ] Infrastructure
  - [ ] GCP services active
  - [ ] K8s clusters running
  - [ ] Service accounts configured

- [ ] Integrations
  - [ ] Synthesia API accessible
  - [ ] Google Docs sync working
  - [ ] Vertex AI connected

- [ ] Content Pipeline
  - [ ] Content generation functional
  - [ ] Personalization working
  - [ ] Video generation active

- [ ] Agent System
  - [ ] All agents responsive
  - [ ] Task assignment working
  - [ ] Inter-agent communication active

## 6. Usage Examples

### Example 1: Generate Training Content
```python
from scripts.examples import training_generator

# Generate HR training content
training = training_generator.create_hr_training(
    level='CHRO',
    focus='Leadership Development',
    duration='6_weeks'
)
```

### Example 2: Create Video Series
```python
from scripts.examples import video_creator

# Create leadership video series
series = video_creator.create_series(
    topic='Strategic Leadership',
    episodes=6,
    duration='10_minutes'
)
```

### Example 3: Run Analysis Pipeline
```python
from scripts.examples import analysis_pipeline

# Analyze organizational data
results = analysis_pipeline.analyze_org(
    org_data=data,
    focus='talent_development',
    depth='detailed'
)
```
