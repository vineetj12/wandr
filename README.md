# Wandr ✈ — AI Travel Planner

> Plan your perfect trip in seconds with the power of Gemini AI.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![Node](https://img.shields.io/badge/Node.js-Express-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue) ![Gemini](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue)

---

##  Overview

**Wandr** is a production-quality, multi-user AI travel planning web app. Users describe where they want to go, how many days, their budget, and interests — and Gemini AI instantly generates a complete day-by-day itinerary with activities, hotel suggestions, and budget estimates.

### Features
-  JWT auth with bcrypt (register/login)
-  AI-generated full trip itineraries (Gemini 1.5 Flash)
-  Day-by-day activity cards with drag-and-drop reorder
-  AI budget estimation per category
-  Hotel recommendations by tier (Budget / Mid-range / Luxury)
-  Regenerate a single day with custom instructions
-  **Travel Buddy Chat** — in-app AI assistant with your itinerary as context
-  Fully responsive (mobile / tablet / desktop)
-  Dark mode ready
-  Per-user data isolation — every query scoped to authenticated userId

---

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR, routing, type safety |
| Backend | Node.js + Express | Lightweight, flexible |
| Database | PostgreSQL | Relational data with JSONB for itinerary blobs |
| AI | Google Gemini 1.5 Flash | Generous free tier, fast, reliable JSON output |
| Auth | JWT + bcrypt | Stateless, scalable |
| UI Generation | Stitch MCP | Rapid high-fidelity screen scaffolding |

---

##  Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local or managed)
- Google Gemini API key ([Get one free](https://makersuite.google.com/app/apikey))

### Backend

```bash
cd backend
npm install

# Copy and fill in your secrets
cp .env.example .env

npm run dev   # starts on port 5000
```

**`backend/.env`:**
```
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=postgresql://user:password@localhost:5432/wandr
JWT_SECRET=your_32_char_random_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install

# Copy and set API URL
cp .env.local.example .env.local

npm run dev   # starts on port 3000
```

**`frontend/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                  │
│  /login  /dashboard  /trips/new  /trips/:id         │
│  AuthContext → JWT stored in localStorage           │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (Bearer JWT)
┌─────────────────────▼───────────────────────────────┐
│                  Express Backend                    │
│  /api/auth  /api/trips  /api/ai  /api/chat          │
│  protect middleware → verifies JWT on every request │
└───────────┬─────────────────────────┬───────────────┘
            │                         │
┌───────────▼──────────┐  ┌──────────▼──────────────┐
│      PostgreSQL      │  │    Google Gemini API     │
│  users + trips table │  │  gemini-1.5-flash model  │
│  user_id on each row │  │  JSON mode (mime type)   │
│  JSONB itinerary data│  │  Context injection chat  │
└──────────────────────┘  └─────────────────────────┘
```

---

##  Auth & Security

- Passwords hashed with **bcrypt (12 rounds)** before storage
- **JWT** signed with a secret, 7-day expiry
- `protect` middleware verifies token on **every** protected route
- **Every single trip DB query** includes `userId: req.user._id` — users can never access others' data
- Ownership pattern: `Trip.findOne({ _id, userId })` — returns 404 for unauthorized access

---

##  AI Agent Design

### Itinerary Generation
- Prompt engineering enforces **strict JSON schema** using `responseMimeType: "application/json"`
- Schema includes days array, activities, budget breakdown, hotel recommendations
- Server-side prompt construction — destination/budget/interests injected securely

### Day Regeneration
- Only the target day JSON is sent as context, minimizing tokens
- User instructions (e.g. "more outdoor activities") appended to prompt
- Result patches only the specific day in the existing itinerary

### Travel Buddy Chat
- Full trip itinerary JSON injected as context per request (stateless)
- 150-word response limit enforced in prompt
- No conversation history stored — each message is independent
- Keeps responses focused and fast

---

##  Custom Feature: Travel Buddy Chat

**Problem it solves:** After generating an itinerary, users have follow-up questions — "Is this area walkable?", "Vegan options near Day 2?", "What to pack?" — that don't require regenerating the whole trip.

**How it works:**
1. User clicks the ✦ FAB on the itinerary page
2. Chat drawer slides in (380px, full-height)
3. User types or taps a quick-reply chip
4. Frontend sends `{ message, tripId }` to `POST /api/chat`
5. Backend fetches the trip (ownership verified), injects full itinerary JSON into Gemini prompt
6. Gemini returns a concise, context-aware answer
7. Response rendered with markdown support (bold, bullet lists)

---

##  Known Limitations

- No streaming responses (responses appear all at once after generation)
- Hotel suggestions are AI-generated estimates, not real-time availability data
- No image support in chat
- No persistent chat history (each message is stateless)
- PDF export is UI-only (not yet wired to a PDF library)

---

##  Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel — connect GitHub, auto-deploy on push |
| Backend | Railway or Render — add env vars in dashboard |
| Database | PostgreSQL (managed service recommended) |

**Never commit `.env` files — use platform environment variable settings.**

---

