# CyberShield Assessment - Cybersecurity Awareness Exam Platform

CyberShield is a production-ready, commercial-grade Cybersecurity Awareness Examination and Training Assessment platform. Similar to Google Forms but hardened with **military-grade anti-cheating monitoring**, session state recovery, custom PDF certificate builders, and dynamic administrative dashboards.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React, Vite (Fast Hot Module Replacement)
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS (Class-based dark/light mode extensions)
* **Data Vis:** Recharts (High-fidelity SVGs)
* **Networking:** Axios (Credentialed cookies handlers)
* **Syncing:** Socket.IO Client (Real-time admin log triggers)

### Backend
* **Core:** Node.js, Express.js (Service-Controller-Router modular patterns)
* **Database:** MongoDB Atlas, Mongoose (Document-mapping schemas)
* **Security:** Helmet (Secure Headers), Express-Rate-Limit (DDoS shields), Express-Mongo-Sanitize (SQL injection blocks)
* **Files:** Multer, xlsx (Spreadsheets parser)
* **Documents:** PDFKit (Dynamic vector certificate generator)
* **Communications:** Nodemailer (SMTP verification emails sender)

---

## 📁 Repository Structure

```
d:\cyber_quiz\
├── backend/
│   ├── config/db.js           # Database Connection
│   ├── models/                # Database Mongoose schemas
│   ├── services/              # Service Layer (Business Logic)
│   ├── controllers/           # HTTP Request Controllers
│   ├── middleware/            # JWT, Rate Limit, and error handlers
│   ├── routes/                # API Endpoints
│   ├── seed/                  # Seeder logic with 50+ MCQ questions
│   ├── server.js              # Server entry startup
│   ├── test-flow.js           # Automated backend flow validation
│   └── .env.example           # Configurations template
├── frontend/
│   ├── src/
│   │   ├── components/        # Protected routes, Sidebar, Navbar
│   │   ├── context/           # Auth and Theme provider states
│   │   ├── services/api.js    # Axios client
│   │   ├── pages/
│   │   │   ├── candidate/     # Landing, Timed Quiz, Results, and Verification
│   │   │   └── admin/         # Login, Dashboards, CRUD questions/quizzes
│   │   ├── App.jsx            {Routes map}
│   │   ├── index.css          [Tailwind custom files]
│   │   └── main.jsx           (Mount root)
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md                  # Documentation Guide
```

---

## 🚀 Local Installation & Setup

### Prerequisites
* Node.js (v18.0.0 or higher)
* MongoDB Local Server (Running on `mongodb://localhost:27017`)

### Step 1: Configure Backend & Seed Database
1. Open a terminal in `backend/` and run:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and configure credentials:
   ```bash
   cp .env.example .env
   ```
3. Populate MongoDB with questions and admin credentials:
   ```bash
   npm run seed
   ```
   * *Admin Profile:* **admin** / **adminPassword123**
   * *Active Quiz Codes:* **CYBER2026**, **PHISH2026**
4. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *(Server starts at `http://localhost:5000`)*

### Step 2: Configure Frontend
1. Open a terminal in `frontend/` and run:
   ```bash
   npm install
   ```
2. Launch the Vite developer server:
   ```bash
   npm run dev
   ```
   *(Frontend runs at `http://localhost:5173`)*

---

## 🔐 Security & Anti-Cheating Architecture

