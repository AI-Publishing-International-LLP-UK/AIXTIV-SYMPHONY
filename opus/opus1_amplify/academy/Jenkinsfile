pipeline {
    agent any

    environment {
        DEPLOY_DIR = '/var/www/html'
        WORKSPACE_DIR = '/var/lib/jenkins/workspace/visionbackoffice'
    }

    stages {
        stage('Deploy') {
            steps {
                script {
                    sh """
                    set -e
                    echo "Cleaning up deployment directory..."
                    rm -rf /var/www/html/*
                    echo "Changing ownership of deployment directory..."
                    chown -R jenkins:jenkins /var/www/html
                    echo "Synchronizing files..."
                    rsync -aczvAXHS  /var/lib/jenkins/workspace/visionbackoffice/ /var/www/html
                    echo "Installing npm dependencies..."
                    cd /var/www/html/
                    npm install
                    echo "Building project..."
                    npm run build
                    echo "Starting application..."
                    pm2 kill
                    pm2 start npm --name "visionbackoffice" -- start
                    pm2 save
                    """
                }
            }
        }
    }
}
