pipeline {
    agent any

    environment {
        PROJECT_ID = 'api-for-warp-drive'
        DOMAIN = 'coaching2100.com'
        REGION = 'us-west1'
        CREDENTIALS_ID = 'gcp-secret-manager'
        DOCKER_REGISTRY = 'gcr.io/${PROJECT_ID}'
        OWNER_EMAIL = 'pr@coaching2100.com'
        EDITOR_EMAIL = 'dk@coaching2100.com'
    }

    // Rest of pipeline configuration...