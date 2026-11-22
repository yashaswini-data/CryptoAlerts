# CryptoAlerts — Real-Time Cryptocurrency Price Monitoring & Alert Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://www.mongodb.com/)
[![RabbitMQ](https://img.shields.io/badge/Message_Broker-RabbitMQ-FF6600.svg)](https://www.rabbitmq.com/)
[![Jest Tests](https://img.shields.io/badge/Tests-25%20Passed-brightgreen.svg)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

CryptoAlerts is an enterprise-grade cryptocurrency price monitoring and alert notification platform built from scratch. It allows cryptocurrency traders and investors to track real-time digital asset valuations, establish automated **ABOVE** or **BELOW** price threshold conditions, and receive instant notifications dispatched through an asynchronous RabbitMQ message queue.

Designed with clean system separation, atomic database transactions, rate-limited external API consumption, and a sleek dark navy financial dashboard UI.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Environment Variables](#environment-variables)
8. [Installation & Setup](#installation--setup)
9. [Running the Application](#running-the-application)
10. [Scheduled Price Monitoring (Node-Cron)](#scheduled-price-monitoring-node-cron)
11. [Event Processing & RabbitMQ Worker](#event-processing--rabbitmq-worker)
12. [Testing & Verification](#testing--verification)
13. [Deployment Guide](#deployment-guide)
14. [Future Enhancements](#future-enhancements)

---

## Problem Statement

Cryptocurrency markets operate 24 hours a day, 7 days a week, characterized by extreme volatility and sudden price movements. Traders cannot continuously monitor order books without fatigue, leading to missed profit targets or failure to execute risk mitigation stop-losses. 

Many simple alert projects rely on naive frontend polling or mock data loops, creating high server load, redundant external API requests (triggering rate limit blocks), and brittle in-memory states vulnerable to crashes.

**CryptoAlerts solves this with an event-driven architecture:**
- **Centralized Batch Fetching**: Eliminates per-user API calls by aggregating unique coins across all active alerts into unified batch requests.
- **Atomic Trigger State Machine**: Guards against race conditions so alerts trigger exactly once.
- **Asynchronous Decoupling**: Offloads notification creation to RabbitMQ with manual acknowledgments and dead-letter queue (DLQ) reliability.
- **Fail-Safe In-Memory Caching**: Absorbs CoinGecko free-tier rate limits (HTTP 429) while preserving full platform accessibility.

---

## Key Features

- **JWT Authentication & Security**: Secure bcrypt password hashing, JWT bearer tokens, Helmet security headers, CORS origin whitelisting, and strict request rate limiting.
- **Live Cryptocurrency Market Data**: Integration with CoinGecko's REST API for Bitcoin, Ethereum, Solana, BNB, XRP, Dogecoin, Cardano, Avalanche, Polkadot, and Chainlink.
- **Interactive Price Visualizations**: Historical price movement charts rendered via Recharts across configurable intervals (24H, 7D, 30D, 90D, 1Y).
- **Flexible Alert Thresholds**: Configure `ABOVE` or `BELOW` conditions with real-time percentage offset calculations against current market rates.
- **Complete Alert Lifecycle**: Create, pause, resume, edit target prices or conditions, and delete alerts with strict user-level authorization.
- **RabbitMQ Message Pipeline**: Asynchronous message dispatching, durable queues (`crypto-alert-notifications`), DLQ routing (`crypto-alert-notifications-dlq`), and independent worker execution.
- **Guaranteed Idempotency**: Unique event identifiers (`eventId`) prevent duplicate notification generation on network retries.
- **Notification Inbox**: Track notification history, filter unread alerts, and toggle single or bulk read statuses.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Recharts, Lucide React, Modern CSS3 |
| **Backend** | Node.js, Express.js REST APIs, express-validator, express-rate-limit, Helmet, CORS |
| **Database** | MongoDB & Mongoose ODM (with indexes and partial unique constraints) |
| **Message Broker** | RabbitMQ (AMQP 0-9-1) with dead-letter exchange and durable queues |
| **Scheduled Jobs** | Node-Cron for scheduled background price checking |
| **External API** | CoinGecko API (with intelligent caching and batch request grouping) |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs |
| **Testing** | Jest, Supertest, MongoDB In-Memory Server |
| **Containerization** | Docker & Docker Compose |

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React + Vite)"]
        UI["Dashboard & Market Views"]
        AuthUI["JWT Auth Context"]
        ChartUI["Recharts Visualizer"]
    end

    subgraph BackendAPI["Backend API Server (Express.js)"]
        Routes["REST Endpoints (/api/auth, /api/alerts, /api/coins, /api/notifications)"]
        AuthMW["JWT Auth Middleware & Validators"]
        Cache["In-Memory Price & Chart Cache (TTL 60s)"]
    end

    subgraph External["External Services"]
        CG["CoinGecko REST API v3"]
    end

    subgraph Engine["Background Cron Engine (Node-Cron)"]
        CronJob["Price Monitor Job (Every 30s)"]
        Evaluator["Condition Evaluator (ABOVE / BELOW)"]
        AtomicUpdate["Atomic State Transition (ACTIVE -> TRIGGERED)"]
    end

    subgraph Queue["Message Broker (RabbitMQ)"]
        Exchange["crypto-alerts-exchange (Direct)"]
        QueueMain["crypto-alert-notifications (Durable)"]
        QueueDLQ["crypto-alert-notifications-dlq (DLQ)"]
    end

    subgraph Worker["Consumer Worker (worker.js)"]
        Consumer["RabbitMQ Consumer Channel"]
        Validator["Payload Validator & Deduplicator"]
        Ack["Manual Channel ACK / NACK"]
    end

    subgraph Database["Database (MongoDB)"]
        UserCol[("Users Collection")]
        AlertCol[("Alerts Collection")]
        HistoryCol[("PriceHistory Collection")]
        NotifCol[("Notifications Collection")]
    end

    UI -->|HTTP Requests / Bearer JWT| Routes
    Routes --> AuthMW
    AuthMW --> Database

    CronJob -->|1. Fetch ACTIVE Alerts| AlertCol
    CronJob -->|2. Batch Request Distinct Coins| Cache
    Cache -->|Cache Miss / TTL Expire| CG
    CronJob -->|3. Record Price Snapshots| HistoryCol
    CronJob -->|4. Test Thresholds| Evaluator
    Evaluator -->|5. Condition Satisfied| AtomicUpdate
    AtomicUpdate -->|6. Update Status| AlertCol
    AtomicUpdate -->|7. Publish Trigger Event| Exchange

    Exchange --> QueueMain
    QueueMain -->|Prefetch 1 Message| Consumer
    QueueMain -.->|On Max Retries| QueueDLQ
    Consumer --> Validator
    Validator -->|8. Create Notification Record (Idempotent)| NotifCol
    Validator -->|9. Acknowledge Message| Ack

    Routes -->|Read Notifications| NotifCol
    Routes -->|Read Market Data| Cache
```

---

## Database Schema

### 1. User Model (`User.js`)
- `_id`: ObjectId
- `name`: String (Required, trimmed, max 50 chars)
- `email`: String (Required, unique, lowercase, trimmed, validated)
- `password`: String (Hashed with bcrypt salt rounds = 10, excluded from queries by default)
- `createdAt`, `updatedAt`: Timestamps

### 2. Alert Model (`Alert.js`)
- `_id`: ObjectId
- `userId`: ObjectId (Ref `User`, indexed)
- `coinId`: String (Lowercase, e.g. `'bitcoin'`, required)
- `coinSymbol`: String (Uppercase, e.g. `'BTC'`, required)
- `coinName`: String (e.g. `'Bitcoin'`)
- `targetPrice`: Number (Required, minimum > 0)
- `condition`: String (Enum: `['ABOVE', 'BELOW']`, required)
- `status`: String (Enum: `['ACTIVE', 'TRIGGERED', 'PAUSED']`, default: `'ACTIVE'`, indexed)
- `triggeredAt`: Date (Default: null)
- `createdAt`, `updatedAt`: Timestamps
- **Indexes**:
  - Compound partial unique index `{ userId: 1, coinId: 1, targetPrice: 1, condition: 1 }` on `{ status: 'ACTIVE' }` to prevent duplicate active alerts.
  - Compound index `{ status: 1, coinId: 1 }` for high-speed cron evaluation queries.

### 3. Price History Model (`PriceHistory.js`)
- `_id`: ObjectId
- `coinId`: String (Indexed)
- `price`: Number (Required)
- `currency`: String (Default: `'usd'`)
- `fetchedAt`: Date (Default: `Date.now`, indexed)

### 4. Notification Model (`Notification.js`)
- `_id`: ObjectId
- `userId`: ObjectId (Ref `User`, indexed)
- `alertId`: ObjectId (Ref `Alert`, indexed)
- `eventId`: String (Unique UUID v4 for message idempotency)
- `message`: String (Required, human-readable notification description)
- `coinId`: String (Required)
- `currentPrice`: Number (Required trigger price)
- `targetPrice`: Number (Required threshold price)
- `isRead`: Boolean (Default: false, indexed)
- `createdAt`, `updatedAt`: Timestamps

---

## API Documentation

All protected endpoints require the HTTP header:  
`Authorization: Bearer <your_jwt_token>`

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new account and returns JWT token |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token |
| `GET` | `/api/auth/me` | Private | Returns current user profile and summary counts |

### Cryptocurrency Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/coins` | Public | Returns supported coins with market metrics (query `?refresh=true` forces refresh) |
| `GET` | `/api/coins/:coinId/price` | Public | Returns current price and stats for single coin |
| `GET` | `/api/coins/:coinId/history` | Public | Returns historical price array for Recharts (query `?days=1|7|30|90|365`) |

### Alert Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/alerts` | Private | Creates a new price alert (`coinId`, `targetPrice`, `condition`) |
| `GET` | `/api/alerts` | Private | Returns user alerts (optional query: `?status=ACTIVE|TRIGGERED|PAUSED`) |
| `GET` | `/api/alerts/:id` | Private | Returns a single alert by ID (verifying ownership) |
| `PATCH` | `/api/alerts/:id` | Private | Updates alert target price or condition |
| `PATCH` | `/api/alerts/:id/pause` | Private | Pauses an active alert |
| `PATCH` | `/api/alerts/:id/resume` | Private | Resumes a paused alert |
| `DELETE` | `/api/alerts/:id` | Private | Deletes an alert permanently |

### Notification Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Private | Returns notification history (query `?unreadOnly=true`) |
| `GET` | `/api/notifications/:id` | Private | Returns single notification by ID |
| `PATCH` | `/api/notifications/:id/read` | Private | Marks a single notification as read |
| `PATCH` | `/api/notifications/read-all` | Private | Marks all user notifications as read |

### System Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns service status, uptime, and system timestamp |

---

## Environment Variables

Copy `.env.example` to `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/cryptoalerts

# Authentication (JWT)
JWT_SECRET=supersecretjwtkey_change_in_production_cryptoalerts_2026
JWT_EXPIRES_IN=7d

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=crypto-alert-notifications
RABBITMQ_DLQ=crypto-alert-notifications-dlq
RABBITMQ_EXCHANGE=crypto-alerts-exchange

# CoinGecko External API Configuration
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=
PRICE_CACHE_TTL_SECONDS=60

# Price Monitoring Job (Cron expression: every 30 seconds)
CRON_SCHEDULE=*/30 * * * * *
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose** (Optional, for running native MongoDB and RabbitMQ containers)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/cryptoalerts.git
cd cryptoalerts
```

### 2. Install backend dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

### Option A: Using Docker Compose for Infrastructure Services
If Docker is installed on your machine, start MongoDB and RabbitMQ:

```bash
# Start MongoDB (27017) and RabbitMQ (5672 & 15672)
docker compose up -d
```
Access the RabbitMQ Management Dashboard at [http://localhost:15672](http://localhost:15672) (User: `guest` / Pass: `guest`).

To stop services:
```bash
docker compose down
```

### Option B: Seamless Standalone Local Execution (Zero-Docker Fallback)
If Docker is not running on your machine, **CryptoAlerts includes automatic in-process fallback handlers**:
- **MongoDB**: Automatically switches to an embedded in-memory MongoDB server for testing and development.
- **RabbitMQ**: Automatically switches to an in-process asynchronous AMQP-compatible event bus.
The entire application will run without any external setup!

---

### Starting the Application Processes

Open separate terminal windows:

#### Terminal 1: Backend API Server
```bash
cd backend
npm run dev
# Server listens on http://localhost:5000
```

#### Terminal 2: RabbitMQ Worker (Optional standalone consumer)
```bash
cd backend
npm run worker
# Consumer listens to queue 'crypto-alert-notifications'
```

#### Terminal 3: React Frontend (Vite)
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

Now open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

---

## Scheduled Price Monitoring (Node-Cron)

The price monitor job resides in `backend/src/jobs/priceMonitorJob.js`:

1. **Overlap Prevention**: Uses an execution lock (`isJobRunning`) to ensure long-running network requests never trigger concurrent duplicate sweeps.
2. **Batch Query Optimization**: Rather than checking coin prices per-user, it queries all `ACTIVE` alerts in MongoDB and extracts distinct coin IDs:
   ```javascript
   const uniqueCoinIds = [...new Set(activeAlerts.map(a => a.coinId))];
   ```
3. **Price Ingestion**: Executes a single batch query to CoinGecko (`/simple/price?ids=...`) and caches the result.
4. **Historical Persistence**: Appends the latest price points into the `PriceHistory` collection.
5. **Atomic Condition Evaluation**:
   - `ABOVE`: `currentPrice >= alert.targetPrice`
   - `BELOW`: `currentPrice <= alert.targetPrice`
6. **Race-Condition Free Status Update**:
   ```javascript
   const triggered = await Alert.findOneAndUpdate(
     { _id: alert._id, status: 'ACTIVE' },
     { status: 'TRIGGERED', triggeredAt: new Date() },
     { new: true }
   );
   ```
7. **RabbitMQ Publishing**: If the atomic update succeeds, the job dispatches an event to `crypto-alerts-exchange`.

---

## Event Processing & RabbitMQ Worker

The messaging layer (`backend/src/queues/publisher.js` & `backend/src/queues/consumer.js`) implements enterprise AMQP messaging patterns:

1. **Exchange & Queue Configuration**:
   - Direct exchange: `crypto-alerts-exchange`
   - Primary Queue: `crypto-alert-notifications` (durable, persistent)
   - Dead-Letter Exchange: `crypto-alerts-dlx`
   - Dead-Letter Queue: `crypto-alert-notifications-dlq`
2. **Channel Prefetch**: Set to `prefetch(1)` so workers process messages sequentially without getting overloaded.
3. **Manual Acknowledgments**: Messages are only acknowledged (`channel.ack(msg)`) once the notification document is written to MongoDB.
4. **Strict Idempotency**: Before persisting, the consumer inspects `eventId`. If a message is redelivered due to network hiccups, the duplicate event is ignored.
5. **Dead-Letter Routing**: Unprocessable messages or messages exceeding max retries are safely routed to `crypto-alert-notifications-dlq` using `channel.nack(msg, false, false)`.

---

## Testing & Verification

The project includes an automated test suite powered by Jest and Supertest.

Run the tests:
```bash
npm test --prefix backend
```

### Verified Test Results (25 / 25 Passed)

```
PASS backend/tests/alerts.test.js
  Alerts API Tests
    √ POST /api/alerts - Create an ABOVE alert
    √ POST /api/alerts - Create a BELOW alert
    √ POST /api/alerts - Reject invalid target price (<= 0)
    √ POST /api/alerts - Reject duplicate active alert
    √ PATCH /api/alerts/:id/pause and /resume - Pause and resume alert
    √ PATCH /api/alerts/:id - Update alert target price
    √ DELETE /api/alerts/:id - Delete alert
    √ Prevent user from accessing another user's alert

PASS backend/tests/auth.test.js
  Authentication API Tests
    √ POST /api/auth/register - Successfully register a new user
    √ POST /api/auth/register - Prevent duplicate email registration
    √ POST /api/auth/register - Reject invalid password (< 6 characters)
    √ POST /api/auth/login - Successfully login with valid credentials
    √ POST /api/auth/login - Reject invalid credentials (wrong password)
    √ GET /api/auth/me - Access protected profile with valid token
    √ GET /api/auth/me - Reject request without token

PASS backend/tests/coins.test.js
  Cryptocurrency Coins API Tests
    √ GET /api/coins - Retrieve supported coins market overview
    √ GET /api/coins/:coinId/price - Retrieve single coin price
    √ GET /api/coins/:coinId/history - Retrieve historical price chart points

PASS backend/tests/notifications.test.js
  Notifications API and Service Tests
    √ processNotificationEvent - Generates notification and enforces idempotency
    √ GET /api/notifications - Retrieve user notification history
    √ PATCH /api/notifications/:id/read - Mark notification as read
    √ PATCH /api/notifications/read-all - Mark all notifications as read

PASS backend/tests/cronAndRabbit.test.js
  Cron Price Monitoring & Event Processing Tests
    √ Price above target triggers ABOVE alert and publishes notification event
    √ Paused and already-triggered alerts are ignored by the monitoring cycle
    √ Condition not met does not trigger alert

Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        17.866 s
```

---

## Deployment Guide

### Backend Deployment (e.g. Render, Railway, AWS ECS, Heroku)
1. Set environment variables on your host (`MONGODB_URI`, `JWT_SECRET`, `RABBITMQ_URL`, `CLIENT_URL`).
2. Build command: `npm install`
3. Start command: `node src/server.js`

### Frontend Deployment (e.g. Vercel, Netlify, Cloudflare Pages)
1. Set environment variable `VITE_API_BASE_URL=https://your-backend-api-domain.com/api`.
2. Build command: `npm run build`
3. Output directory: `dist`

### Unified Production Serving
When you run `npm run build --prefix frontend`, the compiled static files are saved to `frontend/dist`. The Express backend (`backend/src/app.js`) automatically serves these assets directly from port 5000 in production, providing single-port full-stack hosting.

---

## Future Enhancements

- WebSockets (Socket.io) for live frontend notification push without polling.
- Telegram and Discord bot webhooks for external alert dispatching.
- Multi-exchange price aggregation (Binance, Kraken, Coinbase Pro).
- Multi-currency alert support (EUR, GBP, JPY, CAD).
- Trailing stop-loss percentage alerts.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
