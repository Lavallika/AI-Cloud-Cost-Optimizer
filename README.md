# AI Cloud Cost Optimizer

An AI/ML-powered cloud cost monitoring, prediction, and optimization platform designed to analyze infrastructure spending across cloud providers, forecast monthly resource expenses, detect anomalies via intelligent alerts, and deliver actionable right-sizing recommendations.

---

## Resume-Ready Summary

> Engineered **AI Cloud Cost Optimizer**, a full-stack FinOps platform utilizing React, Node.js/Express, PostgreSQL, and Python/FastAPI to monitor cloud spending and deliver resource optimization recommendations. Implemented a **RandomForestRegressor** machine learning pipeline achieving an $R^2$ score of approximately **95.39%** on test data for monthly cost estimation, integrated with a multi-criteria notification engine and user-level preference controls.

---

## Project Overview

Modern cloud architectures span multiple services (compute, storage, databases, networking) and providers, frequently suffering from over-provisioning, idle capacity, and unexpected billing spikes. 

**AI Cloud Cost Optimizer** bridges the gap between infrastructure metrics and cost intelligence. It continuously ingests resource utilization metrics (CPU, memory, storage, network, and request counts), stores them in a secure multi-tenant PostgreSQL database, analyzes utilization patterns against rule-based and machine-learning thresholds, and provides engineering and finance teams with:
- **Predictive Cost Modeling**: Estimates upcoming monthly bills based on actual utilization patterns.
- **AI-Assisted Optimization**: Pinpoints underutilized compute, unoptimized memory allocations, over-provisioned storage tiers, and idle schedules.
- **Proactive Alerting**: Automatically triggers high-cost warnings, spending surge alerts, and low-utilization notifications based on user-configurable criteria.
- **Reporting & Visualization**: Generates interactive dashboards, trend breakdowns, and exportable CSV/PDF audit reports.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, React Router, Lucide Icons |
| **Backend** | Node.js, Express.js, PostgreSQL (`pg` pool), JWT (`jsonwebtoken`), `bcryptjs` |
| **AI / ML Service** | Python 3.10+, FastAPI, scikit-learn (`RandomForestRegressor`), pandas, numpy, joblib |
| **Database** | PostgreSQL |
| **Architecture** | Microservices / REST API Architecture with strict user data isolation |

---

## System Architecture

```text
               +---------------------------------------+
               |        React Frontend (Vite)          |
               |  - Analytics & Interactive Charts     |
               |  - Cost Record Management & Search    |
               |  - Notification Center & Preferences  |
               |  - Printable & CSV Export Reports     |
               +-------------------+-------------------+
                                   |
                                   | HTTP / REST (JWT Auth)
                                   v
               +---------------------------------------+
               |      Node.js + Express Backend        |
               |  - Auth & Password Hashing (bcrypt)   |
               |  - User-Scoped Data Validation        |
               |  - Alert & Notification Dispatcher    |
               |  - Cost Analytics & Aggregations      |
               +---------+-------------------+---------+
                         |                   |
            SQL Queries  |                   | Forward Metrics Payload
        (Parameterized)  |                   | (Fail-Safe HTTP Client)
                         v                   v
+-----------------------------+    +---------------------------------------+
|     PostgreSQL Database     |    |       Python FastAPI ML Service       |
|  - users                    |    |  - RandomForestRegressor Cost Model   |
|  - cloud_costs              |    |  - Multi-Resource Optimizer Engine    |
|  - notifications            |    |  - Data Preprocessing Pipeline        |
|  - notification_preferences |    +-------------------+-------------------+
+-----------------------------+                        |
                                                       v
                                    +--------------------------------------+
                                    |     Predicted Monthly Cost &         |
                                    |     Optimization Recommendations     |
                                    +--------------------------------------+
```

---

## Directory Structure

