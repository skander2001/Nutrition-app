# NutriCare Backend — Documentation

## Table of Contents
1. [File Structure](#1-file-structure)
2. [How a Request Flows Through the App](#2-how-a-request-flows-through-the-app)
3. [Authentication Process](#3-authentication-process)
4. [API Reference + Postman Tests](#4-api-reference--postman-tests)
5. [JWT — What It Is and How to Use It](#5-jwt--what-it-is-and-how-to-use-it)
6. [Common Errors](#6-common-errors)

---

## 1. File Structure

```
backend/
│
├── app.py                        ← Entry point. Starts the server.
├── config.py                     ← All settings (DB, JWT, Google).
├── requirements.txt              ← Python packages to install.
├── .env.example                  ← Template for your .env secrets file.
│
├── models/                       ← Database table definitions (what the DB looks like in Python).
│   ├── __init__.py               ← Creates the `db` object shared by all models.
│   ├── user.py                   ← The `user` table (id, nom, prenom, email, password…).
│   ├── patient.py                ← The `patient` table (sexe, adresse, objectif…).
│   └── nutritionniste.py         ← The `nutritionniste` table (links a user to the doctor role).
│
├── services/                     ← Business logic. No HTTP here, just pure Python functions.
│   ├── __init__.py
│   └── auth_service.py           ← register(), login(), complete_profile(), etc.
│
├── controllers/                  ← HTTP layer. Receives requests, calls services, returns JSON.
│   ├── __init__.py
│   └── auth_controller.py        ← Defines the routes: /api/auth/register, /login, etc.
│
├── middlewares/                  ← Code that runs BEFORE a protected route executes.
│   ├── __init__.py
│   └── auth_middleware.py        ← @require_auth decorator: checks the JWT token.
│
└── migrations/
    └── add_oauth_columns.sql     ← One-time SQL to add Google OAuth columns to `user`.
```

### File roles in one sentence each

| File | What it does |
|---|---|
| `app.py` | Creates the Flask app, plugs everything together, starts the server on port 5000 |
| `config.py` | Reads your `.env` file and makes the values available to the app |
| `models/user.py` | Maps the `user` DB table to a Python class so you can do `User.query.filter_by(email=…)` |
| `models/patient.py` | Same for `patient`. Also has a `profile_complete` property (True if sexe + adresse + objectif are filled) |
| `services/auth_service.py` | Contains all the actual logic: hash the password, create rows in the DB, build the JWT |
| `controllers/auth_controller.py` | Receives the HTTP request, validates the input, calls the service, returns the HTTP response |
| `middlewares/auth_middleware.py` | A decorator you put on any route that requires login — it reads and verifies the JWT |

---

## 2. How a Request Flows Through the App

Every request follows the same path:

```
Browser / Postman
      │
      ▼
  controller          ← validates input, handles HTTP
      │
      ▼
  service             ← business logic, talks to DB
      │
      ▼
  model / DB          ← reads/writes MariaDB
      │
      ▼
  service returns dict
      │
      ▼
  controller wraps it in jsonify() and sends back HTTP response
```

**Example — register:**
```
POST /api/auth/register
      │
      ▼
auth_controller.py → register()
  - checks all fields are present
  - checks password length
      │
      ▼
auth_service.py → register()
  - checks email not already in DB
  - hashes the password with bcrypt
  - creates a row in `user`
  - creates a row in `patient` (empty for now)
  - generates a JWT token
      │
      ▼
Returns JSON with user data + token
```

---

## 3. Authentication Process

### 3.1 — Email/Password Registration (2 steps)

**Step 1 — Basic registration**

The user fills in: first name, last name, email, phone, password.
→ The backend creates a `user` row and an empty `patient` row.
→ Returns a JWT token immediately.
→ Angular redirects to `/complete-profile`.

**Step 2 — Complete profile**

The user fills in: sex, address, objective, allergies, chronic conditions.
→ Angular sends a `PATCH /api/auth/complete-profile` with the JWT in the header.
→ The backend updates the `patient` row.
→ Angular redirects to `/dashboard`.

```
[Register form]
      │  POST /api/auth/register
      ▼
  user row created (nom, prenom, email, telephone, hashed_password)
  patient row created (id_user = new user's id, everything else empty)
  JWT generated ──────────────────────────────► stored in localStorage
      │
      ▼
[Complete profile form]
      │  PATCH /api/auth/complete-profile  +  Authorization: Bearer <token>
      ▼
  patient row updated (sexe, adresse, objectif, allergie, maladie_chronique)
      │
      ▼
[Dashboard]
```

### 3.2 — Email/Password Login

```
[Login form]
      │  POST /api/auth/login
      ▼
  Find user by email in DB
  bcrypt.check(entered_password, stored_hash)   ← compares without ever storing plain text
  If OK → generate JWT ────────────────────────► stored in localStorage
      │
      ▼
[Dashboard]   (or /complete-profile if profile_complete = false)
```

### 3.3 — Google OAuth Login

The browser never sees the Google secret — everything happens server-side.

```
User clicks "Continuer avec Google"
      │
      ▼
Angular redirects to → GET /api/auth/google
      │
      ▼
Flask redirects to → accounts.google.com (with client_id + state)
      │
      ▼
User logs in on Google and grants permission
      │
      ▼
Google redirects back to → GET /api/auth/google/callback
      │
      ▼
Flask exchanges the code for a Google access token
Flask gets the user's profile from Google (email, given_name, family_name, sub)
      │
      ▼
Does this email already exist in our DB?
  → YES: link the Google identity to the existing account
  → NO: create a new user + patient row
      │
      ▼
Generate JWT
Redirect to → http://localhost:4200/dashboard?token=<JWT>
      (or /complete-profile if it's a new account)
      │
      ▼
Angular reads ?token= from the URL, stores it in localStorage
```

### 3.4 — How the JWT works

A JWT is a signed string in 3 parts: `header.payload.signature`

The payload we store inside it:
```json
{
  "user_id": 42,
  "role": "patient",
  "exp": 1748300000
}
```

`exp` is a Unix timestamp — the token expires after 24 hours (configurable in `.env`).

For any **protected route**, Angular must send:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The `@require_auth` decorator in `auth_middleware.py` intercepts the request,
decodes the token, and puts `user_id` + `role` on the request object so the
controller can use them without hitting the DB again.

---

## 4. API Reference + Postman Tests

Base URL: `http://localhost:5000`

---

### POST /api/auth/register

Creates a new patient account.

**Request**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "prenom":    "Bechir",
  "nom":       "Kanzari",
  "email":     "bechir@gmail.com",
  "telephone": "+216 22 451 308",
  "password":  "motdepasse123"
}
```

**Success — 201 Created**
```json
{
  "id": 144,
  "prenom": "Bechir",
  "nom": "Kanzari",
  "email": "bechir@gmail.com",
  "telephone": "+216 22 451 308",
  "ddn": null,
  "status": "actif",
  "role": "patient",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile_complete": false,
  "patient": {
    "id_patient": 32,
    "sexe": null,
    "adresse": null,
    "allergie": null,
    "maladie_chronique": null,
    "objectif": null,
    "ddc": "2026-05-17",
    "profile_complete": false
  }
}
```

**Error — 409 Conflict** (email already taken)
```json
{ "error": "Cette adresse e-mail est déjà utilisée" }
```

**Error — 400 Bad Request** (missing fields)
```json
{ "error": "Champs manquants : telephone, password" }
```

**Postman setup:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Tab **Body** → `raw` → `JSON`
- Paste the JSON above

---

### POST /api/auth/login

Logs in with email and password.

**Request**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email":    "bechir@gmail.com",
  "password": "motdepasse123"
}
```

**Success — 200 OK**
```json
{
  "id": 144,
  "prenom": "Bechir",
  "nom": "Kanzari",
  "email": "bechir@gmail.com",
  "role": "patient",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile_complete": false,
  "patient": { ... }
}
```

**Error — 401 Unauthorized**
```json
{ "error": "Email ou mot de passe incorrect" }
```

**Postman tip:** After login, copy the `token` value. You'll paste it into the
`Authorization` header for all protected routes below.

---

### PATCH /api/auth/complete-profile  🔒 Protected

Fills in the patient's medical profile after registration.

**Request**
```
PATCH http://localhost:5000/api/auth/complete-profile
Content-Type: application/json
Authorization: Bearer <paste token here>

{
  "sexe":              "M",
  "adresse":           "14 rue des Oliviers, Tunis",
  "allergie":          "Fruits à coque, lactose",
  "maladie_chronique": "Aucune",
  "objectif":          "perte_de_poids"
}
```

**Success — 200 OK**
```json
{
  "id": 144,
  "prenom": "Bechir",
  "role": "patient",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile_complete": true,
  "patient": {
    "id_patient": 32,
    "sexe": "M",
    "adresse": "14 rue des Oliviers, Tunis",
    "allergie": "Fruits à coque, lactose",
    "maladie_chronique": "Aucune",
    "objectif": "perte_de_poids",
    "ddc": "2026-05-17",
    "profile_complete": true
  }
}
```

**Error — 401 Unauthorized** (no token or expired)
```json
{ "error": "Token manquant" }
```

**Postman setup:**
- Tab **Authorization** → Type: `Bearer Token` → paste your token
- Tab **Body** → `raw` → `JSON` → paste the JSON above

---

### GET /api/auth/me  🔒 Protected

Returns the currently logged-in user's data. Useful to check who is connected
and whether their profile is complete.

**Request**
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <paste token here>
```

**Success — 200 OK** — same structure as login response

**Error — 401** if token is missing/expired/invalid

**Postman setup:**
- Method: `GET`
- Tab **Authorization** → Type: `Bearer Token` → paste your token
- No body needed

---

### GET /api/auth/google

Starts the Google OAuth flow. **Not testable in Postman** — must be opened in a
real browser because it redirects to Google's login page.

Open in browser: `http://localhost:5000/api/auth/google`

After Google login, the user is redirected back to:
```
http://localhost:4200/complete-profile?token=<JWT>
   or
http://localhost:4200/dashboard?token=<JWT>
```

---

## 5. JWT — What It Is and How to Use It

Think of a JWT like a **signed wristband** at a concert.

- When you enter (login/register), the security desk gives you a wristband (JWT).
- Every time you want to access something (protected route), you show your wristband.
- The staff (middleware) checks the signature — if it's real and not expired, you're in.
- They never need to check the guest list again (no DB call on each request).

**Structure:**
```
eyJhbGciOiJIUzI1NiJ9  .  eyJ1c2VyX2lkIjo0Mn0  .  abc123signature
       HEADER                    PAYLOAD               SIGNATURE
   (algorithm used)        (your data: id, role)    (proves it wasn't tampered)
```

The PAYLOAD is just base64 — anyone can decode it. The SIGNATURE is what makes
it secure — only the server can generate a valid one because only it knows the
`JWT_SECRET`.

**In Angular** — the token is stored in `localStorage` under the key
`nutricare_token` and sent automatically by `AuthService` on every protected call:
```typescript
headers: { Authorization: `Bearer ${this.auth.token}` }
```

**Token expiry:** 24 hours by default. After that, the user must log in again.
You can change this in `.env`: `JWT_EXPIRY_HOURS=48`

---

## 6. Common Errors

| HTTP Code | Message | Cause | Fix |
|---|---|---|---|
| 400 | `Champs manquants : email` | A required field is missing from the request body | Add the missing field |
| 400 | `Le mot de passe doit contenir au moins 8 caractères` | Password too short | Use a longer password |
| 401 | `Token manquant` | No `Authorization` header was sent | Add `Authorization: Bearer <token>` |
| 401 | `Token expiré` | The JWT is older than 24h | Log in again to get a new token |
| 401 | `Token invalide` | The token is malformed or signed with the wrong secret | Log in again |
| 401 | `Email ou mot de passe incorrect` | Wrong credentials or OAuth account (no password set) | Check credentials |
| 403 | `Accès refusé` | Route requires `nutritionniste` role but user is a `patient` | Use the nutritionniste account |
| 404 | `Profil patient introuvable` | No `patient` row exists for this user | Should not happen — re-register |
| 409 | `Cette adresse e-mail est déjà utilisée` | Email already in DB | Use a different email or log in |

---

## Quick Start

```bash
# 1. Copy and fill in your secrets
cp .env.example .env
# Edit .env: DB_PASSWORD, JWT_SECRET

# 2. Run the DB migration once
mysql -u root -p nutrition_db < migrations/add_oauth_columns.sql

# 3. Activate the virtual environment
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 4. Start the server
python app.py
# → Running on http://localhost:5000

# 5. Test it
# Open Postman and try POST /api/auth/register
```
