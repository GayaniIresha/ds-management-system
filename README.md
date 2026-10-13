# Divisional Secretariat Management System (DSMS)

## 1. Project title and overview

The Divisional Secretariat Management System (DSMS) is a role-based web application designed to manage citizen service requests, officer review tasks, administrator decisions, and certificate issuance. The project is built as a full-stack application using a React frontend, an Express backend, and a MySQL database.

This repository includes the main implementation for:
- citizen registration and login
- application submission and tracking
- officer review and recommendation workflows
- administrator approval and rejection processing
- notifications and certificate issuance
- public record verification

## 2. Project objectives and problem statement

### Objectives
The application aims to:
- digitize citizen service applications in a divisional secretariat environment
- improve transparency in application status handling
- provide a structured workflow for citizens, officers, and administrators
- keep application records and decisions centralized in one system
- support issued certificate generation and verification

### Problem statement
Manual processing of public service requests often creates delays, limited traceability, and inconsistent status tracking. DSMS addresses these issues by providing a centralized digital workflow for service requests and administrative processing.

## 3. Implemented features

The following features are present in the current codebase and can be verified from the source files:

- citizen registration and login
- JWT-based authentication for protected endpoints
- role-based access control for citizen, officer, and admin users
- citizen dashboard with application statistics
- service listing and new application submission
- tracking of submitted applications and application detail views
- officer dashboard and application review queue
- officer recommendation and review note workflow
- administrator assignment of applications to officers
- final approval or rejection by administrators
- application notifications and unread notification tracking
- certificate issuance for approved applications
- PDF generation for application records and certificates
- public certificate verification route and verification page
- database health check endpoint

### Distinction from planned SRS requirements
This workspace does not include a checked-in SRS v1.0 document. The implementation listed above is based on the actual code and database migration files present in the repository. Any broader requirements not reflected in the source code are treated as planned or future work rather than implemented functionality.

## 4. User roles

### Citizen
Citizens can:
- register an account
- log in to the DSMS portal
- view available services
- submit applications
- view their own application details and status
- download application record PDFs for approved applications
- view issued certificates assigned to their approved applications

### Officer
Officers can:
- log in to the officer portal
- review applications assigned to them or available for review
- inspect application data and review notes
- submit recommendations for approval or rejection
- maintain review status for each application

### Administrator
Administrators can:
- view all applications
- assign applications to officers
- verify officer recommendations
- approve or reject applications
- issue certificates for approved applications
- review certificate records and downloadable PDFs

## 5. Actual technologies used

### Frontend
- React 19
- Vite 8
- React Router DOM
- Lucide React icons
- CSS styling
- Fetch API for HTTP communication

### Backend
- Node.js
- Express 5
- MySQL2
- JWT
- bcrypt
- dotenv
- CORS
- PDFKit

### Database
- MySQL / MariaDB-compatible database accessed through `mysql2/promise`

## 6. System architecture

The project uses a layered web application architecture:

1. Frontend layer
   - `client/src` contains the React application and role-based pages
   - route definitions are in `client/src/routes/AppRoutes.jsx`
   - session data is stored in browser local storage

2. Backend layer
   - `server/server.js` hosts the Express API
   - `server/routes/` contains route modules for authentication and certificates
   - `server/middleware/` contains JWT and admin authorization checks

3. Data layer
   - `server/config/db.js` configures the MySQL pool
   - runtime queries interact with tables such as `users`, `roles`, `services`, `applications`, `notifications`, and `issued_certificates`

4. Document layer
   - PDF generation for application records and certificates is handled using `pdfkit`

## 7. Application workflow

The implemented workflow is:

1. Citizen registers and logs in.
2. Citizen selects a service and submits an application.
3. The backend stores the application and creates notifications.
4. Administrator assigns the application to an officer.
5. Officer reviews the application and submits a recommendation.
6. Administrator makes the final approval or rejection decision.
7. If approved, the administrator issues a certificate.
8. The certificate is saved to the database and can be downloaded as a PDF.
9. The public verification page checks whether the certificate number exists in the DSMS records.

## 8. Project folder structure

```text
DSMS/
├── README.md
├── project-file-list.csv
├── client/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── routes/
│       └── services/
├── server/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── createAdmin.js
│   ├── createOfficer.js
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   └── node_modules/
├── database/
│   └── migrations/
│       ├── 001_create_issued_certificates.sql
│       └── 002_create_notifications.sql
├── docs/
├── .gitignore
└── .env.example (if created separately outside the reviewed files)
```

Notes:
- `node_modules` is generated from dependency installation and is not the primary application source.
- Any additional project docs or config files beyond the reviewed files are not assumed unless they exist in the workspace.

## 9. Database structure based on actual schema files

The checked-in migration files explicitly define the following tables.

### `issued_certificates`
File: `database/migrations/001_create_issued_certificates.sql`