```text
AI-Cloud-Cost-Optimizer/
├── backend/
│   ├── config/                     # Database connection pool setup
│   ├── middleware/                 # JWT authentication middleware
│   ├── migrations/                 # Schema migrations (user isolation, etc.)
│   ├── routes/                     # Express REST route handlers
│   │   ├── authRoutes.js           # Authentication (register, login, me)
│   │   ├── costRoutes.js           # Cloud cost CRUD & query endpoints
│   │   ├── analyticsRoutes.js      # Aggregations, trends, and drivers
│   │   ├── notificationRoutes.js   # Notification polling & read status
│   │   ├── notificationPreferenceRoutes.js # User alert settings
│   │   └── recommendationRoutes.js # AI & fallback recommendation routing
│   ├── utils/                      # Alert generation & fallback heuristics
│   ├── server.js                   # Backend application entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/                 # Static visual assets
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/               # Protected route & auth guards
│   │   │   ├── dashboard/          # Metric cards, quick actions
│   │   │   ├── layout/             # Navbar, sidebar, notification dropdown
│   │   │   └── reports/            # Print layout and export modal
│   │   ├── context/                # Auth, cost, and alert contexts
│   │   ├── pages/                  # Dashboard, Costs, Analytics, Optimization, Reports
│   │   ├── routes/                 # Client-side route configuration
│   │   ├── services/               # Axios/Fetch API service clients
│   │   ├── utils/                  # Currency formatting & helpers
│   │   ├── App.jsx                 # Main application component
│   │   ├── App.css
│   │   ├── index.css               # Tailwind CSS integration
│   │   └── main.jsx                # Vite React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ml-service/
│   ├── data/                       # Cloud cost historical training dataset
│   ├── models/                     # Serialized model (.pkl) & metadata (.json)
│   ├── optimization/               # Rule-based & heuristic optimization logic
│   ├── preprocessing/              # Data cleaning and feature engineering
│   ├── training/                   # Model training script
│   ├── utils/                      # Helper calculation routines
│   ├── main.py                     # FastAPI server & prediction endpoints
│   └── requirements.txt
│
└── dataset/                        # Reference datasets and raw samples
```

---

## Core Features Implemented

### 1. Authentication & Security
- **User Registration & Login**: Validated email and credential submission with automatic account creation.
- **Password Hashing**: Strong password encryption using `bcryptjs` (salt rounds: 10).
- **Stateless JWT Authorization**: Cryptographically signed JSON Web Tokens (7-day validity) transmitted via `Authorization: Bearer <token>`.
- **Protected Routes**: Client-side navigational guards and server-side route-level authentication middleware.
- **User Data Isolation**: Every database query is strictly scoped to `req.user.id` verified from the token payload. No `user_id` parameter accepted from client request bodies.
- **Parameterized SQL**: 100% of PostgreSQL queries use parameter placeholders (`$1`, `$2`), eliminating SQL injection vulnerabilities.

### 2. Cloud Cost Management
- **Full CRUD Support**: Add, view, filter, and delete cloud cost records with atomic database transactions.
- **Multi-Cloud Attribute Tracking**:
  - Providers: AWS, Microsoft Azure, Google Cloud Platform (GCP).
  - Services: EC2, S3, RDS, Azure VMs, Blob Storage, Google Compute Engine, BigQuery, etc.
  - Regions: Mumbai, US East, US West, Europe West, etc.
- **Utilization & Traffic Metrics**: CPU utilization (%), memory utilization (%), storage utilization (%), total usage hours, request volume, and data transfer (GB).
- **Search & Filter Controls**: Real-time multi-attribute search across provider, service, and region.

### 3. Dynamic Dashboard
- **Total & Monthly Spend Metrics**: Aggregates live spending data directly from PostgreSQL.
- **AI-Estimated Savings**: Summarizes potential cost reductions calculated across all active infrastructure records.
- **Active Resource Count**: Tracks the volume of provisioned resources under management.
- **Monthly Cost Trend**: Visualized through responsive line charts.
- **Service Cost Breakdown**: Visualized via interactive donut and bar charts using Recharts.
- **Recent Activity Feed**: Real-time snapshot of newly added or modified infrastructure items.

