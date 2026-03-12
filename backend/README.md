# PharmaSys Backend API

This is the backend server for the PharmaSys application. It provides a RESTful API for managing pharmacy operations.

## 🚀 Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** JSON Web Tokens (JWT) & Bcrypt.js
*   **File Upload:** Multer

## 📁 Folder Structure

*   `config/`: Database connection and environment variables.
*   `controllers/`: Business logic for each API route.
*   `models/`: Mongoose data models (User, Medicine, Patient, etc.).
*   `routes/`: API route definitions.
*   `middleware/`: Custom middleware (authentication, authorization, error handling).
*   `services/`: Reusable services (email, SMS, stock alerts).
*   `utils/`: Helper functions and constants.
*   `jobs/`: Scheduled tasks using node-cron.
*   `scripts/`: Utility scripts for seeding the database, creating admins, etc.
*   `validations/`: Request data validation schemas.

## ⚙️ Installation & Setup

1.  **Clone the repository and navigate to the backend directory:**
    ```bash
    git clone <repository-url>
    cd pharmacy-management-system/backend