```sql
CREATE TABLE issued_certificates (
    certificate_id INT NOT NULL AUTO_INCREMENT,
    application_id INT NOT NULL,
    certificate_number VARCHAR(45) NOT NULL,
    issued_by INT NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_note VARCHAR(500) NOT NULL,
    PRIMARY KEY (certificate_id),
    UNIQUE KEY uq_issued_certificates_application (application_id),
    UNIQUE KEY uq_issued_certificates_number (certificate_number),
    KEY ix_issued_certificates_issuer (issued_by),
    CONSTRAINT fk_issued_certificates_application
        FOREIGN KEY (application_id) REFERENCES applications (application_id),
    CONSTRAINT fk_issued_certificates_issuer
        FOREIGN KEY (issued_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### `notifications`
File: `database/migrations/002_create_notifications.sql`

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    application_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'application_update',
    event_key VARCHAR(190) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    KEY ix_notifications_user_read_created (user_id, is_read, created_at),
    KEY ix_notifications_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Additional tables referenced by runtime code
The runtime application also references these tables:
- `users`
- `roles`
- `services`
- `applications`
- `audit_logs`

The exact full DDL for those tables is not included in the repository files reviewed here.

## 10. Installation and setup instructions

### Prerequisites
- Node.js 18+
- MySQL server running locally or on a reachable host
- a database created for the project, such as `dsms_db`

### 1. Clone the repository

```bash
git clone <repository-url>
cd ds-management-system
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Create the database and apply migration scripts

```sql
CREATE DATABASE dsms_db;
```

Then apply migration scripts:

```bash
mysql -u <user> -p dsms_db < database/migrations/001_create_issued_certificates.sql
mysql -u <user> -p dsms_db < database/migrations/002_create_notifications.sql
```

## 11. Environment variable setup using placeholders

Placeholders for the backend environment file (`server/.env`) should look like this:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=dsms_db
JWT_SECRET=replace_with_a_long_random_secret
```

Do not commit real credentials or production secrets.

## 12. Commands to run the frontend and backend based on package.json

### Backend commands
From `server/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Run backend:

```bash
cd server
npm run dev
```

Or:

```bash
cd server
npm start
```

### Frontend commands
From `client/package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Run frontend:

```bash
cd client
npm run dev
```

Build frontend:

```bash
cd client
npm run build
```

## 13. API endpoints verified from the actual source code

The following endpoints are implemented in the backend and were verified by source inspection.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Root API status |
| GET | `/api/health/db` | Public | Database connectivity check |
| POST | `/api/auth/register` | Public | Register a citizen |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auth/me` | Authenticated | Get current user info |
| GET | `/api/notifications` | Authenticated | View notifications |
| GET | `/api/notifications/unread-count` | Authenticated | Get unread count |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark one notification as read |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
| GET | `/api/citizen/dashboard` | Citizen | Dashboard summary |
| GET | `/api/citizen/services` | Citizen | List active services |
| POST | `/api/citizen/applications` | Citizen | Submit application |
| GET | `/api/citizen/applications` | Citizen | List applications |
| GET | `/api/citizen/applications/:id` | Citizen | View application details |
| GET | `/api/citizen/applications/:id/certificate.pdf` | Citizen | Download application record PDF |
| GET | `/api/citizen/certificates` | Citizen | List approved certificates |
| GET | `/api/citizen/certificates/:id/pdf` | Citizen | Download issued certificate PDF |
| GET | `/api/officer/applications` | Officer | View application queue |
| GET | `/api/officer/applications/:id` | Officer | View one application |
| PATCH | `/api/officer/applications/:id/status` | Officer | Submit recommendation or review status |
| GET | `/api/admin/applications` | Admin | View all applications |
| GET | `/api/admin/officers` | Admin | View active officers |
| PATCH | `/api/admin/applications/:id/assign` | Admin | Assign officer |
| PATCH | `/api/admin/applications/:id/status` | Admin | Final approve/reject |
| GET | `/api/admin/certificates` | Admin | List certificates |
| POST | `/api/admin/applications/:id/certificate` | Admin | Issue certificate |
| GET | `/api/admin/certificates/:id` | Admin | Get certificate details |
| GET | `/api/admin/certificates/:id/pdf` | Admin | Download certificate PDF |
| GET | `/api/certificates/verify/:certificateNumber` | Public | Verify a certificate record |

## 14. Security and privacy considerations

The current implementation includes several notable security considerations:

- bcrypt password hashing
- JWT-based authentication for protected routes
- role-based authorization checks for citizen, officer, and admin access
- transaction-based certificate issuance logic
- restricted access to citizen data and downloadable PDFs
- public verification page that exposes minimal certificate metadata only

Operational guidance:
- never commit real database credentials or secrets
- use environment variables and keep `.env` out of source control
- validate access controls before deployment in a live environment
- treat this as a prototype until further hardening is completed

## 15. Future enhancements

Potential enhancements include:
- document upload and validation for applications
- more advanced reporting and analytics dashboards
- configurable role permissions and policy management
- rate limiting and API protection
- email/SMS notifications through external providers
- larger-scale filtering, sorting, and pagination for application data
- additional features from a broader SRS not yet present in the codebase

## 16. Project limitations and disclaimer

This project is a working prototype and should not be considered a production-grade public administration system without additional review, testing, and hardening.

Current limitations visible in the repository include:
- local MySQL configuration is required
- the frontend targets `http://localhost:5000` for backend calls
- only a subset of the database schema is present in the checked-in migration files
- no formal automated test suite was identified in the reviewed files
- no SRS v1.0 document was present in the working project folder

This README documents only the functionality that is implemented and verifiable from the repository contents. Any broader business or legal requirements should be confirmed against the official SRS artifact if it exists outside this project workspace.

## Summary

DSMS is a role-based digital system for citizen service applications, officer review, administrator decisions, and certificate issuance. The current implementation supports the main workflow from application submission to final decision and public verification, but it remains a prototype and requires additional validation before production use.
