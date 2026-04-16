# 🛡️ EduVault

**EduVault** is a next-generation, AI-powered Student Management & Analytics platform. It transforms traditional paper-based college workflows into a secure, intelligent, and role-based digital ecosystem. By leveraging **Google Gemini 2.5 Flash**, EduVault goes beyond simple record-keeping to provide predictive analytics, automated data extraction, and natural language interfaces.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=flat-square&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern_Backend-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![AI-Powered](https://img.shields.io/badge/AI--Powered-Gemini_2.5_Flash-orange?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

---

## 🚀 Key AI Features (Powered by Gemini 2.5 Flash)

EduVault integrates state-of-the-art vision and language models to automate administrative overhead.

*   **🔍 AI Smart Search (NLQ)**: Command your database in plain English. No more complex filters—just type *"Find all Year 3 IT students with overdue fees"* and get instant results.
*   **📄 Intelligent OCR & Parsing**:
    *   **Marksheet Extraction**: Upload a result image, and EduVault automatically parses subjects, marks, grades, and GPA into structured academic records.
    *   **Fee Receipt Scanner**: Instantly extracts Receipt IDs, payment amounts, and dates from photos or scans.
*   **💡 AI Academic Counselor**: Automatically generates professional, actionable student insight reports in Markdown, analyzing GPA trends, behavioral records, and payment patterns to suggest strategic improvements.
*   **⚠️ Predictive Risk Engine**: Automatically identifies "At-Risk" students based on a fuzzy-logic assessment of academic performance, attendance warnings, and financial status.

---

## 🏗️ Core Systems

### 👨‍🎓 Student & Faculty Management
*   **Comprehensive SIMS**: Full lifecycle management for student profiles, department allocation, and year-level tracking.
*   **Staff & Faculty Portal**: Dedicated management for Faculty and HOD (Head of Department) roles with specific departmental privileges.
*   **Miscellaneous Record Center**: Track behavioral warnings, achievements, and extra-curricular activities.

### 📊 Academic & Exam Records
*   **Semester-wise Tracking**: Subject-specific marks management and automated GPA calculation.
*   **Result Status**: Immediate visibility into Pass/Fail/ATKT status across multiple semesters.

### 💰 Financial & Fee Management
*   **Receipt Digitalization**: Secure ledger for all fee transactions with AI-powered scanning.
*   **Status Tracking**: Real-time monitoring of `Paid`, `Pending`, and `Overdue` accounts.

### 🛡️ Admin & Security Operations
*   **High-Fidelity Audit Logging**: Every administrative action is logged with IP addresses, timestamps, and detailed JSON diffs of data changes for maximum accountability.
*   **RBAC (Role-Based Access Control)**: Granular permissions for Admins, Faculty, HODs, and Students.
*   **Visual Analytics**: Interactive charts for departmental distribution and performance trends.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy with MySQL
- **Migrations**: Alembic
- **Security**: JWT Authentication + Bcrypt Hashing
- **AI Integration**: Google Generative AI SDK (Gemini 2.5 Flash)

### **Frontend**
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS (Premium Micro-interactions)
- **State Management**: Context API / Axios Hooks

---

## 📦 Getting Started

### 🖥️ Prerequisites
- Python 3.10+
- Node.js & npm (for Web Frontend)
- MySQL Server 8.0+
- Gemini API Key ([Get it here](https://aistudio.google.com/))

### 🛠️ Development Setup

**1. Clone & Environment**
```bash
git clone https://github.com/Rajal-ui/eduvault.git
cd eduvault
copy .env.example .env
# Update .env with your GEMINI_API_KEY and Database credentials
```

**2. Backend Setup**
```bash
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r backend/requirements.txt
# Run the server
uvicorn backend.app.main:app --reload
```

**3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

**4. Docker (Recommended)**
Spin up the entire stack including the database with one command:
```bash
docker-compose up --build
```

## 👨‍💻 Contributing
We welcome contributions! Please open an issue or submit a pull request on the `develop` branch. 

**Owner**: [Rajal Mistry](https://github.com/Rajal-ui)
**Contact**: rajalmistry544@gmail.com

---

## ⚖️ License
This project is licensed under the **MIT License**.

