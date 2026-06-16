# Context — AI-Powered Student Internship Support Platform

> Living document. Update as the project evolves.

---

## What This Project Is

A Q&A platform for students seeking internship support, backed by a growing FAQ knowledge base. Students post questions → community answers → admin approves → answer becomes a searchable FAQ. Built with Next.js (frontend) + Express + MongoDB (backend).

Live at: `http://localhost:3000` (frontend) | `http://localhost:4000` (backend)

---

## Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query | |
| Backend | Express.js, TypeScript, Node.js | API at `/api/v1/` |
| Database | MongoDB 7 + Mongoose ODM | Atlas cloud instance (see `.env`) |
| Cache/Queue | Redis + BullMQ | Redis must be running before backend |
| Auth | JWT (access token in localStorage) | No refresh token / httpOnly cookie |

---

## Project Structure

```
internship-platform/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/           # Login, register
│       │   ├── (main)/           # Questions, dashboard, profile, notifications
│       │   └── (admin)/          # Admin panel pages
│       ├── components/           # Shared UI (navbar, sidebar, toaster, cards)
│       ├── lib/
│       │   ├── api.ts            # All API clients (authApi, questionsApi, answersApi,
│       │   │                     #   adminApi, notificationsApi, answersApi)
│       │   └── utils.ts          # formatDate, formatRelativeTime, cn helper
│       └── types/index.ts        # Shared TypeScript types
├── backend/
│   └── src/
│       ├── models/               # Mongoose (User, Question, Answer, FAQ, Vote, Notification)
│       ├── routes/               # auth, questions, answers, notifications, admin
│       ├── services/             # question.service, answer.service, faq.service
│       ├── queues/               # moderateAnswer.ts (BullMQ), notifyUser.ts
│       ├── middleware/           # auth.ts (JWT verify + role guard)
│       ├── ai/                   # moderation.ts (keyword blocklist)
│       └── index.ts              # Express entry point
└── SPEC.md
```

---

## API Routes

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login → returns JWT |
| GET | `/api/v1/questions` | List questions (filter: `status`, `authorId`, `search`, `tag`) |
| GET | `/api/v1/questions/:id` | Get single question with answers |
| GET | `/api/v1/faqs` | Search FAQs (filter: `search`, `tag`) |
| GET | `/api/v1/notifications` | Get notifications (auth required) |

### Authenticated (student)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/questions` | Post a new question |
| POST | `/api/v1/answers` | Submit an answer (goes to BullMQ moderation queue) |
| GET | `/api/v1/answers?authorId=` | Get user's approved answers with question titles |
| PATCH | `/api/v1/answers/:id/vote` | Upvote/downvote an answer |
| PATCH | `/api/v1/questions/faqs/:id/click` | Record FAQ click and increment view count |
| PATCH | `/api/v1/notifications/read` | Mark all notifications as read |
| DELETE | `/api/v1/notifications/:id` | Delete a notification |

### Admin (requires ADMIN role)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/questions` | Questions with pending answers (aggregation) |
| GET | `/api/v1/admin/questions/:id/answers` | All pending answers for a question |
| PATCH | `/api/v1/admin/answers/:id/approve` | Approve answer → creates FAQ (checks semantic dedup) |
| DELETE | `/api/v1/admin/answers/:id` | Reject / delete answer permanently |
| POST | `/api/v1/admin/answers/:id/faq` | Add answer to FAQ without approving |
| GET | `/api/v1/admin/faqs` | List all FAQs (paginated) |
| POST | `/api/v1/admin/faqs` | Create manual FAQ entry |
| PATCH | `/api/v1/admin/faqs/:id` | Edit FAQ question, answer, and tags |
| DELETE | `/api/v1/admin/faqs/:id` | Delete an FAQ |
| GET | `/api/v1/admin/users` | List all users |
| PATCH | `/api/v1/admin/users/:id/role` | Change user role (STUDENT ↔ ADMIN) |

---

## Data Models

