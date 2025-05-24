pipeline {
    agent any
    
    environment {
        PROJECT_ID = 'api-for-warp-drive'
        REGION = 'us-west1'
        CREDENTIALS_ID = 'gcp-secret-manager'
    }
    
    stages {
        stage('Setup Crawling Environment') {
            steps {
                script {
                    // Access credentials
                    withCredentials([file(credentialsId: env.CREDENTIALS_ID, variable: 'GCP_KEY')]) {
                        env.CLAUDE_API_KEY = sh(
                            script: "gcloud secrets versions access latest --secret='claude-api-key'",
                            returnStdout: true
                        ).trim()
                        env.VERTEX_API_KEY = sh(
                            script: "gcloud secrets versions access latest --secret='vertex-api-key'",
                            returnStdout: true
                        ).trim()
                    }
                }
            }
        }
        
        stage('Crawl and Analyze') {
            parallel {
                stage('Topic Research') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/crawler_processor.py \
                                --start-urls @urls/topic_research.txt \
                                --depth 2 \
                                --output-dir="crawled/research"
                        '''
                    }
                }
                
                stage('Competitive Analysis') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/crawler_processor.py \
                                --start-urls @urls/competitors.txt \
                                --depth 1 \
                                --output-dir="crawled/competitors"
                        '''
                    }
                }
                
                stage('Industry Trends') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/crawler_processor.py \
                                --start-urls @urls/industry_trends.txt \
                                --depth 2 \
                                --output-dir="crawled/trends"
                        '''
                    }
                }
            }
        }
        
        stage('AI Analysis') {
            steps {
                sh '''
                    python3 scripts/ai_processors/analyze_crawled_content.py \
                        --input-dirs="crawled/*" \
                        --output-dir="analyzed" \
                        --models="claude,vertex" \
                        --generate-insights=true
                '''
            }
        }
        
        stage('Content Generation') {
            parallel {
                stage('Research Reports') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/generate_research.py \
                                --input-dir="analyzed" \
                                --output-dir="content/research" \
                                --format="report"
                        '''
                    }
                }
                
                stage('Training Content') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/generate_training.py \
                                --input-dir="analyzed" \
                                --output-dir="content/training" \
                                --format="course"
                        '''
                    }
                }
                
                stage('Video Scripts') {
                    steps {
                        sh '''
                            python3 scripts/ai_processors/generate_videos.py \
                                --input-dir="analyzed" \
                                --output-dir="content/videos" \
                                --template-id="$SYNTHESIA_TEMPLATE_ID"
                        '''
                    }
                }
            }
        }
        
        stage('Quality Assurance') {
            steps {
                sh '''
                    python3 scripts/ai_processors/validate_content.py \
                        --input-dir="content/*" \
                        --check-plagiarism=true \
                        --verify-sources=true \
                        --validate-insights=true
                '''
            }
        }
        
        stage('Content Optimization') {
            steps {
                sh '''
                    python3 scripts/ai_processors/optimize_content.py \
                        --input-dir="content/*" \
                        --seo-optimize=true \
                        --enhance-readability=true \
                        --add-citations=true
                '''
            }
        }
    }
    
    post {
        success {
            sh '''
                python3 scripts/notify_success.py \
                    --message="AI crawling and analysis pipeline completed" \
                    --artifacts="content/*"
            '''
        }
        failure {
            sh '''
                python3 scripts/notify_failure.py \
                    --message="AI crawling pipeline failed" \
                    --logs="logs/*"
            '''
        }
        always {
            archiveArtifacts artifacts: 'content/**/*', fingerprint: true
            junit 'reports/**/*.xml'
        }
    }
}