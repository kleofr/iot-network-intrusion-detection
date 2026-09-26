# 🛡️ NetShield AI — IoT Network Intrusion Detection System (NIDS)

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646C9A?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

An enterprise-grade **Machine Learning & Deep Learning IoT Intrusion Detection System (NIDS)** powered by the **ACI-IoT-2023** dataset. The platform combines intelligent feature pipelines, high-accuracy classification models, a high-performance **FastAPI** backend, and a modern **React + TypeScript SOC Dashboard** for real-time traffic inspection and threat detection.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Dataset Details](#-dataset-details)
- [Machine Learning Pipelines](#-machine-learning-pipelines)
- [Quick Start: Docker (Recommended)](#-quick-start-docker-recommended)
- [Local Development Setup](#-local-development-setup)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Environment & Dependencies](#2-environment--dependencies)
  - [3. Running the FastAPI Inference Backend](#3-running-the-fastapi-inference-backend)
  - [4. Running the React + Vite Frontend](#4-running-the-react--vite-frontend)
  - [5. Interactive Computing with Jupyter](#5-interactive-computing-with-jupyter)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [License](#-license)

---

## 🌟 Overview

As Internet of Things (IoT) ecosystems expand across smart homes, industrial environments, and critical infrastructure, network vulnerability surfaces multiply. **NetShield AI** provides an end-to-end pipeline designed to:

1. **Analyze telemetry & packet flow attributes** from the comprehensive **ACI-IoT-2023** benchmark dataset.
2. **Classify anomalies and attacks** in real-time with low latency and high statistical confidence.
3. **Serve predictions** through a lightweight REST API with automated validation.
4. **Visualize live security metrics** and attack distribution on a modern Security Operations Center (SOC) dashboard.

---

## ⚡ Key Features

- **High-Accuracy Classification**: Robust Random Forest & multi-stage classification models trained on modern IoT network traffic.
- **Microsecond-Scale Inference**: Serialized scikit-learn pipelines loaded in memory via joblib bundles for high-throughput packet processing.
- **Automated Validation**: Pydantic models enforcing schema validation and automated protocol normalization (`TCP`, `UDP`, `Other`).
- **Interactive SOC Dashboard**: React 19 + TypeScript web console featuring real-time packet simulation, live threat alerts, and telemetry charts.
- **Zero-Config Docker Orchestration**: Multi-container setup with healthchecks (`FastAPI` backend + `Nginx` frontend).
- **Extensible Research Foundation**: Modular Jupyter notebooks for Exploratory Data Analysis (EDA), feature engineering, and stage-wise classification.

---

## 🏗️ System Architecture

```text
               +-------------------------------------------------+
               |             Incoming Network Packet             |
               +-------------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |       FastAPI REST Service (:8000)          |
                 |  - Pydantic Schema Validation & Normalizer  |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |           Model Inference Pipeline          |
                 |  - OneHotEncoder / StandardScaler Pipeline  |
                 |  - Random Forest / Two-Stage Classifier     |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |            Prediction & Confidence          |
                 |      {"prediction": "...", "confidence"}    |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |       NetShield AI Dashboard (:3000)        |
                 |  - Threat Alerts, Latency & Class Breakdown |
                 +---------------------------------------------+
```

---

## 📁 Project Structure

```text
aci-iot-network-traffic/
├── .dockerignore                     # Docker build exclusions
├── .gitignore                        # Git exclusion rules
├── Dockerfile                        # Multi-stage Dockerfile for FastAPI backend
├── docker-compose.yml                # Multi-service orchestration (Backend + Frontend)
├── requirements.txt                  # Python dependencies
├── start_jupyter.bat                 # One-click Jupyter launcher for Windows
├── README.md                         # Project documentation
│
├── app/                              # FastAPI Production Backend
│   ├── __init__.py
│   └── main.py                       # REST API endpoints, CORS, inference logic
│
├── artifacts/                        # Serialized ML Models & Transformers
│   ├── model_bundle.joblib           # Preprocessor + Random Forest classifier + Label encoder
│   └── two_stage_model_bundle.joblib # Hierarchical two-stage classifier bundle
│
├── data/
│   └── raw/                          # Raw datasets (ACI-IoT-2023.csv, payload captures)
│
├── frontend/                         # React + TypeScript + Vite SOC Dashboard
│   ├── Dockerfile                    # Multi-stage production Nginx container
│   ├── nginx.conf                    # Nginx reverse proxy / static server configuration
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── vite.config.ts                # Vite build configuration
│   └── src/                          # UI components, icons, state management
│
├── notebooks/                        # Jupyter Notebooks
│   ├── DataExploration.ipynb         # EDA, statistical profiles & distribution plots
│   ├── RandomForestClassifier.ipynb  # Primary model training & evaluation pipeline
│   └── TwoStageClassification.ipynb  # Binary (Benign vs Attack) + Multi-class pipeline
│
└── reports/
    └── figures/                      # Exported confusion matrices, ROC curves & plots
```

---

## 📊 Dataset Details

The models are trained and evaluated on the **ACI-IoT-2023** dataset, representing realistic IoT smart-environment traffic comprising both legitimate device telemetry and modern cyberattack vectors:

| Category | Traffic / Attack Types Included |
| :--- | :--- |
| **Benign** | Standard IoT telemetry, sensor pings, device synchronization, DNS queries |
| **Denial of Service (DoS/DDoS)** | ICMP Flood, UDP Flood, TCP SYN Flood, HTTP Flood, Slowloris |
| **Reconnaissance & Probing** | Nmap Port Scan, OS Fingerprinting, Ping Sweep, Vulnerability Scanning |
| **Access Attacks** | SSH Brute Force, Telnet Exploits, Dictionary Attacks |

### Key Flow Features Used for Inference:
- **`protocol_m`**: Transport protocol identifier normalized to categorical space (`tcp`, `udp`, `other`).
- **`sttl`**: Source-to-Destination Time-To-Live (TTL) integer metric.
- **`total_len`**: Total packet length in bytes.

---

## 🧠 Machine Learning Pipelines

### 1. Unified Random Forest Model (`model_bundle.joblib`)
- **Preprocessing**: Pipeline combining `OneHotEncoder(handle_unknown='ignore')` for protocol tokens with numeric normalization.
- **Estimator**: Optimized `RandomForestClassifier` with balanced class weights for anomaly sensitivity.
- **Output**: Direct multi-class prediction and confidence score across all known traffic signatures.

### 2. Two-Stage Hierarchical Classification (`two_stage_model_bundle.joblib`)
- **Stage 1 (Binary Filter)**: Distinguishes Benign baseline traffic from Malicious anomalies.
- **Stage 2 (Threat Specialization)**: Routes detected threats into attack families (DDoS, Scan, Brute Force, etc.) for granular triage.

---

## 🐳 Quick Start: Docker (Recommended)

Run the entire stack (Backend API + Web Dashboard) with a single command using Docker Compose:

```bash
docker compose up --build
```

Once running:
- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Endpoint**: [http://localhost:8000/](http://localhost:8000/)

To run in detached (background) mode:
```bash
docker compose up -d
```

To stop containers:
```bash
docker compose down
```

---

## 💻 Local Development Setup

### 1. Prerequisites

- **Python**: `3.11+`
- **Node.js**: `v20.0.0+` & **npm**: `v10.0.0+`
- **Git**

---

### 2. Environment & Dependencies

Clone the repository and set up a Python virtual environment:

```bash
# Clone repository
git clone https://github.com/<your-username>/aci-iot-network-traffic.git
cd aci-iot-network-traffic

# Create virtual environment
python -m venv .venv
```

**Activate Virtual Environment:**
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

**Install Python dependencies:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Running the FastAPI Inference Backend

Start the Uvicorn ASGI development server:

```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Interactive Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 4. Running the React + Vite Frontend

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

### 5. Interactive Computing with Jupyter

Launch Jupyter Notebook or JupyterLab to interact with data exploration and training notebooks:

**Windows Shortcut:**
```cmd
start_jupyter.bat
```

**Or standard terminal command:**
```bash
jupyter lab
# or
jupyter notebook
```

Navigate to `notebooks/` to inspect:
- [DataExploration.ipynb](file:///k:/Projects/Machine%20Learning/aci-iot-network-traffic/notebooks/DataExploration.ipynb)
- [RandomForestClassifier.ipynb](file:///k:/Projects/Machine%20Learning/aci-iot-network-traffic/notebooks/RandomForestClassifier.ipynb)
- [TwoStageClassification.ipynb](file:///k:/Projects/Machine%20Learning/aci-iot-network-traffic/notebooks/TwoStageClassification.ipynb)

---

## 🔌 API Reference

### Health & Metadata Check

```http
GET /
```

**Response:**
```json
{
  "service": "IoT Intrusion Detector",
  "status": "online",
  "model_loaded_from": "artifacts/model_bundle.joblib",
  "classes": [
    "Benign",
    "DDoS-ICMP_Flood",
    "DDoS-TCP_Flood",
    "DDoS-UDP_Flood",
    "DoS-SYN_Flood",
    "Recon-PortScan",
    "Recon-OSScan",
    "Vulnerability-Scan"
  ]
}
```

---

### Packet Classification Prediction

```http
POST /predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "protocol_m": "tcp",
  "sttl": 64,
  "total_len": 1500
}
```

**Field Descriptions:**
- `protocol_m` *(string, required)*: Transport layer protocol name (`"tcp"`, `"udp"`, or `"other"`).
- `sttl` *(integer, required)*: Source-to-destination Time-to-Live metric.
- `total_len` *(integer, required)*: Total frame/packet size in bytes.

**Sample Success Response (200 OK):**
```json
{
  "prediction": "Benign",
  "confidence": 0.9845
}
```

**Sample Threat Detection Response (200 OK):**
```json
{
  "prediction": "DoS-SYN_Flood",
  "confidence": 0.9412
}
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Machine Learning & Data** | Python 3.11, Scikit-Learn, TensorFlow / Keras, Pandas, NumPy, Joblib |
| **Backend & Serving** | FastAPI, Uvicorn, Pydantic v2 |
| **Frontend & Visualization** | React 19, TypeScript, Vite, Lucide Icons, Modern CSS |
| **Containerization & Deployment**| Docker, Docker Compose, Nginx Alpine |
| **Analysis & Experimentation** | Jupyter Notebook, Matplotlib, Seaborn |

---

## 📄 License

This project is licensed under the **MIT License** — see the LICENSE file for details.
