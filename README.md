# ✦ Connects v2.0
A dynamic, full-stack social media platform built with the MERN stack (**MongoDB, Express, React, Node.js**) featuring real-time messaging, comprehensive multimedia support via Cloudinary, and stunning glassmorphic UI elements.

---

## 🔥 Features
* **Modern UI/UX:** Responsive design, Dark/Light Mode toggle, and glassmorphism styling.
* **Real-time Engine:** Instant messaging and push notifications powered by Socket.io.
* **Multimedia Publishing:** Users can create posts and profiles with absolute confidence as images and video uploads are seamlessly managed by **Cloudinary**.
* **Engaging Feeds:** Sponsored ads integration, "Save Post" functionality, and dynamic friend timelines.
* **Secure Auth:** Encrypted JWT sessions with Bcrypt hashing and automated Password Reset emails.

---

## 🛠 Project Structure
This repository contains both the client and server codeframes in a convenient monorepo layout:
```text
/
├── backend/        Node.js + Express API
└── frontend/       React SPA (Create React App)
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend

Navigate to the `backend` folder and configure your local environment variables.

```bash
cd backend
npm install
```

**Create a `.env` file in the `backend/` directory:**
```env
PORT=3001
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/socialdb
JWT_SECRET=your_super_secret_string
JWT_EXPIRES_IN=1d
CORS_ORIGINS=http://localhost:3000

# Cloudinary Integration (Required for image uploads!)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Password Recovery
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

Start the server:
```bash
npm run dev
```

### 2. Frontend

Navigate to the `frontend` folder to boot up the React client.

```bash
cd frontend
npm install
```

**Create a `.env.development` file in the `frontend/` directory:**
```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

Start the client (automatically opens at http://localhost:3000):
```bash
npm start
```

---

## 🏗️ Production Deployment

Connects v2.0 is highly optimized for deployment on Platforms-as-a-Service like **Render**, **Heroku**, and **Vercel**. Due to the integration of Cloudinary, the backend is fully stateless and ephemeral-storage friendly!

### Deploying the Backend (e.g., Render)
1. Set the **Root Directory** to: `backend`
2. Set the **Build Command** to: `npm install`
3. Set the **Start Command** to: `npm start` *(or `node index.js`)*
4. Configure your production environment variables in the dashboard:
   - `MONGO_URL` (Use your MongoDB Atlas URI)
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CORS_ORIGINS` (Set this to your live frontend URL, e.g., `https://connects.vercel.app`)

### Deploying the Frontend (e.g., Vercel)
1. Connect your repository to Vercel.
2. Under "Framework Preset", select **Create React App**.
3. Under "Root Directory", type **`frontend`**.
4. Set the **Environment Variable**:
   - `REACT_APP_API_BASE_URL` (Set this to your live backend URL, e.g., `https://connects-api.onrender.com`)
5. Deploy! Vercel will automatically build the React app and properly route your SPA via the included `vercel.json` rewrite configuration.

*(Note: The `CI=false` flag is no longer strictly required directly in Vercel's environment variables dashboard if you desire strict linter enforcing, but generally recommended if using standard React-Scripts)*

---

## 🔒 API Routes Summary

### Authentication
* `POST /auth/register` - Register a new user
* `POST /auth/login` - Authenticate & receive JWT
* `POST /auth/forgot-password` - Dispatch recovery email
* `POST /auth/reset-password` - Submit new password hash

### Users
* `GET /users/:id` - Fetch user profile
* `GET /users/:id/friends` - Fetch user's friends list
* `PATCH /users/:id/:friendId` - Toggle friend status
* `GET /users/search` - Query users globally

### Posts
* `POST /posts` - Publish a new feed item
* `GET /posts` - Fetch global timeline
* `GET /posts/:userId/posts` - Fetch specific user's posts
* `PATCH /posts/:id/like` - Toggle like status
* `PATCH /posts/:id/comment` - Add a comment

---

> Built with ❤️ by UjjwalVandur and AI
