# EduVault — Upcoming Web App Structure

This file documents the folder structure that will be added
during the FastAPI + React migration (Week 1 upgrade).

```
eduvault/
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── student.py
│   │   │   ├── admin.py
│   │   │   ├── marksheet.py
│   │   │   ├── fee_receipt.py
│   │   │   ├── exam_status.py
│   │   │   └── misc_record.py
│   │   ├── schemas/                # Pydantic request/response models
│   │   │   ├── student.py
│   │   │   ├── auth.py
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.py             # POST /login
│   │   │   ├── students.py         # CRUD /students
│   │   │   ├── marks.py
│   │   │   ├── fees.py
│   │   │   ├── exam.py
│   │   │   └── misc.py
│   │   └── core/
│   │       ├── security.py         # JWT + bcrypt helpers
│   │       └── config.py           # Settings from .env
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # pytest test files
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                       # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/
│   │   │   ├── StudentTable.jsx
│   │   │   ├── MarksheetCard.jsx
│   │   │   ├── FeeReceiptCard.jsx
│   │   │   └── AnalyticsCharts.jsx
│   │   ├── api/                    # Axios API calls
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Orchestrate backend + frontend + MySQL
├── desktop_app/                    # Current Tkinter version (preserved)
├── database/
└── README.md
```
