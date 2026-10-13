# Divisional Secretariat Management System (DSMS)

## 1. Project Overview

The **Divisional Secretariat Management System (DSMS)** is a full-stack web application prototype designed to digitize and manage citizen service applications, officer reviews, administrative decisions, and certificate issuance.

The system provides separate workflows for citizens, officers, and administrators. It aims to improve application tracking, centralize service records, and make administrative processing more organized and transparent.

The application uses React for the frontend, Node.js and Express for the backend, and MySQL for database operations.

> **Project Status:** Working prototype for educational, development, and portfolio purposes. It is not an official government system.

## 2. Project Objectives

The main objectives of DSMS are to:

- Digitize citizen service application workflows.
- Provide a centralized application management system.
- Allow citizens to submit and track applications.
- Enable officers to review assigned applications and submit recommendations.
- Allow administrators to make final application decisions.
- Support certificate issuance and public certificate verification.
- Provide notifications about relevant application activities.
- Improve the traceability and organization of administrative processes.

## 3. Implemented Features

The following features are represented in the current codebase and should be verified against the running application before deployment.

### Authentication and Access Control

- Citizen registration and login.
- JWT-based authentication for protected API endpoints.
- Password hashing using bcrypt.
- Role-based access control for citizens, officers, and administrators.
- Protected API routes using authentication and authorization middleware.

### Citizen Features

- Citizen dashboard with application statistics.
- View available services.
- Submit service applications.
- View submitted applications and application details.
- Track application status.
- Access approved application records.
- View issued certificates associated with approved applications.
- Download supported application and certificate PDFs.

### Officer Features

- Officer dashboard.
- View application queues.
- Access application details.
- Review applications.
- Submit recommendations and review statuses.
- Record review notes where supported by the implementation.

### Administrator Features

- View applications.
- Assign applications to officers.
- Review officer recommendations.
- Approve or reject applications.
- Issue certificates for approved applications.
- View certificate records.
- Download supported certificate PDFs.

### Notifications and Verification

- View notifications.
- Retrieve unread notification counts.
- Mark individual notifications as read.
- Mark all notifications as read.
- Generate and store certificate records.
- Verify certificate records through a public verification endpoint.

### Supporting Features

- Database connectivity health-check endpoint.
- PDF generation for supported records.
- Database transaction handling in certificate issuance logic, where implemented.

**Implementation note:** The feature list describes capabilities represented in the reviewed source files. Confirm each workflow against the actual running application. Do not assume that every feature is fully tested or production-ready.

## 4. User Roles

### Citizen

A citizen can use the system to:

- Register and log in.
- Browse available services.
- Submit applications.
- View personal application records and statuses.
- Access supported application documents.
- View and download issued certificates associated with approved applications.

### Officer

An officer can use the system to:

- Log in to the officer interface.
- View applications available or assigned for review, according to the implemented access rules.
- Inspect application information.
- Submit review recommendations and supported status updates.

### Administrator

An administrator can use the system to:

- View application records.
- Assign applications to officers.
- Review officer recommendations.
- Approve or reject applications.
- Issue certificates for eligible applications.
- View certificate information and supported PDF documents.

## 5. Technology Stack

The following technologies are referenced by the project source and package configuration.

### Frontend

- React
- Vite
- React Router DOM
- Lucide React
- CSS
- Fetch API

### Backend

- Node.js
- Express.js
- MySQL2
- JSON Web Token (JWT)
- bcrypt
- dotenv
- CORS
- PDFKit

### Database

- MySQL or a compatible database configuration.
- SQL migration files for certificate and notification tables.

### Development Tools

- Visual Studio Code
- Git
- GitHub
- npm

Refer to `client/package.json` and `server/package.json` for the exact dependency versions installed in the project.

## 6. System Architecture

DSMS follows a frontend–backend–database architecture.

### Frontend Layer

The React application provides the user interface for the different roles.

Main location:

`client/src/`

Responsibilities include:

- Rendering application pages and components.
- Managing client-side routes.
- Handling user interactions.
- Communicating with backend API endpoints.
- Displaying application information and notifications.

### Backend Layer

The Express application exposes REST API endpoints.

Main location:

`server/`

Responsibilities include:

- Authentication and authorization.
- Processing application requests.
- Enforcing role-based access restrictions.
- Interacting with the database.
- Managing application reviews and decisions.
- Supporting notifications and certificate operations.
- Generating supported PDF documents.

### Database Layer

The backend connects to a MySQL database through the database configuration in:

`server/config/db.js`

The runtime code references tables such as users, roles, services, applications, notifications, issued certificates, and audit logs. The complete schema for every table is not included in the migration files currently checked into this repository.

### Document Layer

PDFKit is used for supported PDF-generation operations, including application records and certificate documents where implemented.

## 7. Application Workflow

The intended main workflow is:

1. A citizen registers and logs in.
2. The citizen selects a service.
3. The citizen submits an application.
4. The backend processes and stores the application.
5. An administrator assigns the application to an officer.
6. The officer reviews the application and submits a recommendation.
7. The administrator makes the final approval or rejection decision.
8. For an approved application, an eligible administrator can issue a certificate.
9. The certificate record is stored in the database.
10. The citizen can access supported certificate documents.
11. The public verification endpoint can check a certificate number against the records available in the system.

The exact workflow and permitted status transitions depend on the implemented backend rules.

## 8. Project Structure

The main repository structure is:

```text
ds-management-system/
├── README.md
├── .gitignore
├── project-file-list.csv
├── client/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       │   ├── admin/
│       │   ├── citizen/
│       │   └── officer/
│       ├── routes/
│       └── services/
├── server/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── createAdmin.js
│   ├── createOfficer.js
│   ├── config/
│   ├── middleware/
│   └── routes/
└── database/
    └── migrations/
        ├── 001_create_issued_certificates.sql
        └── 002_create_notifications.sql
```

This is a representative structure of the main application files. Additional files may exist in the working directory.

**Important:** Local `.env` files, real credentials, and installed `node_modules` directories should not be committed to the repository.

## 9. Database Migrations

The repository contains the following SQL migration files.

### 9.1 Issued Certificates

File:

`database/migrations/001_create_issued_certificates.sql`

This migration creates the `issued_certificates` table, which stores information associated with issued certificates.

The schema includes fields for:

- Certificate ID.
- Related application ID.
- Certificate number.
- Issuing user ID.
- Issue timestamp.
- Verification note.

The migration defines a primary key, unique constraints for the application and certificate number, an index for the issuing user, and foreign-key references to the applications and users tables.

### 9.2 Notifications

File:

`database/migrations/002_create_notifications.sql`

This migration creates the `notifications` table.

The schema includes fields for:

- Notification ID.
- Recipient user ID.
- Optional related application ID.
- Notification title and message.
- Notification type.
- Optional event key.
- Read status.
- Creation timestamp.

The migration also defines indexes to support user notification and application-related queries.

### Database Prerequisite

The migrations reference existing application tables, including `applications` and `users`.

Therefore, these two migration files alone do not create a complete, standalone DSMS database. The remaining required tables and their relationships must be created using the appropriate schema or setup scripts for the project.

## 10. Prerequisites

Before running the application, install and configure:

- Node.js and npm.
- MySQL or a compatible database server.
- Git.
- A code editor such as Visual Studio Code.

The project should be run with dependency versions compatible with the package files. Check the current Node.js and package requirements before selecting a runtime version.

## 11. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/GayaniIresha/ds-management-system.git
cd ds-management-system
```

### Step 2: Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 3: Install Backend Dependencies

From the project root:

```bash
cd server
npm install
```

### Step 4: Configure the Database

Start your MySQL server and create the database used by your local environment.

Example:

```sql
CREATE DATABASE dsms_db;
```

Use the database name configured in your backend environment.

Before running the migrations, ensure that the required referenced tables already exist.

From the project root, apply the certificate migration if its prerequisites are satisfied:

```bash
mysql -u YOUR_MYSQL_USER -p dsms_db < database/migrations/001_create_issued_certificates.sql
```

Apply the notification migration:

```bash
mysql -u YOUR_MYSQL_USER -p dsms_db < database/migrations/002_create_notifications.sql
```

Replace `YOUR_MYSQL_USER` with your local MySQL username. The `-p` option prompts for the password.

The commands above are examples for environments where the MySQL command-line client is installed and accessible.

### Step 5: Configure Backend Environment Variables

Create a local environment file at:

`server/.env`

Example placeholder configuration:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=dsms_db
JWT_SECRET=replace_with_a_long_random_secret
```

Use the exact environment variable names expected by the backend source code. These placeholders are examples and must be checked against `server/config/db.js` and `server/server.js`.

Generate a strong, unique JWT secret for local development.

**Never commit real passwords, API keys, tokens, or other secrets.**

### Step 6: Start the Backend

Open a terminal in the `server` directory:

```bash
npm run dev
```

Alternatively, use:

```bash
npm start
```

The development command requires the relevant development dependency to be installed.

### Step 7: Start the Frontend

Open a second terminal in the `client` directory:

```bash
npm run dev
```

Vite will display the local frontend URL in the terminal.

Open the URL displayed by Vite in your browser.

### Step 8: Verify the Connection

Check the backend URL and API configuration used by the frontend.

If the backend provides the database health-check endpoint, it can be tested at:

`http://localhost:5000/api/health/db`

This URL is an example for a backend configured to use port `5000`. Adjust it if the application uses a different port.

A successful database health check depends on a running database and valid environment configuration.

## 12. Available Scripts

### Frontend Scripts

Run these commands from `client/`.

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview a production build:

```bash
npm run preview
```

These commands correspond to the scripts represented in the frontend package configuration.

### Backend Scripts

Run these commands from `server/`.

Start the development server:

```bash
npm run dev
```

Start the application:

```bash
npm start
```

The backend scripts are defined in `server/package.json`.

## 13. API Endpoints