### 4. Advanced Analytics
- **Multi-Period Filtering**: Analyze spending across customizable windows: `7days`, `30days`, `3months`, `6months`, and `12months`.
- **Multi-Dimensional Spend Distribution**: Breakdowns by cloud provider, service type, and geographical region.
- **Current vs. Previous Period Variance**: Percentage increase or decrease comparisons to detect spending surges.
- **Automated Cost Insights**: Heuristic analysis identifying the highest cost drivers and spending velocity.

### 5. AI/ML Cost Prediction

The ML microservice uses a supervised regression model (**RandomForestRegressor**) trained on historical cloud utilization telemetry to estimate monthly infrastructure costs.

#### Dataset Specifications
- **Cleaned Records**: 116 records
- **Total Columns**: 12 columns
- **Input Features (9)**:
  1. `provider` (Categorical)
  2. `service` (Categorical)
  3. `region` (Categorical)
  4. `cpu_utilization` (Continuous, %)
  5. `memory_utilization` (Continuous, %)
  6. `storage_utilization` (Continuous, %)
  7. `usage_hours` (Continuous, hours)
  8. `request_count` (Discrete, count)
  9. `data_transfer_gb` (Continuous, GB)
- **Target Variable**: `monthly_cost` (INR)
- **Train / Test Split**: 92 training samples, 24 testing samples

#### Model Evaluation & Benchmark

| Model | MAE (₹) | RMSE (₹) | $R^2$ Score |
|---|---|---|---|
| **Linear Regression** | 3,747.54 | 5,013.44 | 0.7329 |
| **RandomForestRegressor (Selected)** | **1,141.71** | **2,083.53** | **0.9539** |

> **Evaluation Note:** The selected `RandomForestRegressor` model achieves an $R^2$ score of approximately **95.39%** on the available test dataset, indicating that it explains ~95.39% of the variance in monthly cloud costs within the tested scope. (This metric represents the coefficient of determination $R^2$ on the test dataset, not classification accuracy).

---

### 6. AI-Assisted Optimization Engine

The optimization engine combines ML cost predictions with deterministic FinOps heuristics:
- **Compute Right-Sizing**: Identifies instances running under 30% CPU utilization and suggests downsizing to smaller instance families.
- **Memory Optimization**: Detects low memory utilization (<30%) and recommends memory-balanced instance tiers.
- **Storage Tiering**: Flags low storage activity (<40%) and recommends migrating data to colder, cost-effective storage tiers.
- **Off-Hours Scheduling**: Identifies non-continuous usage (<500 hours/month) and suggests automated start/stop schedules for non-production environments.
- **Network Routing**: Analyzes cross-region data transfers exceeding 200 GB and advises CDN caching or local endpoints.
- **Impact & Severity Tagging**: Classifies recommendations into High, Medium, and Low impact tiers based on potential savings percentage.

> **Disclaimer:** Potential savings generated by the platform are calculated **estimates and optimization opportunities** based on historical utilization and test models. They do not constitute guaranteed financial results or contracted provider discounts.

---

### 7. Notification & Alerting System

The backend automatically evaluates newly inserted cost records against a 5-point alert engine:

| Alert Type | Severity | Trigger Condition |
|---|---|---|
| **High Cost Alert** (`HIGH_COST`) | Critical | Monthly cost meets or exceeds user threshold (default: ₹10,000) |
| **Cost Increase Alert** (`COST_INCREASE`) | Warning | Cost increased by $\ge 10\%$ compared to previous billing record |
| **Low Utilization Alert** (`LOW_UTILIZATION`) | Warning | Resource CPU, Memory, or Storage utilization is $<30\%$ |
| **AI Recommendation Alert** (`AI_RECOMMENDATION`) | Info | ML engine generated a viable optimization plan |
| **Optimization Opportunity Alert** (`OPTIMIZATION_OPPORTUNITY`) | Info | Measurable potential monthly savings identified |

