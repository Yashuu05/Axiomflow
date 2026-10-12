# Implementation Plan: Business Account Profile Setup & Registration

## 1. Architectural Overview & Context
This plan describes the design and implementation of the **Business Account Profile Setup & Signup System**.
- **Admin Role**: The representative of the business/company registering their account with complete system control.
- **Relational Integrity**: As specified in the requirements:
  - Primary entity: `business_profile` table (stores organization profile, GSTIN, CIN, sector, etc.).
  - Secondary entity: `users` table (stores admin user authentication, name, email, hashed password, role=`admin`).
  - Foreign Key connection: To link each admin to their registered business, we will add a `business_id` column (referencing `business_profile.id` as a foreign key) to the `users` table.
- **Backend**: FastAPI REST service with Pydantic validation, password hashing, and MySQL atomic transactions.
- **Frontend**: Next.js (`/signup` page) aligned with Axiomflow's bespoke Editorial & Brutalist design system (`#F8F6F2`, `#1A2F25`, `#E06D53`, `#526359`). Features a 2-stage stepped wizard ("01 Admin Profile" & "02 Business Details") with a dynamic progress bar, illustrative placeholders, and inline validation.
- **Landing Page Gateway**: Replace the CTA buttons ("Deploy First Agent") in the header and hero sections with a primary "Register" CTA pointing directly to `/signup`.

---

## 2. Database Schema Alignment
The `business_profile` table has `id` (`INT AUTO_INCREMENT PRIMARY KEY`).
The `users` table will be updated to include:
- `business_id INT NULL` with `FOREIGN KEY (business_id) REFERENCES business_profile(id) ON DELETE CASCADE`
- Index `idx_users_business_id` on `business_id`

When an admin registers:
1. Insert new record into `business_profile` -> retrieve generated `business_profile.id`.
2. Generate UUID for `users.user_id`.
3. Hash admin password.
4. Insert new record into `users` with `role = 'admin'` and `business_id = <business_profile.id>`.
5. Wrap both queries in an atomic database transaction (`commit()` or `rollback()` on failure).

---

## 3. Backend Implementation (FastAPI in `backend/main.py`)
- **FastAPI Application**:
  - Enable CORS middleware for Next.js frontend (`http://localhost:3000`).
  - Pydantic models for request validation:
    - **Admin Data**: `first_name`, `last_name`, `email`, `password`, `department`, `profession`, `mobile_no`.
    - **Business Data**: `business_name`, `sector`, `gstin`, `cin`, `phone_no`, `email`, `website_url`, `description`.
  - Duplicate check: Validate that neither admin `email` nor business `gstin` already exists in `axiomflow_db`.
  - Route: `POST /api/register-business`
  - Route: `GET /health` or `GET /api/health`
- **Security**: Hash admin passwords using `bcrypt` or `hashlib.sha256` + salt before inserting into `users` table.

---

## 4. Frontend Implementation (`frontend/src/app/signup/page.tsx`)
- **Visual Design & System Theme**:
  - Warm parchment canvas background (`#F8F6F2`) with dark forest green (`#1A2F25`) typography.
  - Coral accent (`#E06D53`) for CTAs, active steps, and progress indicator.
  - Editorial header font and monospace technical sub-labels.
- **Progress Bar & Stepper**:
  - Visual Step indicator:
    - **Step 1: Admin Representative Setup** (Name, email, mobile, designation/profession, department, password).
    - **Step 2: Business & Statutory Profile** (Legal business name, industry sector, GSTIN, CIN, business contact & address/website).
  - Animated top progress bar (0% -> 50% -> 100%).
- **Interactive UX & Placeholders**:
  - Informative placeholders (e.g., `gstin`: `"29ABCDE1234F1Z5"`, `cin`: `"U72200KA2020PTC134567"`, `email`: `"admin@acmecorp.com"`).
  - Validation checks before advancing steps.
  - Loading states, animated spinner, and success confirmation modal with registration details and redirect.

---

## 5. Landing Page Updates
- Update [Navbar.tsx](file:///d:/projects/business_automation_workflow/frontend/src/components/Navbar.tsx):
  - Change "Deploy First Agent" button text to **"Register"** and route to `/signup`.
  - Update mobile drawer CTA to **"Register Business &rarr;"**.
- Update [HeroSection.tsx](file:///d:/projects/business_automation_workflow/frontend/src/components/HeroSection.tsx):
  - Change primary button "Deploy First Agent" to **"Register Business"** linking to `/signup`.

---

## 6. Verification & Testing
1. Execute table migration script to add `business_id` foreign key column if not present.
2. Run backend FastAPI server with `uvicorn main:app --reload --port 8000`.
3. Submit a test business registration via the frontend UI.
4. Verify record creation in AWS RDS MySQL:
   - Query `business_profile` for the newly registered business.
   - Query `users` to confirm the admin record contains role `'admin'` and `business_id` matching `business_profile.id`.
