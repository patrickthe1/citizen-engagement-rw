# Backend Documentation

This document provides technical details about the backend service for the CitizenHub application.

## Overview

The backend is a **RESTful API service** built with **Node.js** and the **Express.js** framework. It is responsible for handling all application logic, interacting with the **PostgreSQL** database, managing citizen submissions, implementing admin functionality with access control, and providing data for the public statistics dashboard.

## Technology Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Sequelize
* **Request Validation:** Joi
* **Authentication:** JSON Web Tokens (JWT) (for admin login, implemented with `jsonwebtoken`), Session Management (using `express-session` - Note: MVP uses `MemoryStore`, not production-ready).
* **Password Hashing:** `bcrypt`
* **Database Driver:** `pg`
* **Environment Variables:** `dotenv`

## Architecture

The backend follows a layered architecture, separating concerns into distinct directories:

* `controllers/`: Contains the logic for handling incoming API requests, interacting with services, and sending responses. Each controller (`submissionController.js`, `adminController.js`, `agencyController.js`, `categoryController.js`, `statsController.js`) is responsible for a specific set of routes.
* `models/`: Defines the Sequelize models that represent the database tables (`Agency.js`, `Category.js`, `Submission.js`, `User.js`). This is where database schema structure, relationships, and validation are defined at the ORM level.
* `routes/`: Defines the API endpoints and maps them to the corresponding controller functions (`api.js` contains the main API routes).
* `middleware/`: Contains custom middleware functions, such as `authMiddleware.js` for protecting admin routes and verifying user authentication and authorization.
* `utils/`: Contains utility functions used across the application, such as `categorizationAndValidation.js` for AI categorization logic and Joi validation schemas, and `helpers.js` for generating unique ticket IDs.
* `config/`: Contains configuration files, such as `database.js` for Sequelize database connection setup.
* `migrations/`: Contains SQL files for setting up the database schema (`create_schema.sql`) and populating it with initial data (`seed_data.sql`).

The application structure promotes modularity and maintainability. Requests flow from `routes/` to `middleware/` (if applicable) to `controllers/`, which then interact with `models/` or `utils/` before sending a response back.

## Database Schema

The application uses a PostgreSQL database with the following key tables:

* **`agencies`**: Stores information about government agencies.
    * `id` (Primary Key)
    * `name`
    * `contact_email`
    * `contact_information`
    * `created_at`, `updated_at` (Timestamps)

* **`categories`**: Stores types of public service issues.
    * `id` (Primary Key)
    * `name`
    * `description`
    * `agency_id` (Foreign Key referencing `agencies`) - Links categories to the responsible agency.
    * `created_at`, `updated_at` (Timestamps)

* **`users`**: Stores administrator user accounts.
    * `id` (Primary Key)
    * `username` (Unique)
    * `password_hash` (Stores bcrypt hashed passwords)
    * `role` (e.g., 'admin')
    * `agency_id` (Foreign Key referencing `agencies`) - Links admin users to the agency they manage.
    * `created_at`, `updated_at` (Timestamps)

* **`submissions`**: Stores citizen feedback/complaints.
    * `id` (Primary Key)
    * `ticket_id` (Unique, human-readable identifier)
    * `category_id` (Foreign Key referencing `categories`) - Links submission to its category.
    * `agency_id` (Foreign Key referencing `agencies`) - Links submission to the responsible agency (derived from category).
    * `subject`
    * `description`
    * `citizen_contact`
    * `language_preference`
    * `status` (e.g., 'Received', 'In Progress', 'Resolved', 'Closed' - with check constraint)
    * `admin_response`
    * `created_at`, `updated_at` (Timestamps)

**Relationships:**

* An Agency can have many Categories and many Users.
* A Category belongs to one Agency.
* A User belongs to one Agency.
* A Submission belongs to one Category and one Agency.

## API Endpoints

The backend exposes the following API endpoints:

### Public Endpoints (No Authentication Required)

* **`GET /api/agencies`**
    * Description: Get a list of all government agencies.
    * Response: `200 OK` - JSON array of agency objects (`id`, `name`, `contact_email`, `contact_information`).

