# Product Specification & Report: InternFAQ
## AI-Powered Student Internship Support Platform

---

## 1. Executive Summary
**InternFAQ** is a specialized crowd-sourced knowledge sharing and automated FAQ curation platform designed to bridge the information gap for Computer Science students preparing for internships. The core innovation of InternFAQ is its **Self-Improving FAQ Loop**: community-submitted answers are screened by an automated AI pipeline and, upon admin validation, are instantly synthesized into a searchable, semantically-indexed FAQ database. This creates a scalable ecosystem that drastically reduces manual administration overhead while ensuring that students get immediate, verified answers to repeat queries.

---

## 2. Problem Statement & Solution

### The Problem
* **Information Fragmentation**: Students rely on scattered, unverified resources (Reddit, Glassdoor, Discord, personal blogs) to find internship feedback and prep strategies.
* **Response Latency & Redundancy**: Program coordinators and administrators waste time answering identical questions every semester, leaving students waiting days for custom replies.
* **Spam & Toxic Content**: Unmoderated forums frequently suffer from spam, irrelevant advertising, or aggressive behavior, which deteriorates the learning environment.

### The Solution
* **Verified FAQ Synthesis**: Turns high-quality community contributions directly into platform-wide FAQs upon admin approval.
* **Intelligent Moderation & Safeguards**: Uses an automated NLP pipeline (keyword blocklist + moderation queues) to flag or block toxic submissions before they reach public feeds.
* **Semantic Deduplication**: Compares new answers against existing FAQs using TF-IDF cosine similarity to block duplicate entries and keep the repository clean.
* **Real-Time Responsiveness**: Combines real-time analytics dashboards, click tracking, and polling notifications so students and admins stay perfectly synchronized.

---

## 3. Core Platform Features

### 3.1 Student Experience
* **Instant Semantic Search**: A fast search interface that lets students query the FAQ knowledge base. Clicking a result card opens a detailed modal, increments the search count (`VIEWS`), and updates stats in real-time.
* **Community Q&A Feed**: Students can browse open questions, submit detailed answers, and upvote/downvote contributions to signal quality.
* **Moderation Transparency**: Submitted answers are visible immediately on the question details page with a **"Pending Approval"** badge, ensuring immediate access to potential answers while clearly marking them as unverified.
* **Real-Time Analytics Dashboard**: Displays platform-wide statistics in real-time, including:
  * Total Questions Asked
  * Total Answers Submitted
  * Platform-wide FAQ Views
  * Community Resolution Rates
* **Dynamic Notification Center**: Retrieves notifications from the backend with 15-second polling, alerting students instantly when their answers are approved, published, or rejected.

### 3.2 Administrator Suite
* **Unified Admin Dashboard**: A high-level control panel containing key administrative metrics, user role management, and quick navigation shortcuts.
* **Answer Review Pipeline**: Allows admins to expand any question with pending answers, check automated moderation flags, and approve or reject submissions with a single click.
* **Real-Time Admin Alerts**: Immediate notifications for administrative events such as `NEW_QUESTION_ASKED` and `NEW_ANSWER_PENDING` to ensure rapid turnaround.
* **Manual FAQ Management**: Full CRUD interface enabling admins to manually create, edit, or delete FAQ questions, answers, and tags directly from the portal without needing a community question.
* **User Management**: Capabilities to promote students to admin roles or demote administrators to maintain secure access control.

---

## 4. System Architecture & Tech Stack

InternFAQ is built on a decoupled, three-tier service architecture designed for high availability, fast response times, and asynchronous background processing:

```
                  ┌─────────────────────────────────────────┐
                  │           FRONTEND (Next.js)            │
                  │   App Router · TS · Tailwind · Lucide   │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS (REST API)
                  ┌────────────────────▼────────────────────┐
                  │          BACKEND API (Express)          │
                  │     Routes · Controllers · Services     │
                  └──────┬──────────┬──────────┬──────────┬─┘
                         │          │          │          │
                     ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
                     │MongoDB│  │ Redis │  │BullMQ │  │TF-IDF │
                     │Atlas  │  │ Cache │  │ Queue │  │Search │
                     └───────┘  └───────┘  └───────┘  └───────┘
```

