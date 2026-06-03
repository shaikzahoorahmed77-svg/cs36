# InternFAQ — AI-Powered Student Internship Support Platform

A Q&A platform where students post internship questions, get community answers, and admins curate the best responses into a searchable FAQ knowledge base.

**Live:** `http://localhost:3000` (frontend) · `http://localhost:4000` (backend API)

---

## Features

### For Students
- Browse, search, and ask questions
- Submit answers — goes through automated moderation before publishing
- Upvote/downvote answers
- Profile page with your questions and approved answers
- Notifications when your answer is approved or rejected

### For Admins
- Unified **Questions** review page — see all questions with pending answers, expand to review each answer
- **Approve** → answer added to FAQ, student notified, question marked `ANSWERED`
- **Reject** → answer permanently deleted
- Duplicate detection — similar FAQs are blocked (TF-IDF cosine similarity ≥ 40%)
- Keyword blocklist moderation — profanity/spam auto-rejected, rude content flagged for review
- Manage users (promote/demote), browse/delete FAQs, view analytics

### Moderation Pipeline
```
Student submits answer
       ↓
  BullMQ job queued
       ↓
  Keyword blocklist check
       ├── APPROVE → FAQ created, student notified, question → ANSWERED
       ├── FLAG    → stays PENDING in admin review queue
       └── REJECT  → permanently deleted
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript |
| Database | MongoDB Atlas (Mongoose ODM) |
| Queue/Cache | Redis + BullMQ |
| Auth | JWT (localStorage) |

---

## Quick Start

### Prerequisites
```bash
# Redis (BullMQ dependency)
redis-server

# Node.js 18+
node --version  # should be ≥ 18
```

### Backend
```bash
cd backend
npm install

# Set up environment (copy and edit as needed)
cp .env.example .env   # or edit .env with your Atlas URI + Redis URL

# Seed test data
npx tsx scripts/seed.js
npx tsx scripts/seed-faqs.js

# Start dev server
npx tsx watch src/index.ts
# API runs at http://localhost:4000/api/v1
```

### Frontend
```bash
cd frontend
npm install

# Set up environment
cp .env.example .env.local   # or edit .env.local with NEXT_PUBLIC_API_URL

# Start dev server
npx next dev -p 3000
# App runs at http://localhost:3000
```

---

## Test Credentials

| Email | Password | Role |
|---|---|---|
| `venky@gmail.com` | `Test@123` | ADMIN |
| `studenta@test.com` | `Test@123` | STUDENT |
| `studentb@test.com` | `Test@123` | STUDENT |

---

## Project Structure

```
internship-platform/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/            # Login, register
│       │   ├── (main)/            # Questions, profile, dashboard, notifications
│       │   └── (admin)/           # Admin panel
│       ├── components/            # Shared UI components
│       └── lib/
│           ├── api.ts             # All API client functions
│           └── utils.ts           # Helpers (formatDate, cn, etc.)
├── backend/
│   └── src/
│       ├── models/                # Mongoose schemas
│       ├── routes/                # Express route handlers
│       ├── services/              # Business logic
│       ├── queues/                # BullMQ workers (moderateAnswer, notifyUser)
│       ├── middleware/            # Auth + role guard
│       ├── ai/
│       │   └── moderation.ts      # Keyword blocklist moderator
│       └── index.ts               # Express entry point
```

---

## API Overview

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/auth/login` | POST | — | Login |
| `/api/v1/questions` | GET | — | List/search questions |
| `/api/v1/questions` | POST | STUDENT | Ask a question |
| `/api/v1/answers` | POST | STUDENT | Submit answer (moderated) |
| `/api/v1/answers/:id/vote` | PATCH | STUDENT | Upvote/downvote |
| `/api/v1/admin/questions` | GET | ADMIN | Questions with pending answers |
| `/api/v1/admin/answers/:id/approve` | PATCH | ADMIN | Approve → creates FAQ |
| `/api/v1/admin/answers/:id` | DELETE | ADMIN | Reject → delete answer |
| `/api/v1/admin/users/:id/role` | PATCH | ADMIN | Change user role |

Full endpoint documentation: [context.md](./context.md)

---

## Configuration

### Environment Variables

**Backend (`.env` in `backend/`):**
```env
PORT=4000
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>/?appName=Cluster0
REDIS_URL=redis://localhost:6379
JWT_SECRET=<your-secret>
```

**Frontend (`.env.local` in `frontend/`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Key Implementation Notes

- **MongoDB text indexes** cannot include array fields (`tags`). Only `title`, `body`, `question`, `answer` are indexed.
- **Mongoose populate paths**: always use `authorId`, `questionId`, `userId` — not `author`, `question`, `user`.
- **BullMQ worker** must call `approveAnswer()` service (not direct DB writes) to fire all side-effects (FAQ creation, question status update, notification).
- **FAQ deduplication** uses TF-IDF cosine similarity — threshold 40%. Edit `SIMILARITY_THRESHOLD` in `backend/src/ai/embeddings.ts` to adjust.
- **Moderation blocklist** lives in `backend/src/ai/moderation.ts` — edit `BLOCKLISTS` to add/remove flagged phrases.

---

## Scripts

```bash
# Seed test users + questions
npx tsx scripts/seed.js

# Seed VINS programme FAQs
npx tsx scripts/seed-faqs.js

# Run E2E smoke test
npx tsx scripts/test-live-flow.mjs
```