#### Notification Features
- **Real-Time Polling**: Frontend regularly synchronizes with the server for prompt updates.
- **Unread Counter**: Badge indicator displaying unread notifications.
- **State Management**: Individual mark-as-read, mark-all-read, and delete actions.
- **24-Hour Deduplication**: Prevents alert flooding by suppressing duplicate alerts for the same resource and type within a 24-hour window.
- **User Isolation**: Notifications are strictly scoped to the owning user.

---

### 8. User-Configurable Notification Preferences

Users maintain complete control over which alerts they receive via preferences persisted in PostgreSQL:
- Toggle switches for all 5 alert types (`high_cost_enabled`, `cost_increase_enabled`, `low_utilization_enabled`, `ai_recommendation_enabled`, `optimization_opportunity_enabled`).
- **Custom High-Cost Threshold**: Configurable monetary trigger (default: **₹10,000**, customizable up to ₹10,000,000).
- **Behavioral Rules**:
  - Disabling an alert type suppresses future alerts of that type; existing historical alerts remain intact.
  - Preferences can be reset to system defaults with a single click.
  - Preferences are strictly user-specific.

---

### 9. Auditing & Reports

- **Interactive Summary**: Key cost metrics, breakdown by cloud provider, service, and region.
- **CSV Export**: Clean tabular data export for spreadsheet modeling and accounting integration.
- **Printable / PDF Report**: Clean, printer-friendly CSS layout containing spending breakdowns, visual trend summaries, and active AI recommendations.
- **Savings Disclaimer**: Standardized advisory noting that displayed savings represent potential opportunities.

---

## Conceptual Database Schema

The platform relies on four core PostgreSQL tables with foreign key constraints and user scoping:

```
               +---------------------------+
               |           users           |
               +---------------------------+
               | id (PK, SERIAL)           |
               | name (VARCHAR)            |
               | email (VARCHAR, UNIQUE)   |
               | password_hash (VARCHAR)   |
               | created_at (TIMESTAMP)    |
               +-------------+-------------+
                             |
         +-------------------+-------------------+
         | 1:N               | 1:N               | 1:1
         v                   v                   v
+------------------+ +------------------+ +-------------------------------+
|   cloud_costs    | |  notifications   | | user_notification_preferences |
+------------------+ +------------------+ +-------------------------------+
| id (PK, SERIAL)  | | id (PK, SERIAL)  | | id (PK, SERIAL)               |
| user_id (FK)     | | user_id (FK)     | | user_id (FK, UNIQUE)          |
| provider         | | type             | | high_cost_enabled (BOOL)      |
| service          | | severity         | | cost_increase_enabled (BOOL)  |
| region           | | title            | | low_utilization_enabled (BOOL)|
| resource_name    | | message          | | ai_recommendation_enabled     |
| current_cost     | | is_read (BOOL)   | | optimization_opportunity_en   |
| previous_cost    | | source_id        | | high_cost_threshold (NUMERIC) |
| cpu_utilization  | | source_type      | | created_at (TIMESTAMP)        |
| memory_util      | | created_at       | | updated_at (TIMESTAMP)        |
| storage_util     +------------------+ +-------------------------------+
| usage_hours      |
| request_count    |
| data_transfer_gb |
| billing_date     |
| created_at       |
+------------------+
```

### Table Descriptions
1. **`users`**: Manages authenticated user accounts, full names, unique email credentials, and bcrypt password hashes.
2. **`cloud_costs`**: Stores granular infrastructure records including provider, service, region, billing amounts, and operational utilization telemetry. Indexed on `user_id`.
3. **`notifications`**: Stores system-generated alerts with severity tags, read states, and foreign references to triggering cost records.
4. **`user_notification_preferences`**: Maintains user-defined notification toggles and custom spending thresholds.

---

## Backend & ML API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate user and return JWT | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes (JWT) |

