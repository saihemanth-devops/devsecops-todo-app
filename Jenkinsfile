pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-agent
spec:
  containers:
  - name: node
    image: node:18-alpine
    command: ['cat']
    tty: true
  - name: docker
    image: docker:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: docker-sock
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true
  - name: cypress
    image: cypress/included:12.17.4
    command: ['cat']
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    environment {
        // --- CONFIGURATION ---
        DOCKERHUB_USER = 'gandeev'  // <--- FIXED: Now matches your login
        APP_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_HOST_URL = 'http://sonarqube.default.svc.cluster.local:9000'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Security: SCA (Trivy FS)') {
            steps {
                container('trivy') {
                    // Scan the filesystem for vulnerable dependencies
                    sh "trivy fs --format table -o fs-report.html ."
                }
            }
        }

        stage('Code Quality: SonarQube') {
            steps {
                container('node') {
                    script {
                        // Install scanner and run analysis
                        sh 'npm install -g sonar-scanner'
                        withSonarQubeEnv('SonarQube') { 
                            sh """
                            sonar-scanner \
                            -Dsonar.projectKey=todo-app \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=\$SONAR_AUTH_TOKEN
                            """
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('docker') {
                    script {
                        // Login with the credentials ID 'docker-hub-credentials'
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                            // Build image: gandeev/todo-app:3
                            def appImage = docker.build("${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}", "./app")
                            
                            // Push image to Docker Hub
                            appImage.push()
                            appImage.push("latest")
                        }
                    }
                }
            }
        }

        stage('Security: Image Scan (Trivy)') {
            steps {
                container('trivy') {
                    // Scan the image we just built
                    sh "trivy image ${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Minikube') {
            steps {
                container('kubectl') {
                    script {
                        // Update the deployment yaml with the new image tag
                        sh "sed -i 's/REPLACE_ME/${IMAGE_TAG}/g' k8s/deployment.yaml"
                        // Apply to cluster
                        sh "kubectl apply -f k8s/"
                        // Wait for rollout
                        sh "kubectl rollout status deployment/todo-app-v1"
                    }
                }
            }
        }

        stage('E2E Testing (Cypress)') {
            steps {
                container('cypress') {
                    dir('app') {
                        // Run tests against the internal service
                        sh "cypress run --config baseUrl=http://todo-app-service"
                    }
                }
            }
        }
    }
}
