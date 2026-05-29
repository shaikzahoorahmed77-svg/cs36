# Frontend Architecture — AI Internship Support Platform

## Design System
- **Colors:** Indigo primary (#4F46E5), Sky secondary (#0EA5E9), Emerald success (#10B981), Amber warning (#F59E0B), Red danger (#EF4444), Slate backgrounds
- **Font:** Inter (Google Fonts) — clean, academic, professional
- **Icons:** Lucide React — consistent, lightweight
- **Components:** shadcn/ui (Radix primitives + Tailwind)
- **Layout:** App Router with route groups, sidebar navigation, responsive

## Route Groups
```
(auth)           → Public routes (no auth required)
(main)           → Authenticated student routes
(admin)          → Admin-only routes
```

## Page Hierarchy

### Public (unauthenticated)
| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero, features, how it works, CTA |
| Login | `/login` | Email + password login |
| Register | `/register` | New account creation |
| Forgot Password | `/forgot-password` | Password reset flow |

### Student (authenticated)
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | My questions, activity, quick stats |
| FAQ Search | `/search?q=...` | Semantic search with instant results |
| Ask Question | `/questions/ask` | Submit new question |
| Question Detail | `/questions/[id]` | View question, answers, submit answer |
| My Questions | `/questions` (filtered) | List of user's questions |
| Notifications | `/notifications` | Notification center |
| Profile | `/profile` | View/edit profile |
| Settings | `/settings` | Account settings |

### Admin
| Page | Route | Purpose |
|------|-------|---------|
| Admin Dashboard | `/admin/dashboard` | Overview stats, pending queue |
| Question Review | `/admin/questions/pending` | Review flagged/duplicate questions |
| Answer Review | `/admin/answers/pending` | Moderate community answers |
| FAQ Management | `/admin/faqs` | Edit/remove approved FAQs |
| Category Management | `/admin/categories` | Manage tags/categories |
| User Management | `/admin/users` | Manage users, assign roles |
| Analytics | `/admin/analytics` | Platform metrics, charts |

## Key Components
- **Navbar** — logo, search bar, notifications bell, user avatar dropdown
- **Sidebar** — collapsible nav for (main) and (admin) layouts
- **QuestionCard** — title, excerpt, tags, stats (votes, answers, views), status badge
- **AnswerCard** — body, author, votes, status badge, action buttons
- **FAQCard** — question + approved answer, helpful mark
- **SearchBar** — live search with instant results dropdown
- **NotificationBell** — unread count badge
- **StatCard** — metric + trend indicator
- **DataTable** — sortable, filterable admin tables
- **ModerationBadge** — pending/approved/rejected/flagged status
- **RichTextEditor** — for question and answer bodies
- **VoteButtons** — upvote/downvote with count
- **EmptyState** — illustrated empty states per page
- **Toast** — success/error notifications

## API Integrations
- `POST /api/auth/login` — authenticate
- `POST /api/auth/register` — create account
- `GET /api/auth/me` — current user
- `GET /api/questions` — paginated questions list
- `POST /api/questions` — create question
- `GET /api/questions/:id` — question detail
- `GET /api/search?q=` — semantic search
- `POST /api/answers` — submit answer
- `POST /api/answers/:id/upvote`
- `GET /api/notifications`
- `PATCH /api/notifications/:id`
- Admin: `GET/PATCH/POST` on all admin endpoints