### Cloud Cost Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/costs` | Retrieve all cost records for authenticated user | Yes (JWT) |
| `GET` | `/api/costs/:id` | Fetch specific cost record (scoped to user) | Yes (JWT) |
| `POST` | `/api/costs` | Add a new cloud cost record and trigger alert engine | Yes (JWT) |
| `DELETE` | `/api/costs/:id` | Delete cost record (scoped to user) | Yes (JWT) |

### Analytics & Recommendations Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/analytics` | Dynamic multi-period spending analytics | Yes (JWT) |
| `GET` | `/api/recommendations` | Fetch AI & heuristic optimization recommendations | Yes (JWT) |
| `PATCH` | `/api/recommendations/:id/status`| Update recommendation review status | Yes (JWT) |

### Notifications & Preferences Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | Fetch user notifications (newest first, paginated) | Yes (JWT) |
| `GET` | `/api/notifications/unread-count`| Get total unread notifications count | Yes (JWT) |
| `PATCH` | `/api/notifications/read-all`| Mark all notifications as read | Yes (JWT) |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Yes (JWT) |
| `DELETE` | `/api/notifications/:id` | Delete a single notification | Yes (JWT) |
| `GET` | `/api/notification-preferences` | Get current notification preferences | Yes (JWT) |
| `PUT` | `/api/notification-preferences` | Update notification preferences & threshold | Yes (JWT) |
| `POST` | `/api/notification-preferences/reset` | Reset preferences to system defaults | Yes (JWT) |

### Machine Learning Service Endpoints (`:8001`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root status message |
| `GET` | `/health` | Service health status check |
| `POST` | `/api/analyze` | Run batch optimization over cost records |
| `GET` | `/api/optimization-summary` | Aggregated dataset optimization metrics |
| `POST` | `/api/predict-cost` | Predict monthly cost from raw utilization metrics |
| `GET` | `/api/model-info` | Return model parameters, features, and metrics |
| `POST` | `/api/optimize` | Predict monthly cost & generate tailored recommendations |

---

## End-to-End User Workflow

```text
[1. User Sign Up / Log In]
             │
             ▼
[2. Input Cloud Cost Record] (Provider, Service, Region, Utilization %, Usage Hours)
             │
             ▼
[3. PostgreSQL Ingestion] (Stored securely under authenticated user_id)
             │
             ▼
[4. Rule & Condition Evaluation] (High cost, cost spike, low utilization checks)
             │
             ▼
[5. User Preference Check] (Verifies enabled notification types & custom threshold)
             │
             ▼
[6. Notification Generation] (Alert inserted into PostgreSQL if not duplicated in 24h)
             │
             ▼
[7. ML Service Invocation] (FastAPI model predicts cost & generates optimization advice)
             │
             ▼
[8. Real-Time Dashboard & Analytics] (Charts, trends, and summaries dynamically updated)
             │
             ▼
[9. Review Recommendations] (User evaluates right-sizing and scheduling suggestions)
             │
             ▼
[10. Export Reports] (Audit trail exported via CSV or printed to PDF)
```

---

## Machine Learning Prediction Example

The model accepts infrastructure telemetry and outputs an estimated monthly billing expectation:

### Input Payload
```json
{
  "provider": "AWS",
  "service": "EC2",
  "region": "Mumbai",
  "cpu_utilization": 35.0,
  "memory_utilization": 40.0,
  "storage_utilization": 50.0,
  "usage_hours": 720.0,
  "request_count": 100000.0,
  "data_transfer_gb": 250.0
}
```

### Model Output
```json
{
  "success": true,
  "predicted_monthly_cost": 5041.70,
  "currency": "INR",
  "model": "RandomForestRegressor",
  "message": "Monthly cloud cost predicted successfully"
}
```

> **Note:** The predicted monthly cost of approximately **₹5,041.70** in this example reflects the ML model's estimation based on the trained dataset. It is not an official AWS invoice.

---

## Local Development Setup (Windows)

### Prerequisites
- **Git**
- **Node.js** (v18+ recommended) & **npm**
- **Python** (v3.10+ recommended) & **pip**
- **PostgreSQL** (v14+ recommended)

