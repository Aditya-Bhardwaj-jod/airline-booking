# ✈ SkyBook — Production-Grade Airline Booking System

A full-stack airline ticket booking system inspired by MakeMyTrip's flight module. Built to demonstrate production-grade backend architecture with custom Redis-based rate limiting and seat locking.

---

## Architecture

```
Client (React + Vite)
        │
        ▼
Express API (Node.js)
        │
   ┌────┴────┐
   │         │
MongoDB    Redis
(Bookings) (Cache + Rate Limiter + Seat Lock)
```

### Request Flow
```
Route → Middleware (optionalAuth → rateLimiter → validate) → Controller → Service → Repository → DB
```

---

## Key Features & USPs

| Feature | Implementation |
|---|---|
| **Custom Sliding Window Rate Limiter** | Redis Sorted Sets + atomic Lua script (no `express-rate-limit`) |
| **Redis Seat Lock** | `SET NX EX` atomic lock, 5-min TTL, Lua-based release |
| **MongoDB Transactions** | Multi-seat bookings + cancellations are fully atomic |
| **Clean Layered Architecture** | Routes → Controller → Service → Repository (strict separation) |
| **JWT Auth** | httpOnly cookie (XSS-safe) + Bearer token support |
| **Flight Search Cache** | Redis TTL cache with pattern-based invalidation on admin update |
| **Swagger Docs** | Full OpenAPI 3.0 at `/api/docs` |
| **Docker** | Single `docker compose up` starts Node + MongoDB (replica set) + Redis |

---

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, React Router, Axios

**Backend:** Node.js, Express.js

**Database:** MongoDB (Mongoose) — single-node replica set for transaction support

**Cache / Lock / Rate Limit:** Redis (ioredis)

**Auth:** JWT (httpOnly cookie), bcryptjs, Role-based (user / admin)

**Docs:** Swagger (swagger-jsdoc + swagger-ui-express)

**Logging:** Winston + Morgan

**Testing:** Jest + Supertest

**DevOps:** Docker, Docker Compose

---

## Project Structure

```
airline-booking/
├── client/                    # React frontend
│   └── src/
│       ├── context/           # AuthContext (global user state)
│       ├── components/        # Navbar, ProtectedRoute
│       ├── pages/             # Home, FlightResults, SeatSelection, Booking, Admin
│       └── lib/api.js         # Axios instance (base URL + interceptors)
│
├── server/
│   └── src/
│       ├── config/            # env, db, redisClient, logger
│       ├── routes/            # authRoutes, flightRoutes, bookingRoutes
│       ├── middlewares/       # auth, rateLimiter, validate, errorHandler
│       ├── controllers/       # thin layer, calls services
│       ├── services/          # business logic
│       ├── repositories/      # Mongoose queries only
│       ├── models/            # User, Airport, Airline, Flight, Booking
│       ├── redis/             # cache.js, rateLimiter.js, seatLock.js
│       ├── validators/        # Joi schemas
│       ├── utils/             # jwt.js, pnr.js
│       ├── swagger/           # OpenAPI config
│       └── tests/             # Jest + Supertest
│
├── docker/
│   └── mongo-init.js          # Replica set bootstrap
└── docker-compose.yml
```

---

## Getting Started

### With Docker (Recommended)

```bash
git clone https://github.com/Aditya-Bhardwaj-jod/airline-booking
cd airline-booking

# Copy env file
cp server/.env.example server/.env

# Start everything
docker compose up --build
```

- API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs
- Frontend: http://localhost:5173 (run separately, see below)

### Without Docker

**Prerequisites:** Node 20+, MongoDB (with replica set), Redis

```bash
# Backend
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | — (required) |
| `JWT_SECRET` | JWT signing secret | — (required) |
| `JWT_EXPIRES_IN` | Token expiry | `15m` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `RATE_LIMIT_WINDOW_SEC` | Rate limit window | `60` |
| `RATE_LIMIT_GUEST` | Guest req/window | `20` |
| `RATE_LIMIT_USER` | User req/window | `100` |
| `SEAT_LOCK_TTL_SEC` | Seat lock duration | `300` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:5173` |

---

## API Documentation

Full Swagger UI available at: **`http://localhost:5000/api/docs`**

### Key Endpoints

```
POST   /api/auth/signup              Register
POST   /api/auth/login               Login (sets httpOnly cookie)

GET    /api/flights/search           Search flights (cached, rate limited)
GET    /api/flights/airports         Airport list (cached 1hr)
GET    /api/flights/:id/seats        Live seat map (Redis lock status)

POST   /api/bookings/lock-seat       Acquire Redis seat lock (5 min)
POST   /api/bookings                 Confirm booking (MongoDB transaction)
GET    /api/bookings/my              Booking history
PATCH  /api/bookings/:id/cancel      Cancel booking
```

---

## Sliding Window Rate Limiter — How It Works

```
Every request:
1. ZREMRANGEBYSCORE key -inf (now - windowMs)   ← slide window
2. ZCARD key                                     ← count requests in window
3. if count < limit: ZADD key now uniqueId       ← allow + record
   else: reject with HTTP 429                    ← deny
4. EXPIRE key windowSec                          ← memory hygiene
```

All 4 operations run inside a **Lua script** for atomicity — no race conditions between concurrent requests.

**Why Sliding Window > Fixed Window:** Fixed window resets at clock boundaries — a user can send 2× limit in 2 seconds by bursting at `0:59` and `1:00`. Sliding window has no reset boundary to exploit.

---

## Seat Locking — How It Works

```
User selects seat 12A:
  SET seat:lock:flightId:12A userId EX 300 NX
  → 'OK'  (lock acquired, only this user can book)
  → null  (seat already locked by someone else → 409)

Other users see: "Temporarily Reserved"

User confirms booking:
  → MongoDB transaction: seat.isBooked = true
  → Release Redis lock (Lua atomic check-and-delete)

If user abandons:
  → Redis TTL auto-expires after 5 min, seat freed automatically
```

---

## Running Tests

```bash
cd server
npm test
```

Tests cover: Auth (signup, login, error cases) + Rate Limiter algorithm (allow, block, window slide)

---

## Future Improvements (Phase 2)

- [ ] BullMQ queue for async booking processing
- [ ] Email notifications (booking confirmed/cancelled)
- [ ] PDF ticket download
- [ ] Refresh tokens
- [ ] Rate limiter analytics dashboard (Socket.IO live graphs)
- [ ] International timezone support
- [ ] Payment gateway integration

---

## Author

**Aditya Bhardwaj** — [GitHub](https://github.com/Aditya-Bhardwaj-jod)
