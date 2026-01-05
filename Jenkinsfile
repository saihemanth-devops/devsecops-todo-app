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
        // UPDATE THIS
        DOCKERHUB_USER = 'saihemanthcartrade'
        APP_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Security: SCA (Trivy)') {
            steps {
                container('trivy') {
                    // Check filesystem for package vulnerabilities
                    sh "trivy fs --exit-code 0 ."
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('docker') {
                    script {
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                            def appImage = docker.build("${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}", "./app")
                            appImage.push()
                        }
                    }
                }
            }
        }

        stage('Security: Image Scan (Trivy)') {
            steps {
                container('trivy') {
                    // Check the ACTUAL built image
                    sh "trivy image ${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Minikube') {
            steps {
                container('kubectl') {
                    script {
                         // Update Image Tag in Deployment
                        sh "sed -i 's/REPLACE_ME/${IMAGE_TAG}/g' k8s/deployment.yaml"
                        
                        // Apply Manifests
                        sh "kubectl apply -f k8s/"
                        
                        // Wait for Deployment to finish
                        sh "kubectl rollout status deployment/todo-app-v1"
                    }
                }
            }
        }

        stage('E2E Testing (Cypress)') {
            steps {
                container('cypress') {
                    dir('app') {
                        // Cypress runs tests against the live service
                        sh "cypress run --config baseUrl=http://todo-app-service"
                    }
                }
            }
        }
    }
}