---

### Step 1: Clone the Repository
Open PowerShell or your preferred terminal:
```powershell
git clone https://github.com/Lavallika/AI-Cloud-Cost-Optimizer.git
cd AI-Cloud-Cost-Optimizer
```

---

### Step 2: Configure PostgreSQL Database
1. Launch PostgreSQL via `psql` or pgAdmin.
2. Create a dedicated database:
   ```sql
   CREATE DATABASE cloud_cost_optimizer;
   ```

---

### Step 3: Configure Environment Variables

Create `.env` files in `backend/` and `frontend/` using safe placeholders:

#### `backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cloud_cost_optimizer
JWT_SECRET=your_jwt_secret_key_here
ML_SERVICE_URL=http://127.0.0.1:8001
```

*(Never commit actual credentials, real passwords, or production secrets to source control).*

---

### Step 4: Run the Services

The application consists of three concurrent services:

#### Service 1: Backend API (Node.js & Express)
In terminal 1:
```powershell
cd backend
npm install
npm start
```
*Backend runs on: `http://localhost:5000`*

#### Service 2: ML Service (Python & FastAPI)
In terminal 2:
```powershell
cd ml-service
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```
*ML Service runs on: `http://localhost:8001` (Interactive docs available at `http://localhost:8001/docs`)*

#### Service 3: Frontend Web App (React & Vite)
In terminal 3:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## Project Highlights

- **Full-Stack AI/ML Architecture**: Seamless communication across React, Node.js/Express, PostgreSQL, and Python/FastAPI.
- **Relational Data Integrity**: Real PostgreSQL persistence with foreign keys, constraints, and migrations.
- **Machine Learning Integration**: Trained `RandomForestRegressor` predicting multi-dimensional cloud resource costs.
- **FinOps Optimization Logic**: Hybrid intelligence pairing machine learning with deterministic rule heuristics.
- **Security & Data Isolation**: Strict user-scoped SQL queries, JWT verification, and bcrypt password hashing.
- **User Preference Customization**: Real-time configurable thresholding and alert suppression.
- **Interactive Dashboards**: Dynamic charts powered by Recharts with multi-period slicing.
- **Production-Ready Reporting**: Exportable CSV files and print-optimized PDF views.

---

## Limitations & Considerations

- **Dataset Scope**: The current ML model is trained on a curated initial dataset (116 records). Model generalizations improve as data volume grows.
- **Cost Approximations**: ML predictions and potential savings are algorithmic estimations rather than guaranteed financial forecasts.
- **Real-World Billing Complexity**: Cloud provider invoicing incorporates reserved instance commitments, savings plans, spot pricing volatility, enterprise discounts, regional taxes, and data egress brackets.

---

## Future Roadmap

- [ ] **Direct Cloud Billing Ingestion**: Integration with AWS Cost Explorer API, Azure Cost Management APIs, and GCP Cloud Billing API.
- [ ] **Automated Right-Sizing Execution**: Optional webhook-triggered AWS Lambda functions to downsize or stop idle instances.
- [ ] **External Notifications**: Push notifications via email (SendGrid/SMTP), Slack webhooks, and Microsoft Teams.
- [ ] **Scheduled Automated Reports**: Weekly and monthly automated executive summary delivery.
- [ ] **Time-Series Forecasting**: Integration of ARIMA / Prophet models for seasonal cost trends.
- [ ] **Direct CSV/Billing Ingestion**: Drag-and-drop parsing of raw AWS CUR (Cost & Usage Reports).
- [ ] **Role-Based Access Control (RBAC)**: Support for Admin, Finance Auditor, and Engineer organizational roles.

---

## Keywords

`AI Cloud Cost Optimization` • `FinOps` • `Cloud Computing` • `Machine Learning` • `Random Forest` • `Cost Prediction` • `React` • `Node.js` • `Express.js` • `PostgreSQL` • `Python` • `FastAPI` • `scikit-learn` • `JWT` • `REST API` • `Analytics Dashboard`
