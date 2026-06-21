# 🚀 MERN Starter — Role-Based Full Stack Template

Full stack MERN template with **Firebase Auth** (Email/Password + Google), **JWT**, **MongoDB**, and 3 role-based dashboards: **Admin / Instructor / User**.

---

## 📁 Project Structure

```
mern-starter/
├── server/               # Node.js + Express backend
│   ├── config/           # DB + Firebase Admin
│   ├── controllers/      # auth, user, admin, category, blog
│   ├── middleware/        # JWT auth + role guards
│   ├── models/           # User, InstructorRequest, Category, Blog
│   ├── routes/           # All API routes in index.js
│   ├── seeds/            # Seed script (3 users + categories + blogs)
│   └── index.js          # Entry point
│
└── client/               # React + Vite + Tailwind frontend
    └── src/
        ├── contexts/     # AuthContext (Firebase + JWT sync)
        ├── components/
        │   ├── common/   # ProfileEditor (shared by all roles)
        │   └── layout/   # Navbar, Footer, PublicLayout, DashboardLayout
        ├── pages/
        │   ├── public/   # Home, Blogs, BlogDetail, Categories, Login, Signup
        │   ├── user/     # UserDashboard, UserProfile, InstructorRequestPage
        │   ├── instructor/ # InstructorDashboard, InstructorBlogs, InstructorProfile
        │   └── admin/    # AdminDashboard, AdminUsers, AdminBlogs, AdminCategories, AdminInstructorRequests, AdminProfile
        ├── routes/       # ProtectedRoute.jsx
        └── utils/        # api.js (axios), firebase.js
```

---

## ⚙️ Backend Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Create `.env` from `.env.example`
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
```

> **Firebase Admin SDK Key**: Go to Firebase Console → Project Settings → Service Accounts → Generate new private key

### 3. Seed the database
```bash
npm run seed
```
Creates 3 users (admin, instructor, user), 5 categories, 2 sample blogs.

### 4. Start server
```bash
npm run dev     # development
npm start       # production
```

---

## 🎨 Frontend Setup

### 1. Install dependencies
```bash
cd client
npm install
```

### 2. Create `.env` from `.env.example`
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **Firebase Web Config**: Firebase Console → Project Settings → Your Apps → Web App → SDK Config

### 3. Enable Firebase Auth methods
Firebase Console → Authentication → Sign-in method → Enable:
- ✅ Email/Password
- ✅ Google

### 4. Start client
```bash
npm run dev
```

---

## 🔐 Authentication Flow

```
User signs up / logs in via Firebase (email+pass or Google)
    ↓
Frontend sends Firebase ID Token to /api/auth/firebase-sync
    ↓
Backend verifies token with Firebase Admin SDK
    ↓
Creates / finds user in MongoDB (default role: "user")
    ↓
Returns our own JWT + user data (with role)
    ↓
Frontend stores JWT in localStorage → attaches to all API requests
    ↓
Redirects to role-specific dashboard
```

---

## 🛡️ Role System

| Role | Can Access |
|------|-----------|
| **user** | `/user/*` — profile, instructor request |
| **instructor** | `/instructor/*` — dashboard, blogs, profile |
| **admin** | `/admin/*` — all users, requests, categories, blogs, profile |

- Users **cannot** access admin or instructor panels
- On login, auto-redirected to their own dashboard
- Admin can change any user's role directly
- Admin can create instructor directly (with email + password)
- User can request instructor role → admin reviews → approve/reject

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/firebase-sync` | Sync Firebase user → get JWT |
| GET | `/api/auth/me` | Get current user |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Own profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/request-instructor` | Request instructor role |
| GET | `/api/users/my-request` | Check own request status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/role` | Change role |
| PUT | `/api/admin/users/:id/toggle` | Activate/deactivate |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/create-instructor` | Create instructor directly |
| GET | `/api/admin/instructor-requests` | All requests |
| PUT | `/api/admin/instructor-requests/:id` | Approve/reject |

### Categories (Public GET, Admin CRUD)
- `GET /api/categories` — public
- `GET/POST/PUT/DELETE /api/admin/categories` — admin only

### Blogs (Public GET, Instructor/Admin CRUD)
- `GET /api/blogs` — public list
- `GET /api/blogs/:slug` — public single
- `GET/POST/PUT/DELETE /api/admin/blogs` — instructor/admin

---

## 🧪 Test Accounts

After running `npm run seed`, create these emails in Firebase Console → Authentication → Users → Add User:

| Email | Password | Role |
|-------|----------|------|
| admin@mernstarter.com | any6chars | admin |
| instructor@mernstarter.com | any6chars | instructor |
| user@mernstarter.com | any6chars | user |

Or just sign up fresh — new signups always get "user" role.

---

## 🚀 Deployment

**Backend** → Render / Railway  
**Frontend** → Vercel / Netlify  

Set all env variables in your hosting platform.