* **`GET /api/categories`**
    * Description: Get a list of all submission categories.
    * Response: `200 OK` - JSON array of category objects (`id`, `name`, `description`).

* **`POST /api/submissions`**
    * Description: Submit a new citizen feedback or complaint.
    * Request Body: JSON object with:
        * `description` (string, required)
        * `subject` (string, optional)
        * `citizen_contact` (string, optional)
        * `language_preference` (string, optional, 'english' or 'kinyarwanda', defaults to 'english')
        * `category_id` (number, optional) - User's selected category ID. Backend prioritizes this if provided and valid, otherwise uses AI categorization.
    * Response: `201 Created` - JSON object with the generated `ticketId`.
    * Error Responses: `400 Bad Request` (Validation Error), `500 Internal Server Error`.

* **`GET /api/submissions/:ticketId`**
    * Description: Get the details of a specific submission using its public ticket ID.
    * URL Parameters: `:ticketId` (string, the unique ticket identifier).
    * Response: `200 OK` - JSON object with submission details, including nested category and agency information.
    * Error Responses: `404 Not Found` (Submission not found), `500 Internal Server Error`.

* **`GET /api/stats/summary`**
    * Description: Get aggregated statistics about submissions for the public dashboard.
    * Response: `200 OK` - JSON object with statistics (e.g., `totalSubmissions`, `submissionsByStatus`, `submissionsByCategory`).
    * Error Responses: `500 Internal Server Error`.

### Admin Endpoints (Authentication Required)

* **`POST /api/admin/login`**
    * Description: Authenticate an administrator user.
    * Request Body: JSON object with:
        * `username` (string, required)
        * `password` (string, required)
    * Response: `200 OK` - JSON object with user details (`id`, `username`, `role`, `agency`) and a JWT token.
    * Error Responses: `400 Bad Request` (Validation Error), `401 Unauthorized` (Invalid credentials), `500 Internal Server Error`.

* **`GET /api/admin/submissions`**
    * Description: Get a list of submissions filtered by the authenticated admin's agency.
    * Authentication: Requires valid JWT in `Authorization: Bearer <token>` header.
    * Response: `200 OK` - JSON array of submission objects for the admin's agency, including nested category and agency information.
    * Error Responses: `401 Unauthorized` (Missing/invalid token), `403 Forbidden` (User is not an admin), `500 Internal Server Error`.