* **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, and React Query.
* **Backend**: Node.js, Express.js, JWT Authentication, and Mongoose ODM.
* **Database**: MongoDB Atlas cloud instance with text indexes optimized for full-text search.
* **Cache & Background Tasks**: Redis and BullMQ (manages asynchronous moderation and notification workers in separate processes).

---

## 5. Intelligent AI & NLP Pipeline

```
                     [ Student Submits Answer ]
                                 │
                                 ▼
                     ( Enqueue to BullMQ Queue )
                                 │
                                 ▼
                    [ Run Keyword Moderation ]
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ Score = 1.0           │ Score = 0.2 - 0.95    │ Score = 0.0
         ▼                       ▼                       ▼
   (Auto-Reject)            (Flag Stays)           (Auto-Approve)
  Permanently Deleted     Pending Admin Review   Instantly Approved
```

### 5.1 Automated Content Moderation
On answer submission, a BullMQ job runs a keyword-based moderation algorithm categorized into three tiers:
1. **BLOCK (Score: 1.0)**: Catches severe profanity, spam links, and hostile text. Automatically rejects the answer and deletes it.
2. **HIGH (Score: 0.8)**: Flags suspicious phrasing for manual admin review.
3. **MEDIUM (Score: 0.2 - 0.5)**: Flags helpful but potentially subjective content.
* *BullMQ Auto-Reject threshold:* Submissions with a score $\ge 0.95$ are rejected automatically. Scores $< 0.95$ stay in the queue as `PENDING` for admin review.

### 5.2 Cosine Similarity Deduplication
To prevent duplicate FAQ entries (e.g., two identical preparation questions for the same company), the platform runs a **TF-IDF Cosine Similarity** check when an answer is approved:
* If the similarity between the proposed answer and any existing FAQ is $\ge 40\%$ (`0.40`), the system blocks creation and returns a `409 Conflict` error to the admin.
* This keeps the FAQ database clean and ensures search queries return highly distinct, relevant results.

---

## 6. Database Schema Summary

### User Schema
* **Fields**: `_id`, `email` (Unique), `passwordHash`, `name`, `role` (`STUDENT` | `ADMIN`), `avatarUrl`, `createdAt`, `updatedAt`

### Question Schema
* **Fields**: `_id`, `title`, `body`, `authorId` (FK $\rightarrow$ User), `status` (`OPEN` | `ANSWERED` | `RESOLVED` | `CLOSED`), `upvotes`, `views`, `tags` (String Array), `createdAt`, `updatedAt`
* **Text Index**: `{ title: "text", body: "text" }` for fast full-text searching.

### Answer Schema
* **Fields**: `_id`, `questionId` (FK $\rightarrow$ Question), `authorId` (FK $\rightarrow$ User), `body`, `status` (`PENDING` | `APPROVED` | `REJECTED`), `voteScore`, `moderationScore`, `createdAt`, `updatedAt`
* **Compound Index**: Unique index on `{ questionId, authorId }` to prevent duplicate submissions from the same student.

### FAQ Schema
* **Fields**: `_id`, `question`, `answer`, `tags` (String Array), `searchCount`, `tfidfTokens` (TF-IDF tokens array), `authorId`, `createdAt`, `updatedAt`
* **Text Index**: `{ question: "text", answer: "text" }` for semantic searches.

### Notification Schema
* **Fields**: `_id`, `userId` (FK $\rightarrow$ User), `type` (e.g., `answer_approved`, `NEW_QUESTION_ASKED`, `NEW_ANSWER_PENDING`), `message`, `link`, `isRead`, `createdAt`