* **Tab Switching:** Employs the `Page Visibility API`. Triggers warnings when tabs change or screens blur.
* **Forced Fullscreen:** Requests fullscreen on Start. Exiting fullscreen triggers visual warning modals and logs a violation.
* **Disqualification:** If violations count exceeds `Quiz.violationLimit` (default 3), the attempt is automatically finalized with status `disqualified`, score `0`, and grade `Fail`.
* **Shortcuts Blocks:** Blocks keybinds `F12`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+U`, `Ctrl+S`, and right-click menus.
* **Autosave Recovery:** Progress saves on answer changes and every 10 seconds. Restores countdown values and selected choices upon tab refresh.
* **Cookie Sessions:** JWT Access (15m) and Refresh (7d) tokens are transferred exclusively through HttpOnly, Secure, SameSite cookies.

---

## 📝 Database Schemas (Mongoose)

### 1. `Quiz`
```javascript
{
  title: String,
  code: String, // unique uppercase key, e.g. CYBER2026
  status: String, // Draft, Active, Archived
  startDate: Date,
  endDate: Date,
  duration: Number, // in minutes
  passingPercentage: Number,
  questionCount: Number,
  randomizeQuestions: Boolean,
  randomizeOptions: Boolean,
  fullscreenRequirement: Boolean,
  violationLimit: Number,
  autoSubmitEnabled: Boolean
}
```

### 2. `Question`
```javascript
{
  questionId: ObjectId, // groups versions
  version: Number, // version incrementor
  question: String,
  options: [String], // exactly 4 choices
  correctAnswer: String,
  category: String,
  difficulty: String // easy, medium, hard
}
```

### 3. `QuizAttempt`
```javascript
{
  quiz: ObjectId,
  candidate: ObjectId,
  candidateId: String, // e.g. CYBER-2026-0001
  status: String, // registered, in_progress, submitted, auto_submitted, disqualified
  questions: [QuestionSnapshot], // snapshot cloned at start
  answers: Map, // selected choices
  score: Number,
  percentage: Number,
  passOrFail: String,
  timeTaken: Number,
  remainingTime: Number,
  violationCount: Number,
  violationDetails: [{ violationType: String, timestamp: Date }],
  ipAddress: String,
  userAgent: String,
  deviceType: String,
  os: String
}
```

---

## 📈 API Reference Guide

### Candidate Endpoints
* `POST /api/quiz-attempts/register` - Register name, email and quiz code.
* `POST /api/quiz-attempts/:attemptId/start` - Initialize timertick and fetch questions snapshot.
* `POST /api/quiz-attempts/:attemptId/autosave` - Save active selections.
* `POST /api/quiz-attempts/:attemptId/violation` - Log warning logs.
* `POST /api/quiz-attempts/:attemptId/submit` - Submit answers and compile grade.
* `GET /api/quiz-attempts/:attemptId/resume` - Session check and recovery state.

### Certificate Endpoints
* `GET /api/certificates/verify/:certId` - Public check for certificate validity.
* `GET /api/certificates/download/:certId` - Generate and pipe PDF certificate.

### Admin Endpoints
* `POST /api/auth/login` - Admin cookie login.
* `POST /api/auth/logout` - Clear sessions cookies.
* `GET /api/auth/stats` - Fetch dashboard numbers.
* `GET /api/questions` - List questions.
* `POST /api/questions/import` - Bulk upload questions.
* `POST /api/candidates/import` - Bulk upload candidate rosters.

---

## 🌐 Production Deployment Guide

### Database Setup (MongoDB Atlas)
1. Register on MongoDB Atlas and spin up a free tier cluster.
2. Under "Network Access", allow IP access `0.0.0.0/Object` (or Render host IPs).
3. Under "Database Access", create credentials and copy the Connection URI string:
   `mongodb+srv://<user>:<password>@cluster.mongodb.net/cyber_quiz`

### Backend Setup (Render)
1. Create a Web Service on Render and link your Github repository.
2. Configure settings:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
3. Under "Environment Variables", set:
   * `NODE_ENV` = `production`
   * `PORT` = `10000`
   * `MONGODB_URI` = `YOUR_MONGODB_ATLAS_URI`
   * `CLIENT_URL` = `YOUR_VERCEL_FRONTEND_URL`
   * `JWT_ACCESS_SECRET` = `RANDOM_STRING_32CHARS`
   * `JWT_REFRESH_SECRET` = `RANDOM_STRING_32CHARS`

### Frontend Setup (Vercel)
1. Add a new Project on Vercel and link your Github repository.
2. Configure settings:
   * **Root Directory:** `frontend`
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Under "Environment Variables", add:
   * `VITE_API_URL` = `YOUR_RENDER_BACKEND_URL/api`
   * `VITE_WS_URL` = `YOUR_RENDER_BACKEND_URL`
