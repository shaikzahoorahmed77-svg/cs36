# SPEC.md — AI-Powered Student Internship Support Platform

## 1. Concept & Vision

A crowd-sourced knowledge platform where students help each other with internship-related questions. The system is **self-improving** — every approved answer feeds back into an instantly-searchable FAQ, making future lookups faster. AI moderates quality, detects duplicates, and surfaces the best answers automatically.

The experience should feel like a knowledgeable peer network — fast, helpful, and quietly intelligent.

---

## 2. Design Language

### Color Palette
```
Primary:       #4F46E5  (Indigo 600 — trustworthy, academic)
Primary Hover: #4338CA  (Indigo 700)
Secondary:     #0EA5E9  (Sky 500 — approachable, fresh)
Accent:        #10B981  (Emerald 500 — success, approved)
Warning:       #F59E0B  (Amber 500 — pending review)
Danger:        #EF4444  (Red 500 — toxic, rejected)
Background:    #F8FAFC  (Slate 50)
Surface:       #FFFFFF
Text Primary:  #0F172A  (Slate 900)
Text Secondary:#475569  (Slate 600)
Border:        #E2E8F0  (Slate 200)
```

### Typography
- Font: `Inter` (Google Fonts) — clean, highly legible, professional
- Headings: `font-weight: 700`, `letter-spacing: -0.025em`
- Body: `font-weight: 400`, line-height `1.6`

### Spacing System
Base unit: `4px`. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`

### Motion
- Page transitions: `opacity 0→1, 200ms ease-out`
- Button hover: `scale(1.02), 150ms ease`
- Skeleton loading: shimmer animation
- Toast notifications: slide-in from top-right

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  App Router │ React Query │ Tailwind CSS │ Auth Context          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Express.js)                         │
│  Routes → Controllers → Services → Repositories                  │
│  Auth │ Questions │ Answers │ Search │ Admin │ Notifications     │
└──────┬────────────┬────────┬────────┬──────────┬────────────────┘
       │            │        │        │          │
   ┌───▼───┐   ┌────▼────┐ ┌─▼────┐ ┌─▼────┐  ┌─▼─────┐
   │Postgres│  │ Redis   │ │BullMQ│ │ AI   │  │pgvec  │
   │Prisma  │  │Cache   │ │Queue │ │Models│  │Search │
   └────────┘  └─────────┘ └──────┘ └──────┘  └────────┘
```

---

## 4. Data Model

### User
```
id           UUID (PK)
email        VARCHAR(255) UNIQUE
passwordHash VARCHAR(255)
name         VARCHAR(100)
role         ENUM('student', 'moderator', 'admin')
avatarUrl    VARCHAR(500) NULL
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
```

### Question
```
id           UUID (PK)
title        VARCHAR(255)
body         TEXT
authorId     UUID (FK → User)
status       ENUM('unresolved', 'resolved', 'duplicate')
embedVector  VECTOR(384)   -- multilingual-e5-base embedding
upvotes      INT DEFAULT 0
views        INT DEFAULT 0
tags         STRING[]
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
resolvedAt   TIMESTAMP NULL
```

### Answer
```
id           UUID (PK)
questionId   UUID (FK → Question)
authorId     UUID (FK → User)
body         TEXT
status       ENUM('pending', 'approved', 'rejected', 'flagged')
upvotes      INT DEFAULT 0
downvotes    INT DEFAULT 0
moderationScore FLOAT  -- toxic-bert score
approvedAt   TIMESTAMP NULL
rejectedAt   TIMESTAMP NULL
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
```

### FAQ (Approved Answer → becomes FAQ)
```
id           UUID (PK)
questionId   UUID (FK → Question)
answerId     UUID (FK → Answer)
title        VARCHAR(255)
body         TEXT
embedVector  VECTOR(384)
tags         STRING[]
searchCount  INT DEFAULT 0
createdAt    TIMESTAMP
```

### Vote
```
id           UUID (PK)
userId       UUID (FK → User)
questionId   UUID (FK → Question) NULL
answerId     UUID (FK → Answer) NULL
value        SMALLINT (-1 or +1)
createdAt    TIMESTAMP
UNIQUE(userId, questionId)
UNIQUE(userId, answerId)
```

### Notification
```
id           UUID (PK)
userId       UUID (FK → User)
type         ENUM('answer_received', 'answer_approved', 'faq_published', 'upvote_milestone', 'review_needed')
referenceId  UUID  -- related question/answer ID
read         BOOLEAN DEFAULT false
createdAt    TIMESTAMP
```

---

## 5. API Routes

