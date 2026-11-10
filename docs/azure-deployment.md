# Microsoft Azure Deployment & DP-900 Implementation Guide

## 1. Overview & Cloud Readiness
LoadOpt is designed for cloud hosting on **Microsoft Azure**, aligning with **DP-900 (Azure Data Fundamentals)** concepts. The application is completely decoupled from local file paths, enabling execution in:
- **Azure App Service (Linux)** for hosting the FastAPI backend and React frontend.
- **Azure SQL Database (Serverless / Provisioned)** for managed cloud RDBMS.
- **Azure Key Vault** for runtime secret management.

---

## 2. Azure SQL Database Provisioning

### Step 1: Create Azure SQL Server and Database via Azure CLI
```bash
# 1. Create a Resource Group
az group create --name LoadOpt-RG --location eastus

# 2. Provision Azure SQL Logical Server
az sql server create \
  --name loadopt-sql-server \
  --resource-group LoadOpt-RG \
  --location eastus \
  --admin-user loadoptadmin \
  --admin-password 'YourStrongPassword123!'

# 3. Configure Server Firewall (Allow Azure Services)
az sql server firewall-rule create \
  --resource-group LoadOpt-RG \
  --server loadopt-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 4. Create the Relational Database
az sql db create \
  --resource-group LoadOpt-RG \
  --server loadopt-sql-server \
  --name loadopt-db \
  --service-objective Basic
```

### Step 2: Configure Environment Variable
In the Azure App Service Application Settings, set `DATABASE_URL`:
```ini
DATABASE_URL=mssql+pyodbc://loadoptadmin:YourStrongPassword123!@loadopt-sql-server.database.windows.net:1433/loadopt-db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no&Connection+Timeout=30
```

---

## 3. Azure App Service Deployment (Backend)

### Step 1: Deploy Python Application
```bash
# Create Linux App Service Plan
az appservice plan create \
  --name LoadOpt-AppPlan \
  --resource-group LoadOpt-RG \
  --sku B1 \
  --is-linux

# Create Web App for Python 3.11/3.12
az webapp create \
  --resource-group LoadOpt-RG \
  --plan LoadOpt-AppPlan \
  --name loadopt-api-prod \
  --runtime "PYTHON:3.11"

# Configure Application Startup Command
az webapp config set \
  --resource-group LoadOpt-RG \
  --name loadopt-api-prod \
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app"
```

---

## 4. Azure Static Web Apps Deployment (React Frontend)

### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build
```

### Step 2: Deploy to Azure Static Web Apps
```bash
az staticwebapp create \
  --name loadopt-web \
  --resource-group LoadOpt-RG \
  --source https://github.com/vaibhavgupta8890-cpu/Loadopt \
  --location eastus2 \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist"
```

---

## 5. Power BI Integration
Azure SQL Database seamlessly links with **Microsoft Power BI**:
1. Open Power BI Desktop &rarr; Click **Get Data** &rarr; Select **Azure SQL Database**.
2. Enter server: `loadopt-sql-server.database.windows.net` and database: `loadopt-db`.
3. In the Navigator, select the analytical view: `v_truck_utilization`.
4. Power BI directly visualizes vehicle load percentiles, weight trends, and route efficiency without writing custom extraction queries.
