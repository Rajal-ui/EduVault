# EduVault

> A full-stack college student record management system with role-based access for Admins and Students.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)
![Status](https://img.shields.io/badge/Status-Active%20Development-green)

---

## Overview

EduVault is a student office management system built to replace manual record-keeping for a college department. It manages student profiles, marksheets, fee receipts, exam results, and disciplinary records — all secured behind role-based authentication.

**Current version:** Desktop application (Python + Tkinter + MySQL)  
**In progress:** Migrating to a full-stack web application (FastAPI + React + Docker)

---

## Features

- **Role-based login** — Separate Admin and Student dashboards
- **Student management** — Full CRUD for profiles, marks, fees, exam results
- **Fee tracking** — Receipt management with payment status (Paid / Pending / Overdue)
- **Exam records** — GPA, semester results, distinction/ATKT tracking
- **Miscellaneous records** — Warnings, leave approvals, attendance notes
- **Secure auth** — bcrypt password hashing, credentials via environment variables

---

## Tech Stack

### Current (Desktop App)
| Layer | Technology |
|---|---|
| GUI | Python Tkinter |
| Database | MySQL |
| DB Driver | mysql-connector-python |
| Auth | bcrypt |
| Config | python-dotenv |

### Upcoming (Web App — Week 1)
| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TailwindCSS |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy + Alembic |
| Auth | JWT + bcrypt |
| Deployment | Docker + Render |

---

## Project Structure

```
eduvault/
├── desktop_app/
│   ├── main.py              # Secure entry point (bcrypt + .env)
│   └── main_original.py     # Original version (reference only)
├── database/
│   ├── setup.sql            # Full database schema + sample data
│   └── migrate_passwords.py # One-time script to hash existing passwords
├── .env.example             # Environment variable template
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Setup & Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/eduvault.git
cd eduvault
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
# Open .env and fill in your MySQL credentials
```

### 5. Set up the database
```bash
# In MySQL Workbench or terminal:
mysql -u root -p < database/setup.sql
```

### 6. Migrate existing passwords to bcrypt (if needed)
```bash
python database/migrate_passwords.py
```

### 7. Run the app
```bash
python desktop_app/main.py
```

---

## Demo Credentials

| Role | ID | Password |
|---|---|---|
| Admin | ADM001 | adminpass |
| Student | STU001 | studpass |
| Student | STU002 | studpass2 |

---

## Database Schema

```
Admins
Students ──< Marksheets
         ──< FeeReceipts
         ──< ExamStatus
         ──< MiscellaneousRecords
```

6 tables, all with foreign key constraints and cascade deletes.

---

## Roadmap

- [x] Desktop GUI with Tkinter
- [x] Role-based login (Admin / Student)
- [x] Full CRUD — students, marks, fees, exam records
- [x] bcrypt password hashing
- [x] Environment variable configuration
- [ ] FastAPI REST backend with JWT auth
- [ ] SQLAlchemy ORM + Alembic migrations
- [ ] React + TailwindCSS frontend
- [ ] Admin analytics dashboard (Recharts)
- [ ] PDF export for marksheets and fee receipts
- [ ] Docker containerisation
- [ ] Deployment to Render

---

## Author

Built by [Your Name] — [your-email@example.com]  
GitHub: [@your-username](https://github.com/your-username)

---

## License

MIT