### Auth
```
POST   /api/auth/register        -- Create account
POST   /api/auth/login           -- Get JWT
POST   /api/auth/refresh         -- Refresh token
POST   /api/auth/logout          -- Invalidate token
GET    /api/auth/me              -- Current user
```

### Questions
```
GET    /api/questions            -- List questions (paginated, filterable)
POST   /api/questions            -- Ask a question
GET    /api/questions/:id        -- Get question + answers
PATCH  /api/questions/:id        -- Update question
DELETE /api/questions/:id        -- Delete (author/admin)
GET    /api/questions/:id/answers-- Get answers for question
```

### Answers
```
POST   /api/answers              -- Submit answer
PATCH  /api/answers/:id          -- Edit answer
DELETE /api/answers/:id          -- Delete (author/admin)
POST   /api/answers/:id/upvote   -- Toggle upvote
POST   /api/answers/:id/downvote -- Toggle downvote
```

### Search
```
GET    /api/search?q=...&limit=5 -- Semantic FAQ search
GET    /api/search/duplicates    -- Check duplicates for new question
```

### Admin
```
GET    /api/admin/pending-answers -- List answers awaiting review
POST   /api/admin/answers/:id/approve
POST   /api/admin/answers/:id/reject
GET    /api/admin/stats           -- Dashboard stats
POST   /api/admin/moderators      -- Promote user to moderator
```

### Notifications
```
GET    /api/notifications         -- User's notifications
PATCH  /api/notifications/:id     -- Mark as read
POST   /api/notifications/read-all
```

---

## 6. AI Pipeline

### 6.1 Semantic Embedding (multilingual-e5-base)
- Runs on: question submit, answer approve, FAQ create
- Vector dimension: 384
- Stored in: `Question.embedVector`, `FAQ.embedVector`
- Endpoint: `/embed` service using HuggingFace Inference API or local Transformers.js

### 6.2 Semantic Search
- Method: pgvector `cosine_distance` similarity search
- Threshold: `< 0.25` → likely duplicate / return existing FAQ answer
- Flow: student asks → search FAQs → if match found return instantly

### 6.3 Duplicate Detection
- On question submit: compute embedding, search against all unresolved questions
- If similarity > `0.85` with another unresolved question → flag as potential duplicate
- Suggest: "Did you mean this question?" with link

### 6.4 Content Moderation (toxic-bert)
- On answer submit: run toxic-bert inference
- Score `> 0.7` → auto-reject with explanation
- Score `0.4–0.7` → flag for moderator review
- Score `< 0.4` → auto-approve

---

## 7. Queue Jobs (BullMQ + Redis)

### Queues
```
- embed-queue     priority: high
- moderation-queue  priority: high
- notification-queue  priority: medium
- stats-queue     priority: low
- cleanup-queue   priority: low
```

### Jobs

**embed-queue**
- `embed-question`: generate + store vector for new question
- `embed-answer`: generate + store vector when answer approved → becomes FAQ

**moderation-queue**
- `moderate-answer`: run toxic-bert, update answer status

**notification-queue**
- `send-notification`: email/push for answer_received, approved, etc.

**stats-queue**
- `update-question-views`: increment view count (debounced)
- `recalculate-rankings`: update trending scores

---

## 8. Redis Caching

```
faq:search:<query_hash>    → cached search results (TTL: 5min)
user:session:<userId>      → session data
question:views:<questionId> → view counter buffer
rate:limit:<userId>        → request rate limiter
```

---

## 9. Frontend Pages

```
/                           → Landing page
/login                      → Login
/register                   → Register

/questions                  → Question feed (filterable)
/questions/ask              → Ask a new question
/questions/[id]             → Question detail + answers

/search?q=...               → Search results

/profile                    → My questions & answers
/notifications              → Notification center

/admin                      → Admin dashboard
/admin/pending              → Review queue
/admin/faqs                 → Manage FAQs
/admin/analytics            → Stats
```

---

## 10. Security

- JWT access tokens (15min) + refresh tokens (7 days, stored in httpOnly cookie)
- Rate limiting: 100 req/min per IP, 10 question submits/hour per user
- Input validation: Zod schemas on all endpoints
- SQL injection: prevented by Prisma ORM
- XSS: React escapes by default; sanitize user HTML if rich text allowed
- RBAC: role-based middleware on admin routes
- CORS: whitelist only frontend origin

---

## 11. Tech Versions

```
Node.js:       v20+
Next.js:       v14+ (App Router)
TypeScript:    v5+
Tailwind CSS:  v3+
Express:       v4+
Prisma:        v5+
pgvector:      (Postgres extension)
Redis:         v7+
BullMQ:        v5+
pg:            v8+
```