* **`GET /api/admin/submissions/:id`**
    * Description: Get the details of a specific submission by its database ID.
    * URL Parameters: `:id` (number, the submission's database primary key ID).
    * Authentication: Requires valid JWT in `Authorization: Bearer <token>` header.
    * Authorization: Admin must belong to the agency assigned to the submission.
    * Response: `200 OK` - JSON object with submission details, including nested category and agency information.
    * Error Responses: `401 Unauthorized`, `403 Forbidden` (Admin does not manage this submission's agency), `404 Not Found` (Submission not found), `500 Internal Server Error`.

* **`PUT /api/admin/submissions/:id`**
    * Description: Update the status and admin response for a specific submission.
    * URL Parameters: `:id` (number, the submission's database primary key ID).
    * Authentication: Requires valid JWT in `Authorization: Bearer <token>` header.
    * Authorization: Admin must belong to the agency assigned to the submission.
    * Request Body: JSON object with:
        * `status` (string, required, must be one of allowed values: 'Received', 'In Progress', 'Resolved', 'Closed')
        * `admin_response` (string, optional)
    * Response: `200 OK` - JSON object with the updated submission details.
    * Error Responses: `400 Bad Request` (Validation Error), `401 Unauthorized`, `403 Forbidden` (Admin does not manage this submission's agency), `404 Not Found` (Submission not found), `500 Internal Server Error`.

## AI Categorization Logic

The backend includes a basic keyword-based categorization utility (`utils/categorizationAndValidation.js`). When a new submission is received via `POST /api/submissions`:

1.  The backend first checks if a `category_id` was provided in the request body from the frontend dropdown.
2.  If a `category_id` is provided and corresponds to a valid Category in the database with an associated `agency_id`, this category is used, and the AI logic is skipped.
3.  If no `category_id` is provided, or if the provided ID is invalid/lacks an agency, the AI categorization logic runs.
4.  The AI analyzes keywords in the submission's description against predefined lists (`categorization_keywords.json`).
5.  It scores potential categories based on keyword matches.
6.  The category with the highest score is selected.
7.  If the AI finds a category, its ID and associated agency ID are used.
8.  As a final fallback, if neither frontend selection nor AI categorization yields a valid category with an agency, the submission is assigned to the 'General' category.

This approach prioritizes the user's explicit selection while using AI as a fallback for uncategorized submissions.

## Authentication and Authorization

Admin authentication uses a simple JWT-based system:

1.  On successful login (`POST /api/admin/login`), the backend generates a JWT containing basic user info (like ID, username, role, agency ID) and returns it to the frontend.
2.  The frontend stores this token (and user info) (in `localStorage` for MVP).
3.  For subsequent requests to protected admin endpoints (`/api/admin/*`), the frontend includes the JWT in the `Authorization: Bearer <token>` header (handled by the Axios interceptor).
4.  The `ensureAdminAuthenticated` middleware (`middleware/authMiddleware.js`) on the backend intercepts these requests.
5.  It extracts the token from the header, verifies it using the `JWT_SECRET`, and checks if the decoded payload indicates an 'admin' role.
6.  If the token is valid and the user is an admin, the middleware attaches the user info (including `agency_id`) to the request object (`req.user`) and calls `next()`.
7.  For endpoints requiring agency-specific authorization (`GET /api/admin/submissions`, `GET /api/admin/submissions/:id`, `PUT /api/admin/submissions/:id`), the controller logic further checks if `req.user.agency_id` matches the `agency_id` of the requested/target submission.

**Note:** The current session management (`express-session` with `MemoryStore`) and JWT handling are simplified for the MVP and require enhancements for production security and scalability.

## Local Development Setup

To set up and run the backend locally:

1.  Navigate to the backend directory:
    ```bash
    cd citizen-engagement-rw/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or using Bun: bun install
    ```
3.  Set up environment variables:
    * Create a `.env.local` file in the `backend/` directory.
    * Copy the content from `.env.local.example` (if provided) or manually add the following variables for your local PostgreSQL database:

    ```dotenv
    NODE_ENV=development
    PORT=3000

    # Local Database configuration
    DB_HOST=localhost
    DB_NAME=citizen_engagement_db
    DB_USER=postgres
    DB_PASSWORD=your_local_db_password # Replace with your actual local password
    # For local development, you might not need DATABASE_URL or SSL,
    # but ensure your database config in models/index.js handles this.

    # JWT Secret (use a strong, random string)
    JWT_SECRET=your_super_secret_jwt_key
    ```
4.  Ensure your local PostgreSQL server is running.
5.  Create and Seed Local Database:
    * Connect to your local PostgreSQL server (e.g., using `psql`, `pgAdmin`, or another client).
    * Create the database specified in `DB_NAME` (e.g., `citizen_engagement_db`).
    * Run the schema migration file (`backend/migrations/create_schema.sql`) against your new local database to create the tables.
        ```bash
        # Example using psql
        psql -d citizen_engagement_db -f backend/migrations/create_schema.sql
        ```
    * Run the seed data file (`backend/migrations/seed_data.sql`) against your local database to populate it with initial data (agencies, categories, test users).
        ```bash
        # Example using psql
        psql -d citizen_engagement_db -f backend/migrations/seed_data.sql
        ```
6.  Start the backend server:
    ```bash
    npm start
    # or using Bun: bun start
    ```
    The server should start and connect to your local database. You should see a "Database connection has been established successfully." message in your terminal.

## Deployment

The backend service is deployed on Render. It connects to a separate PostgreSQL database service also hosted on Render.

Deployment configuration involves setting environment variables on the Render dashboard, including the `DATABASE_URL` (the external connection string from the Render database), `PORT` (Render injects this, your app should listen on `process.env.PORT`), and `JWT_SECRET`.

The application code is configured to use `process.env.DATABASE_URL` when running in a production environment, which is the standard connection method for cloud databases like Render PostgreSQL. SSL is enabled for production connections as required by Render.

Refer to Render documentation for detailed steps on deploying a Node.js web service and PostgreSQL database.