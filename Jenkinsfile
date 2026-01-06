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
  # 1. JNLP AGENT
  - name: jnlp
    resources:
      limits:
        memory: "1Gi"
  
  # 2. KANIKO (Replaces Docker for Secure Builds)
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['/busybox/cat']
    tty: true
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker/config.json
        subPath: .dockerconfigjson

  # 3. Sonar Scanner
  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1Gi"

  # 4. Trivy
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true

  # 5. Cypress
  - name: cypress
    image: cypress/included:12.17.4
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "2Gi"

  # 6. Kubectl
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true

  # Secret for Kaniko to push to Docker Hub
  volumes:
    - name: kaniko-secret
      secret:
        secretName: docker-cred-secret
        items:
          - key: .dockerconfigjson
            path: .dockerconfigjson
'''
        }
    }
    environment {
        DOCKERHUB_USER = 'gandeev'
        APP_NAME = 'todo-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        // Update this URL if needed (e.g., to .tools namespace)
        SONAR_HOST_URL = 'http://sonarqube-sonarqube.tools.svc.cluster.local:9000'
    }
    stages {
        stage('Checkout') { steps { checkout scm } }
        
        stage('SCA: Dependency Scan') { 
            steps { container('trivy') { sh "trivy fs --format table -o fs-report.html ." } } 
        }

        stage('SAST: Code Quality') { 
            steps { 
                container('sonar') {
                    withSonarQubeEnv('SonarQube') { 
                        sh "sonar-scanner -Dsonar.projectKey=todo-app -Dsonar.sources=. -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.login=\$SONAR_AUTH_TOKEN"
                    }
                }
            } 
        }

        stage('Build & Push (Kaniko)') {
            steps {
                container('kaniko') {
                    script {
                        // Kaniko builds and pushes automatically
                        sh """
                        /kaniko/executor --context `pwd` \
                        --dockerfile `pwd`/app/Dockerfile \
                        --destination ${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG} \
                        --destination ${DOCKERHUB_USER}/${APP_NAME}:latest
                        """
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
                        timeout(time: 10, unit: 'MINUTES') {
                            sh "cypress run --config baseUrl=http://todo-app-service"
                        }
                    }
                }
            }
        }
    }
}
