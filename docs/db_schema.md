# Implementation Plan: Creating Real-Time Database Tables in `axiomflow_db`

This plan outlines the creation and management of the requested initial database tables in AWS RDS MySQL for AxiomFlow (`axiomflow_db`).

## 1. Schema Specifications (MySQL 8.x Compatible)

Since the schema is raw and subject to change, standard flexible data types (`VARCHAR`, `TEXT`, `DECIMAL`/`FLOAT`, standard `TIMESTAMP` defaults) and standard surrogate primary keys (`id` / `BIGINT AUTO_INCREMENT` or `VARCHAR(64)` for UUIDs) are recommended for clean relational architecture.

---

### Table 1: `business_profile`
Stores organization profile and statutory credentials.

| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | `PRIMARY KEY` | Internal ID |
| `business_name` | `VARCHAR(255)` | `NOT NULL` | Company / Business name |
| `sector` | `VARCHAR(100)` | `NULL` | Service, IT, Education, etc. |
| `gstin` | `VARCHAR(30)` | `NOT NULL`, `INDEX` | GSTIN registration number |
| `cin` | `VARCHAR(30)` | `NOT NULL` | Corporate Identification Number |
| `phone_no` | `VARCHAR(25)` | `NULL` | Contact phone number |
| `email` | `VARCHAR(255)` | `NULL` | Official email address |
| `website_url` | `VARCHAR(500)` | `NULL` | Official website URL |
| `description` | `TEXT` | `NULL` | Business brief description |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Record creation audit timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

---

### Table 2: `users`
Stores user authentication details, departmental assignment, and system roles.

| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `VARCHAR(64)` | `PRIMARY KEY` | Unique ID / UUID string (or auto-increment if preferred) |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | User's first name |
| `last_name` | `VARCHAR(100)` | `NULL` | User's last name |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Unique user email |
| `department` | `VARCHAR(100)` | `NULL` | IT, Sales, Marketing, Finance |
| `profession` | `VARCHAR(100)` | `NULL` | Data Engineer, HR, PM |
| `mobile_no` | `VARCHAR(25)` | `NULL` | Contact phone number |
| `role` | `VARCHAR(50)` | `DEFAULT 'spectator'` | Access role (admin, spectator, etc.) |
| `business_id` | `INT` | `NULL`, `FOREIGN KEY` -> `business_profile(id)` | Foreign key identifying which business the user belongs to |
| `password` | `VARCHAR(255)` | `NOT NULL` | Hashed password string (bcrypt/argon2) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registration timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

---

### Table 3: `logs`
Stores execution traces, agent activity, LLM metrics, and runtime durations.

| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `task_id` | `VARCHAR(64)` | `PRIMARY KEY` | Unique Task ID / Run UUID |
| `query` | `TEXT` | `NULL` | User input query / prompt |
| `status` | `VARCHAR(50)` | `NOT NULL`, `INDEX` | 'succeeded', 'failed', 'running', etc. |
| `task_description`| `TEXT` | `NULL` | Description of task executed |
| `agent_name` | `VARCHAR(100)` | `NULL`, `INDEX` | Planner Agent, Database Agent, etc. |
| `llm_name` | `VARCHAR(100)` | `NULL` | gemini-2.5-flash, qwen3:8b, etc. |
| `time_taken` | `FLOAT` | `NULL` | Execution duration in seconds (numeric for fast aggregations) |
| `time_stamp` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP`, `INDEX` | Log timestamp |

---

### Table 4: `notifications`
Stores real-time alerts, email dispatched logs, and communication statuses.

| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT AUTO_INCREMENT` | `PRIMARY KEY` | Notification event ID |
| `date` | `DATE` | `NULL` | Event Date (e.g., 2025-05-18) |
| `time` | `TIME` | `NULL` | Event Time (e.g., 06:07:45) |
| `message` | `TEXT` | `NOT NULL` | Notification message content |
| `status` | `VARCHAR(50)` | `NOT NULL`, `INDEX` | 'succeeded', 'failed', 'pending' |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Record timestamp |

---