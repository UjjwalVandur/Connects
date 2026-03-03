# Social Media App
Hello Everyone!!!
A full-stack social media platform built with **React** (frontend) and **Express + MongoDB** (backend).

---

## Project Structure

```
/
├── backend/        Express REST API
└── frontend/       React SPA
```

---

## 🚀 Quick Start (Development)

### 1. Backend

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run dev                 # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
# .env.development is pre-configured for local dev
npm install
npm start                   # starts on http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable       | Default                                    | Description                  |
|----------------|--------------------------------------------|------------------------------|
| `PORT`         | `3001`                                     | Server port                  |
| `NODE_ENV`     | `development`                              | `development` or `production`|
| `MONGO_URL`    | `mongodb://localhost:27017/socialdb`       | MongoDB connection string    |
| `JWT_SECRET`   | *(required)*                               | Long random secret string    |
| `JWT_EXPIRES_IN`| `1d`                                      | Token expiry                 |
| `CORS_ORIGINS` | `http://localhost:3000`                    | Comma-separated allowed origins |

### Frontend

| File                    | Used when          | Key variable              |
|-------------------------|--------------------|---------------------------|
| `.env.development`      | `npm start`        | `REACT_APP_API_BASE_URL`  |
| `.env.production`       | `npm run build`    | `REACT_APP_API_BASE_URL`  |

Update `.env.production` with your live API URL before deploying.

---

## 🏗️ Deployment

### Backend
- Set `NODE_ENV=production` in your hosting platform (Render, Railway, Fly.io, etc.)
- Set `MONGO_URL` to your Atlas connection string
- Set a strong `JWT_SECRET`
- Set `CORS_ORIGINS` to your production frontend URL

### Frontend
- Update `frontend/.env.production` → set `REACT_APP_API_BASE_URL` to your deployed backend URL
- Run `npm run build` → deploy the `build/` folder to Vercel, Netlify, or any static host

---

## API Routes

### Auth
| Method | Endpoint         | Description     |
|--------|-----------------|-----------------|
| POST   | `/auth/register` | Register a user |
| POST   | `/auth/login`    | Login           |

### Users
| Method | Endpoint                | Auth | Description            |
|--------|------------------------|------|------------------------|
| GET    | `/users/:id`           | ✅   | Get user profile       |
| GET    | `/users/:id/friends`   | ✅   | Get user friends       |
| PATCH  | `/users/:id/:friendId` | ✅   | Add/remove friend      |

### Posts
| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| GET    | `/posts`              | ✅   | Get feed posts       |
| POST   | `/posts`              | ✅   | Create post          |
| GET    | `/posts/:userId/posts`| ✅   | Get user posts       |
| PATCH  | `/posts/:id/like`     | ✅   | Like/unlike a post   |
