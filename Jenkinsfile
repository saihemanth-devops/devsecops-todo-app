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
<<<<<<< HEAD
=======
  # 1. JNLP AGENT
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: jnlp
    resources:
      limits:
        memory: "1Gi"
  
<<<<<<< HEAD
  # KANIKO: Secure Builder
=======
  # 2. KANIKO (Replaces Docker for Secure Builds)
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['/busybox/cat']
    tty: true
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker/config.json
        subPath: .dockerconfigjson

<<<<<<< HEAD
=======
  # 3. Sonar Scanner
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1Gi"

<<<<<<< HEAD
=======
  # 4. Trivy
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true

<<<<<<< HEAD
  - name: zap
    image: zaproxy/zap-stable
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1.5Gi"

=======
  # 5. Cypress
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: cypress
    image: cypress/included:12.17.4
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "2Gi"

<<<<<<< HEAD
=======
  # 6. Kubectl
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true

<<<<<<< HEAD
=======
  # Secret for Kaniko to push to Docker Hub
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
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
<<<<<<< HEAD
        // Pointing to Sonar in the 'tools' namespace
=======
        // Update this URL if needed (e.g., to .tools namespace)
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
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
<<<<<<< HEAD
=======
                        // Kaniko builds and pushes automatically
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
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

<<<<<<< HEAD
        stage('Security: Image Scan') {
            steps { container('trivy') { sh "trivy image ${DOCKERHUB_USER}/${APP_NAME}:${IMAGE_TAG}" } }
        }

        // --- DEPLOY TO DEV ---
        stage('Deploy to DEV') {
=======
        stage('Deploy') {
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
            steps {
                container('kubectl') {
                    script {
                        sh "sed -i 's/REPLACE_ME/${IMAGE_TAG}/g' k8s/deployment.yaml"
<<<<<<< HEAD
                        // Deploying to 'dev' namespace
                        sh "kubectl apply -f k8s/ -n dev"
                        sh "kubectl rollout status deployment/todo-app-v1 -n dev"
=======
                        sh "kubectl apply -f k8s/"
                        sh "kubectl rollout status deployment/todo-app-v1"
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
                    }
                }
            }
        }

<<<<<<< HEAD
        // --- TEST DEV ENVIRONMENT ---
        stage('Test DEV (DAST & E2E)') {
            parallel {
                stage('DAST (ZAP)') {
                    steps {
                        container('zap') {
                            // Targeting the service in 'dev' namespace
                            sh "/zap/zap-baseline.py -t http://todo-app-service.dev.svc.cluster.local -r zap_report.html || exit 0"
                        }
                    }
                }
                stage('E2E (Cypress)') {
                    steps {
                        container('cypress') {
                            dir('app') {
                                // Targeting the service in 'dev' namespace
                                sh "cypress run --config baseUrl=http://todo-app-service.dev.svc.cluster.local"
                            }
                        }
                    }
                }
            }
        }

        // --- PROMOTE TO PROD ---
        stage('Promote to PROD') {
            steps {
                input message: 'Tests passed on DEV. Deploy to PROD?', ok: 'Deploy!'
                container('kubectl') {
                    script {
                        // Deploying same image to 'prod' namespace
                        sh "kubectl apply -f k8s/ -n prod"
                        sh "kubectl rollout status deployment/todo-app-v1 -n prod"
=======
        stage('E2E Test') {
            steps {
                container('cypress') {
                    dir('app') {
                        timeout(time: 10, unit: 'MINUTES') {
                            sh "cypress run --config baseUrl=http://todo-app-service"
                        }
>>>>>>> f9ba6617eb7d8c8c20976223f3cdf6c813d0ec87
                    }
                }
            }
        }
    }
}
