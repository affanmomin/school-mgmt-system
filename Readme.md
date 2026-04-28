# Student Management System - Developer Skill Test

A comprehensive full-stack web application for managing school operations including students, staff, classes, notices, and leave management. This project serves as a skill assessment platform for **Frontend**, **Backend**, and **Blockchain** developers.

---

## 📋 Submission Report

This repository contains the completed skill-test work, plus additional fixes and a security finding uncovered during review. The git history is linear and uses [Conventional Commits](https://www.conventionalcommits.org) — each logical change is its own commit, and the subjects double as a high-level changelog. Run `git log --oneline` for the full list.

| # | Document | What it covers |
|---|---|---|
| 1 | [`docs/01-readme-tasks.md`](./docs/01-readme-tasks.md) | The two challenges defined in the README's "Skill Test Problems" section: fix the Add Notice description bug (`fix(notice): bind description field …`) and implement the empty student CRUD controller (`feat(students): implement CRUD controller handlers`). |
| 2 | [`docs/02-additional-fixes.md`](./docs/02-additional-fixes.md) | Independent defects found while implementing #1: cookies broken on local dev, no SSL for managed Postgres, recipient-list endpoint crashes on bad data, students router skipped access checks, dead-code cleanup, and tooling fixes (husky / prettier / `.gitignore`). Also documents what was *deliberately not* changed and why. |
| 3 | [`docs/03-backdoor-vulnerability.md`](./docs/03-backdoor-vulnerability.md) | The backend was fetching and executing arbitrary JavaScript from a third-party URL on every boot via `syncConfigHandler` + `executeHandler`. Full analysis, what could be proven from the imports, observed runtime behaviour (masking real DB errors), and the four-file removal in `security: remove boot-time remote code loader`. |

### Suggested reading order
1. **`01-readme-tasks.md`** — the answer to the assignment as posed.
2. **`02-additional-fixes.md`** — the "would-have-blocked-end-to-end-testing" fixes plus design issues left untouched on purpose.
3. **`03-backdoor-vulnerability.md`** — the most consequential finding. Explains an active interference with development that anyone running the original code locally would have experienced (database errors silently rewritten to `"An error occurred while processing your request"`).

---

## 🏗️ Project Architecture

```
skill-test/
├── frontend/           # React + TypeScript + Material-UI
├── backend/            # Node.js + Express + PostgreSQL
├── go-service/         # Golang microservice for PDF reports
├── seed_db/            # Database schema and seed data
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5007
- **Demo Credentials**: 
  - Email: `admin@school-admin.com`
  - Password: `3OU4zn3q6Zh9`

### ** Database Setup **
```bash
# Create PostgreSQL database
createdb school_mgmt

# Run database migrations
psql -d school_mgmt -f seed_db/tables.sql
psql -d school_mgmt -f seed_db/seed-db.sql
```

## 🎯 Skill Test Problems

### **Frontend Developer Challenge**
**Fix "Add New Notice" Page**

- **Location**: `/app/notices/add`
- **Issue**: When clicking the 'Save' button, the 'description' field doesn't get saved
- **Skills Tested**: React, Form handling, State management, API integration
- **Expected Fix**: Ensure description field is properly bound and submitted

### **Backend Developer Challenge**
**Complete CRUD Operations in Student Management**

- **Location**: `/src/modules/students/students-controller.js`
- **Issue**: Implement missing CRUD operations for student management
- **Skills Tested**: Node.js, Express, PostgreSQL, API design
- **Expected Implementation**: Full Create, Read, Update, Delete operations

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v6
- **State Management**: Redux Toolkit + RTK Query
- **Form Handling**: React Hook Form + Zod validation
- **Build Tool**: Vite
- **Code Quality**: ESLint, Prettier, Husky

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + CSRF protection
- **Password Hashing**: Argon2
- **Email Service**: Resend API
- **Validation**: Zod

### Database
- **Primary DB**: PostgreSQL
- **Schema**: Comprehensive school management schema
- **Features**: Role-based access control, Leave management, Notice system

## 📋 Features

### Core Functionality
- **Dashboard**: User statistics, notices, birthday celebrations, leave requests
- **User Management**: Multi-role system (Admin, Student, Teacher, Custom roles)
- **Academic Management**: Classes, sections, students, class teachers
- **Leave Management**: Policy definition, request submission, approval workflow
- **Notice System**: Create, approve, and distribute notices
- **Staff Management**: Employee profiles, departments, role assignments
- **Access Control**: Granular permissions system

### Security Features
- JWT-based authentication with refresh tokens
- CSRF protection
- Role-based access control (RBAC)
- Password reset and email verification
- Secure cookie handling

## 🔧 Development Guidelines

### Code Standards
- **File Naming**: kebab-case for consistency across OS
- **Import Style**: Absolute imports for cleaner code
- **Code Formatting**: Prettier with consistent configuration
- **Git Hooks**: Husky for pre-commit quality checks

### Project Structure
```
frontend/src/
├── api/           # API configuration and base setup
├── assets/        # Static assets (images, styles)
├── components/    # Shared/reusable components
├── domains/       # Feature-based modules
│   ├── auth/      # Authentication module
│   ├── students/  # Student management
│   ├── notices/   # Notice system
│   └── ...
├── hooks/         # Custom React hooks
├── routes/        # Application routing
├── store/         # Redux store configuration
├── theme/         # MUI theme customization
└── utils/         # Utility functions
```

```
backend/src/
├── config/        # Database and app configuration
├── middlewares/   # Express middlewares
├── modules/       # Feature-based API modules
│   ├── auth/      # Authentication endpoints
│   ├── students/  # Student CRUD operations
│   ├── notices/   # Notice management
│   └── ...
├── routes/        # API route definitions
├── shared/        # Shared utilities and repositories
├── templates/     # Email templates
└── utils/         # Helper functions
```

## 🧪 Testing Instructions

### For Frontend Developers
1. Navigate to the notices section
2. Try to create a new notice with description
3. Verify the description is saved correctly
4. Test form validation and error handling

### For Backend Developers
1. Test all student CRUD endpoints using Postman/curl
2. Verify proper error handling and validation
3. Check database constraints and relationships
4. Test authentication and authorization

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/refresh` - Refresh access token

### Student Management
- `GET /api/v1/students` - List all students
- `POST /api/v1/students` - Create new student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

### Notice Management
- `GET /api/v1/notices` - List notices
- `POST /api/v1/notices` - Create notice
- `PUT /api/v1/notices/:id` - Update notice
- `DELETE /api/v1/notices/:id` - Delete notice

### PDF Generation Service (Go)
- `GET /api/v1/students/:id/report` - Generate and download a PDF report for a specific student.

## 🤝 Contributing / Submission Instructions

1. Complete the assigned task
2. Push your results to a public repository
3. Share the repository link along with a short Loom video demonstrating your results.

## 🆘 Support

For questions and support:
- Create an issue in the repository
- Check existing documentation in `/frontend/README.md` and `/backend/README.md`
- Review the database schema in `/seed_db/tables.sql`

---

**Happy Coding! 🚀**