---

## 7. Key API Routes

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | Register a new account |
| **POST** | `/api/v1/auth/login` | Public | Log in and receive JWT access token |
| **GET** | `/api/v1/questions` | Public | List and search open community questions |
| **GET** | `/api/v1/questions/:id` | Public | Get single question details along with all answers |
| **POST** | `/api/v1/questions` | Student | Ask a new community question |
| **POST** | `/api/v1/answers` | Student | Submit an answer to a question (enters moderation queue) |
| **PATCH** | `/api/v1/answers/:id/vote` | Student | Upvote or downvote an answer |
| **PATCH** | `/api/v1/questions/faqs/:id/click` | Student | Record FAQ click and increment view counts |
| **GET** | `/api/v1/notifications` | Student | Retrieve user notifications (polled every 15s) |
| **GET** | `/api/v1/admin/questions` | Admin | Retrieve questions that have pending answers |
| **PATCH** | `/api/v1/admin/answers/:id/approve` | Admin | Approve an answer, triggering FAQ creation and user alerts |
| **DELETE** | `/api/v1/admin/answers/:id` | Admin | Reject and permanently delete an answer |
| **POST** | `/api/v1/admin/faqs` | Admin | Create a manual FAQ entry |
| **PATCH** | `/api/v1/admin/faqs/:id` | Admin | Edit an FAQ's question, answer text, or tags |
| **DELETE** | `/api/v1/admin/faqs/:id` | Admin | Delete an FAQ entry |
| **PATCH** | `/api/v1/admin/users/:id/role` | Admin | Demote/promote user roles |

---

## 8. Security & Integrity Safeguards
* **Token-Based Authentication**: Custom JWT verification middleware secures API routes.
* **Role-Based Access Control (RBAC)**: Route-level middleware ensures only authorized admins can perform moderation, manual FAQ editing, and user role updates.
* **NoSQL Injection Defenses**: Mongoose schema sanitization and strict input validation prevent injection vectors.
* **Clean Data Lifecycles**: Strict compound indices prevent duplicate answer spam, and transaction-like services verify that FAQs are created only when the underlying answer is successfully approved.

---

## 9. Development Team Directory

| Name | Role | Email |
| :--- | :--- | :--- |
| **Venkatesh Buddhi** | Team Lead | [venkateshbuddhi887@gmail.com](mailto:venkateshbuddhi887@gmail.com) |
| **Neha Korrapati** | Developer | [korrapatineha9@gmail.com](mailto:korrapatineha9@gmail.com) |
| **Peyala Ananda Naidu** | Developer | [anandanaidupeyala@gmail.com](mailto:anandanaidupeyala@gmail.com) |
| **Chavali Chandan Kumar** | Developer | [chandanchavali@gmail.com](mailto:chandanchavali@gmail.com) |
| **Manogna Biyya** | Developer | [manognampt@gmail.com](mailto:manognampt@gmail.com) |
| **Deepthi Penugonda** | Developer | [penugondadeepthi6@gmail.com](mailto:penugondadeepthi6@gmail.com) |
| **K Rohith** | Developer | [kudimirohith@gmail.com](mailto:kudimirohith@gmail.com) |
| **G. Teja Sri** | Developer | [gogulatejasri@gmail.com](mailto:gogulatejasri@gmail.com) |
| **Chandragiri Sai Tharun** | Developer | [chandragirisaitharun71@gmail.com](mailto:chandragirisaitharun71@gmail.com) |
| **Boeni Poojitha** | Developer | [boenipoojitha@gmail.com](mailto:boenipoojitha@gmail.com) |
| **Shaik Mohammed Zahoor Ahmed** | Developer | [shaikzahoorahmed.77@gmail.com](mailto:shaikzahoorahmed.77@gmail.com) |
| **Sneha Rawat** | Developer | [sneharawat055@gmail.com](mailto:sneharawat055@gmail.com) |
