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
  # 1. The 'jnlp' container is the Agent itself. We give it more RAM to survive.
  containers:
  - name: jnlp
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "1024Mi"
        cpu: "1000m"
  
  # 2. Node.js container
  - name: node
    image: node:18-alpine
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "512Mi"

  # 3. Docker (Builds images)
  - name: docker
    image: docker:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: docker-sock
    resources:
      limits:
        memory: "512Mi"

  # 4. Sonar Scanner (Heavy Java process)
  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "512Mi"
      limits:
        memory: "1536Mi"  # 1.5 GB limit

  # 5. Trivy (Security Scan)
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1Gi"

  # 6. Cypress (Chrome Browser - Very Heavy)
  - name: cypress
    image: cypress/included:12.17.4
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: "1Gi"
      limits:
        memory: "2560Mi" # 2.5 GB limit

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
        DOCKERHUB_USER = 'gandeev'
        APP_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        // Update if your service name is different
        SONAR_HOST_URL = 'http://sonarqube-sonarqube.default.svc.cluster.local:9000'
    }
    stages {
        stage('Checkout') { steps { checkout scm } }
        
        stage('Security: SCA') { 
            steps { 
                container('trivy') { 
                    sh "trivy fs --format table -o fs-report.html ." 
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
                        sh "sed -i 's/REPLACE_ME/${IMAGE_TAG}/g' k8s/deployment.yaml"
                        sh "kubectl apply -f k8s/"
                        sh "kubectl rollout status deployment/todo-app-v1"
                    }
                }
            }
        }

        stage('E2E Test') {
            steps {
                container('cypress') {
                    dir('app') {
                        // Cypress can be slow to start, giving it 10 mins
                        timeout(time: 10, unit: 'MINUTES') {
                            sh "cypress run --config baseUrl=http://todo-app-service"
                        }
                    }
                }
            }
        }
    }
}
