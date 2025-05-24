pipeline {
    agent any
    
    environment {
        PROJECT_ID = 'api-for-warp-drive'
        REGION = 'us-west1'
        CREDENTIALS_ID = 'gcp-secret-manager'
    }