### Question
```
_id, title, body, tags[], status (OPEN|ANSWERED|RESOLVED|CLOSED),
upvotes, views, answerCount, authorId, createdAt, updatedAt
```
Text index: `title` + `body` (no array fields — MongoDB text indexes don't support arrays).

### Answer
```
_id, questionId, body, status (PENDING|APPROVED|REJECTED),
isApproved, voteScore, moderationScore, authorId, createdAt, updatedAt
```
Unique compound index: `{ questionId, authorId }` prevents same student answering twice.

### FAQ
```
_id, question, answer, tags[], searchCount,
tfidfTokens[], authorId, createdAt, updatedAt
```
Text index: `question` + `answer`. `tfidfTokens` used for TF-IDF similarity dedup.

### Notification
```
_id, userId, type (string), message, link, isRead, createdAt
```

### Vote
```
_id, userId, targetId, type (UP|DOWN), createdAt
```
Unique index: `{ userId, targetId }`.

---

## Key Conventions

### Normalization
Mongoose uses `_id`, nested `authorId` (populated as subdocument). Frontend types use `id`, flat `author: { id, name }`. Every service normalizes before returning.

```ts
// Backend returns:
{ _id: "...", title: "...", authorId: { _id: "...", name: "Jane" }, tags: [...] }
// Frontend expects:
{ id: "...", title: "...", author: { id: "...", name: "Jane" }, tags: [...] }
```

### Populate paths
Always use field names as defined in models: `authorId`, `questionId`, `userId`. Never `.populate('author')` or `.populate('question')`.

### Question lifecycle
```
OPEN → ANSWERED → RESOLVED | CLOSED
```
- Student posts → `OPEN`
- First answer approved → `ANSWERED` (no new answers accepted)
- Admin resolves → `RESOLVED`
- Admin closes → `CLOSED`

### Answer lifecycle
- Student submits → `PENDING` + BullMQ moderation job enqueued
- BullMQ auto-approves if `action: 'approve'` → FAQ created, student notified, question → `ANSWERED`
- BullMQ flags if `action: 'flag'` → stays `PENDING` in admin queue
- BullMQ rejects if `action: 'reject'` → permanently deleted
- Admin approves → same as auto-approve (FAQ + notification)
- Admin rejects → permanently deleted

---

## Moderation System

`backend/src/ai/moderation.ts` — keyword blocklist with three severity tiers:

| Tier | Score | Action | Examples |
|---|---|---|---|
| BLOCK | 1.0 | Auto-reject + permanent delete | `idiotic`, `buy now at`, `click here to win` |
| HIGH | 0.8 | Flag for admin review (stays PENDING) | `shut up`, `you are stupid`, `ignore all advice` |
| MEDIUM | 0.2–0.5 | Flag for admin review | `idk`, `figure it out yourself`, `get drunk` |

**BullMQ threshold:** `score >= 0.95` → auto-reject (only BLOCK hits reach this).
**Flag range:** `0 < score < 0.95` → answer stays PENDING for admin review.

To add blocked phrases: edit the `BLOCKLISTS` object in `moderation.ts` — no restart needed.

---

## FAQ Similarity Deduplication

When admin approves an answer, `approveAnswer()` runs a TF-IDF cosine similarity check against all existing FAQs:
- `similarity >= 0.40` (40%) → 409 Conflict returned, FAQ **not** created, answer stays PENDING
- `similarity < 0.40` → FAQ created normally

This prevents semantically duplicate FAQ entries (e.g., two Amazon interview questions stored separately).

TF-IDF fingerprints are stored in `FAQ.tfidfTokens` for fast future comparisons.

---

## Running the Project

### Prerequisites
```bash
# Redis (required for BullMQ)
redis-server

# MongoDB Atlas (connection in backend .env)
# Local mongod not needed — project uses Atlas cloud DB
```

### Start backend
```bash
cd backend
npx tsx watch src/index.ts
# API: http://localhost:4000
```

### Start frontend
```bash
cd frontend
npx next dev -p 3000
# App: http://localhost:3000
```

### Seed data
```bash
cd backend
npx tsx scripts/seed.js        # Test users + sample questions
npx tsx scripts/seed-faqs.js   # 132 VINS programme FAQs
```

### Test credentials
| Email | Password | Role |
|---|---|---|
| `venky@gmail.com` | `Test@123` | ADMIN |
| `studenta@test.com` | `Test@123` | STUDENT |
| `studentb@test.com` | `Test@123` | STUDENT |
| `anand2@gmail.com` | `Test@123` | STUDENT |

---

## Admin Panel

Access at `/admin` (requires ADMIN login):

| Route | Description |
|---|---|
| `/admin/dashboard` | Stats, pending queue, activity feed |
| `/admin/questions` | **Merged** — questions with pending answers, expand to see answers, approve/reject per answer |
| `/admin/answers/pending` | Standalone pending answers list (also accessible) |
| `/admin/faqs` | Browse and delete approved FAQs |
| `/admin/users` | Promote/demote users |
| `/admin/analytics` | Platform metrics |
| `/admin/categories` | UI only — no backend (stub) |

---

## Important Fixes (avoid regressing)

### MongoDB text indexes — NO array fields
Text indexes **cannot** include array fields (`tags`). Causes `MongoBulkWriteError`.
- Questions text index: `{ title: 'text', body: 'text' }` only
- FAQs text index: `{ question: 'text', answer: 'text' }` only

### Wrong populate paths
Models use `authorId`, `questionId`, `userId` — NOT `author`, `question`, `user`.
Never use `.populate('author')` or `.populate('question')`.

### Frontend API response shape
- `GET /api/v1/questions` → `{ questions, total, page, limit, totalPages }`
- Always use `res.data.questions`, NOT `res.data.data`

### Mongoose subdocument `.toString()`
Populated subdocuments return `[object Object]` when calling `.toString()`. Use raw document fields (re-fetch with `.select('fieldName')`) or extract `._id.toString()` from the subdocument directly.

### bcrypt `$2a` vs `$2b`
Old hashes from local MongoDB don't work after migrating to Atlas. Reset passwords with a fresh bcrypt hash if login fails after DB migration.

### BullMQ worker calls `approveAnswer()`, not direct DB writes
The moderation worker in `moderateAnswer.ts` must call `approveAnswer()` (the service function) so FAQ creation, question status update, and user notification all fire correctly. Direct `Answer.findByIdAndUpdate()` calls bypass these side-effects.

---

## Known Limitations

- Auth tokens in localStorage (no httpOnly cookie / refresh token rotation)
- Categories page (`/admin/categories`) is UI-only — no backend
- No email/push notifications — BullMQ queues fire but delivery is stubbed/not integrated
- Analytics page shows real counts but no historical chart data

---

## Where to Make Changes

| What | Where |
|---|---|
| New frontend page | `frontend/src/app/(main)/` or `frontend/src/app/(admin)/` |
| New API route | `backend/src/routes/` + wire in `backend/src/index.ts` |
| Business logic | `backend/src/services/` |
| Shared types | `frontend/src/types/index.ts` |
| API client | `frontend/src/lib/api.ts` |
| New Mongoose model | `backend/src/models/` |
| Content moderation | `backend/src/ai/moderation.ts` |
| Design / utils | `frontend/src/lib/utils.ts` |

---

_Last updated: 2026-06-16_