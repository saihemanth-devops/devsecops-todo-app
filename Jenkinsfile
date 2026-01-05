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
  # 1. JNLP AGENT (The Brain) - Increased Memory to prevent -2 error
  - name: jnlp
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"

  # 2. Node.js
  - name: node
    image: node:18-alpine
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "256Mi"
      limits:
        memory: "512Mi"

  # 3. Docker (Builder)
  - name: docker
    image: docker:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: docker-sock
    resources:
      requests:
        memory: "256Mi"
      limits:
        memory: "1Gi"

  # 4. Sonar Scanner
  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "512Mi"
      limits:
        memory: "1.5Gi"

  # 5. Trivy
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "256Mi"
      limits:
        memory: "1Gi"

  # 6. Cypress
  - name: cypress
    image: cypress/included:12.17.4
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "1Gi"
      limits:
        memory: "2.5Gi"

  # 7. Kubectl (Deployer) - Added explicit resources
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "256Mi"
      limits:
        memory: "512Mi"

  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    environment {
        // --- CONFIGURATION ---
        DOCKERHUB_USER = 'gandeev'
        APP_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_HOST_URL = 'http://sonarqube-sonarqube.default.svc.cluster.local:9000'
    }
    stages {
        stage('Checkout') { steps { checkout scm } }
        
        stage('Security: SCA') { 
            steps { 
                container('trivy') { 
                    timeout(time: 5, unit: 'MINUTES') {
                        sh "trivy fs --format table -o fs-report.html ." 
                    }
                } 
            } 
        }

        stage('Code Quality') { 
            steps { 
                container('sonar') {
                    withSonarQubeEnv('SonarQube') { 
                        sh "sonar-scanner -Dsonar.projectKey=todo-app -Dsonar.sources=. -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.login=\$SONAR_AUTH_TOKEN"
                    }
                }
            } 
        }

        stage('Build & Push') {
            steps {
                container('docker') {
                    script {
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                            def appImage = docker.build("${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}", "./app")
                            appImage.push()
                            appImage.push("latest")
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                container('kubectl') {
                    script {
                        // Using a simple retry block in case of network blips
                        retry(3) {
                            sh "sed -i 's/REPLACE_ME/${IMAGE_TAG}/g' k8s/deployment.yaml"
                            sh "kubectl apply -f k8s/"
                            sh "kubectl rollout status deployment/todo-app-v1"
                        }
                    }
                }
            }
        }

        stage('E2E Test') {
            steps {
                container('cypress') {
                    dir('app') {
                        timeout(time: 15, unit: 'MINUTES') {
                            sh "cypress run --config baseUrl=http://todo-app-service"
                        }
                    }
                }
            }
        }
    }
}