The following endpoints are represented in the reviewed backend implementation. Verify request bodies, response formats, status codes, and access rules in the route handlers before integrating other applications.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Root API status |
| GET | `/api/health/db` | Public | Check database connectivity |
| POST | `/api/auth/register` | Public | Register a citizen |
| POST | `/api/auth/login` | Public | Authenticate a user |
| GET | `/api/auth/me` | Authenticated | Retrieve current user information |
| GET | `/api/notifications` | Authenticated | Retrieve notifications |
| GET | `/api/notifications/unread-count` | Authenticated | Retrieve unread notification count |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark a notification as read |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
| GET | `/api/citizen/dashboard` | Citizen | Retrieve citizen dashboard information |
| GET | `/api/citizen/services` | Citizen | Retrieve available services |
| POST | `/api/citizen/applications` | Citizen | Submit an application |
| GET | `/api/citizen/applications` | Citizen | Retrieve citizen applications |
| GET | `/api/citizen/applications/:id` | Citizen | Retrieve application details |
| GET | `/api/citizen/applications/:id/certificate.pdf` | Citizen | Download a supported application PDF |
| GET | `/api/citizen/certificates` | Citizen | Retrieve issued certificates |
| GET | `/api/citizen/certificates/:id/pdf` | Citizen | Download an issued certificate PDF |
| GET | `/api/officer/applications` | Officer | Retrieve the officer application queue |
| GET | `/api/officer/applications/:id` | Officer | Retrieve application details |
| PATCH | `/api/officer/applications/:id/status` | Officer | Submit a review recommendation or status update |
| GET | `/api/admin/applications` | Administrator | Retrieve applications |
| GET | `/api/admin/officers` | Administrator | Retrieve active officers |
| PATCH | `/api/admin/applications/:id/assign` | Administrator | Assign an application to an officer |
| PATCH | `/api/admin/applications/:id/status` | Administrator | Process an application decision |
| GET | `/api/admin/certificates` | Administrator | Retrieve certificate records |
| POST | `/api/admin/applications/:id/certificate` | Administrator | Issue a certificate |
| GET | `/api/admin/certificates/:id` | Administrator | Retrieve certificate details |
| GET | `/api/admin/certificates/:id/pdf` | Administrator | Download a certificate PDF |
| GET | `/api/certificates/verify/:certificateNumber` | Public | Verify a certificate record |

These paths describe the routes represented in the reviewed source. Some endpoints may require specific request payloads or additional permissions. Consult the backend implementation for exact behavior.

## 14. Security and Privacy

The codebase includes security-related mechanisms such as:

- Password hashing using bcrypt.
- JWT-based authentication.
- Authentication middleware for protected endpoints.
- Role-based authorization checks.
- Restricted access to application and certificate data.
- Transaction handling in certificate issuance logic, where implemented.

Additional precautions are required before any real-world deployment:

- Keep environment variables and credentials out of version control.
- Validate and sanitize user input.
- Review authentication, authorization, and ownership checks.
- Use HTTPS in deployed environments.
- Apply appropriate rate limiting and request-size limits.
- Configure secure token handling and secret rotation.
- Review file and PDF access permissions.
- Add automated tests and security checks.
- Review error handling and logging to avoid exposing sensitive information.
- Back up the database and establish appropriate retention controls.

Do not use real citizen information or sensitive production data in this prototype.

## 15. Current Limitations

The following limitations should be considered:

- The project is a prototype and has not been established as production-ready.
- A complete database schema for all runtime tables is not included in the checked-in migration files listed above.
- Database configuration is required before the backend can operate correctly.
- The frontend and backend API configuration must match the local environment.
- The complete workflow should be tested with each user role.
- No claim is made that a formal automated test suite exists unless one is added and verified.
- External government database integration, official identity verification, payment processing, and electronic signatures are not represented as implemented features.
- Deployment, monitoring, backup, and operational security require further work.

## 16. Future Enhancements

Potential future improvements include:

- Application document upload and validation.
- More comprehensive reports and analytics.
- Advanced search, filtering, sorting, and pagination.
- Email or SMS notifications through external providers.
- More detailed audit logging and reporting.
- Improved automated testing and continuous integration.
- Additional accessibility and responsive design improvements.
- Stronger production security and deployment configuration.
- Additional requirements identified in the formal Software Requirements Specification (SRS).

These are potential enhancements and should not be considered implemented unless supported by the current codebase.

## 17. Disclaimer

DSMS is an educational and development prototype intended to demonstrate a digital workflow for citizen service applications, officer reviews, administrative decisions, and certificate management.

It is not an official government website or service. It does not independently verify real-world identity, legal eligibility, or the authenticity of records held by government authorities.

The system must undergo appropriate technical, security, privacy, and operational review before any use involving real citizens or official administrative processes.

## 18. Author and Repository

**Project:** Divisional Secretariat Management System (DSMS)

**Repository:** [GayaniIresha/ds-management-system](https://github.com/GayaniIresha/ds-management-system)

---

*This documentation describes the project structure and functionality represented in the repository. Confirm implementation details against the current source code and local configuration before relying on them.*
