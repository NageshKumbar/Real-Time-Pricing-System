# Real-Time Pricing Engine

A production-style, low-latency market data processing system built for high-frequency real-time price streaming, rolling 24-hour analytics, optimized WebSocket delivery, and fault-tolerant state management.

## Overview

This project implements a scalable, event-driven real-time pricing engine capable of ingesting high-frequency market feeds, independently computing rolling 24-hour statistics, persisting state across restarts, and broadcasting bandwidth-optimized delta updates to multiple concurrent WebSocket clients.

**Performance Targets:**

* **End-to-End Latency:** `<= 50ms`
* **Upstream Feed Payload:** `~256KB` raw ticks
* **Downstream Broadcast Payload:** `< 10KB` via delta compression and subscription filtering

## Key Outcomes & Features

* **Real-Time Market Processing:** Connects to an external WebSocket feed (`quotes.livefxhub.com`) for tick-by-tick ingestion and dynamic symbol handling.
* **Internal Metric Computation:** Ignores externally supplied summary metrics and accurately computes all statistics internally:
  * Buy Price
  * Sell Price
  * 24h High
  * 24h Low
  * 24h Percentage Change
* **Rolling 24-Hour Window:** Maintains an efficient, in-memory time-window per symbol with automatic eviction of expired ticks to keep memory usage bounded and calculations fast.
* **Selective WebSocket Distribution:** Supports multiple concurrent clients with per-client symbol subscriptions (e.g., `EURUSD`, `GBPUSD`, `USDJPY`, `XAUUSD`) and broadcasts only subscribed data.
* **Payload Optimization:** Reduces outgoing bandwidth from `~256KB` down to `< 10KB` using delta encoding (transmitting changed fields only), subscription filtering, and minimal serialization.
* **Fault Tolerance & Durability:** Handles feed disconnects with auto-reconnect and heartbeats, deduplicates ticks, reorders out-of-order ticks, and recovers state seamlessly using Redis AOF persistence.
* **Dockerized Deployment:** Fully containerized Node.js and Redis stack with one-command startup.

## System Architecture

![Real-Time Pricing Engine System Architecture](./System%20Architecture.png)

> **Note:** Make sure `System Architecture.png` is placed in the root directory of the repository (or update the image path above if stored in a subfolder like `docs/`).

### Data Flow Summary

```text
External Market Data Feed (quotes.livefxhub.com | Raw Ticks ~256KB)
  -> 1. Feed Consumer Service
    -> 2. Tick Processor (Clean Ticks)
      -> 3. Rolling Window Engine <-> 4. Redis Cache <-> 5. Persistence Layer (Redis AOF)
        -> 6. WebSocket Server (Delta Updates < 10KB)
          -> Clients (Selective, Optimized Updates)
```

### Core Components

| # | Component | Responsibilities |
| --- | --- | --- |
| **1** | **Feed Consumer Service** | Connects to the external WebSocket feed (`quotes.livefxhub.com`), manages automatic reconnections and heartbeat monitoring, parses/validates incoming raw ticks, and emits clean tick events. |
| **2** | **Tick Processor** | Validates and normalizes incoming ticks, filters duplicate ticks, handles out-of-order ticks via buffering/sorting, and forwards clean ticks to the rolling window engine. |
| **3** | **Rolling Window Engine** | Maintains an in-memory 24-hour rolling window per symbol, evicts expired ticks, computes Buy, Sell, 24h High, 24h Low, and 24h % Change in real time, and emits metric updates. |
| **4** | **Redis Cache** | Stores the latest computed metrics per symbol, provides fast read access for newly connected clients, and acts as the shared state layer for horizontal scaling. |
| **5** | **Persistence Layer** | Uses **Redis AOF (Append-Only File)** for durability, enabling full state recovery on restart with zero data loss. |
| **6** | **WebSocket Server** | Manages concurrent client connections and symbol subscriptions, applies delta compression, and broadcasts selective updates (`< 10KB`) to subscribed clients. |

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Runtime** | Node.js (v20+) |
| **Language** | TypeScript |
| **Real-Time Communication** | WebSocket (`ws`) |
| **Cache & Persistence** | Redis (with AOF enabled) |
| **Containerization** | Docker & Docker Compose |
| **Serialization** | JSON (MessagePack-ready) |
| **Architecture** | Non-blocking, Event-Driven |

## Project Structure

```text
pricing-engine/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── test-client.js
└── src/
    ├── index.ts
    ├── config.ts
    ├── feed/
    │   └── consumer.ts
    ├── websocket/
    │   ├── server.ts
    │   └── subscriptionManager.ts
    ├── processor/
    │   ├── tickProcessor.ts
    │   ├── rollingWindow.ts
    │   └── deltaEncoder.ts
    ├── storage/
    │   ├── redis.ts
    │   └── persistence.ts
    ├── models/
    ├── types/
    └── utils/
```

## Getting Started

### Prerequisites

* **Docker** & **Docker Compose** (for containerized deployment)
* **Node.js 20+** and **npm** (for local development)

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

### Docker Deployment

Run the full containerized stack (Pricing Engine + Redis):

* **Build and start services (foreground):**

  ```bash
  docker-compose up --build
  ```

* **Build and start services in the background (detached):**

  ```bash
  docker-compose up -d --build
  ```

* **Stop services:**

  ```bash
  docker-compose down
  ```

## WebSocket API Usage

### 1. Connect

Connect any WebSocket client to:

```text
ws://localhost:8080
```

### 2. Subscribe to Symbols

Send a JSON subscription payload specifying the desired market symbols:

```json
{
  "type": "subscribe",
  "symbols": ["EURUSD", "GBPUSD"]
}
```

### 3. Example Market Update Response

```json
{
  "symbol": "EURUSD",
  "buy": 1.0921,
  "sell": 1.0923,
  "high24h": 1.1000,
  "low24h": 1.0800,
  "change24h": 1.23,
  "timestamp": 1715000000
}
```

> **Note:** After the initial snapshot, subsequent broadcasts transmit delta updates containing only changed fields to minimize payload size.

### 4. Run the Test Client

Verify live streaming and subscriptions using the included test client:

```bash
node test-client.js
```

## Performance Engineering

* **Low-Latency Pipeline (`<= 50ms`):** Built on a non-blocking, asynchronous, event-driven architecture that avoids disk I/O in the hot path.
* **In-Memory Rolling Windows:** Keeps strictly the latest 24 hours of ticks per symbol in RAM with automatic eviction, ensuring predictable memory usage and low computational overhead.
* **Delta Compression:** Eliminates redundant snapshot broadcasts by encoding and sending only modified fields per tick update.
* **Subscription Filtering:** Clients receive updates solely for the symbols they explicitly subscribe to, drastically reducing server egress and client parsing overhead.

## Fault Tolerance & Reliability

| Failure Scenario | Mitigation Strategy |
| --- | --- |
| **External Feed Disconnects** | Automatic reconnection retry loop, heartbeat monitoring, and seamless stream continuation. |
| **Duplicate Ticks** | Deduplication via timestamp filtering, tick hashing, and cache-based validation. |
| **Out-of-Order Data** | Incoming ticks are buffered, sorted, and reordered prior to rolling window computation. |
| **Service Restarts / Crashes** | Redis AOF durability ensures latest metrics and state are recovered immediately upon startup. |
| **Traffic Spikes** | Decoupled event-driven pipeline prepared for worker pools, Redis Streams, or Kafka ingestion. |

## Scalability Design

The application tier is designed to remain stateless with shared state offloaded to Redis, enabling horizontal scaling across multiple instances behind a load balancer:

```text
                 [ Load Balancer ]
                         |
         +---------------+---------------+
         |               |               |
     [ Node 1 ]      [ Node 2 ]      [ Node 3 ]
         |               |               |
         +---------------+---------------+
                         |
                  [ Shared Redis ]
```

### Planned Production Enhancements

* **Message Streaming:** Apache Kafka or Redis Streams for high-throughput ingestion and fan-out
* **Binary Serialization:** Protocol Buffers or MessagePack for further payload reduction
* **Orchestration:** Kubernetes deployment with autoscaling and health checks
* **Distributed Caching:** Redis Cluster for multi-node state partitioning

## Engineering Tradeoffs & Challenges

### Key Architectural Tradeoffs

| Decision | Advantage | Tradeoff |
| --- | --- | --- |
| **Redis** | Sub-millisecond reads/writes & shared state | Higher memory footprint |
| **JSON Serialization** | Human-readable, easy debugging & universal support | Larger payloads compared to binary formats |
| **MessagePack (Ready)** | Compact binary payloads | Added serialization/debugging complexity |
| **In-Memory Rolling Windows** | Ultra-fast 24h metric computation | Scales with RAM usage per active symbol |
| **Node.js Runtime** | Excellent concurrent WebSocket I/O efficiency | Single-threaded event loop (CPU-bound work needs care) |

### Challenges & Solutions

* **Payload Size Optimization:** Upstream ticks average `~256KB`. Solved by combining delta encoding, per-client symbol subscription filtering, and minimal serialization to keep outgoing payloads `< 10KB`.
* **Efficient 24h Window Computation:** Recalculating historical windows on high-frequency feeds can degrade latency. Solved via sliding in-memory windows with automatic eviction of stale ticks.
* **External Feed Instability:** Live market feeds can drop or emit duplicate/out-of-order frames. Solved with heartbeat monitoring, automatic reconnection loops, deduplication, and Redis AOF state recovery.

## Security & Monitoring (Production Recommendations)

### Security Hardening

* Enforce **WSS / TLS** encryption for all WebSocket connections
* Implement **API authentication** (e.g., JWT or API key handshake)
* Apply **IP-based rate limiting** and connection caps
* Enforce strict **payload validation** and **CORS / Origin restrictions**

### Observability & Metrics

* **Recommended Stack:** Prometheus, Grafana, Loki, and OpenTelemetry
* **Key Metrics to Track:**
  * Tick ingestion throughput (ticks/sec)
  * End-to-end processing & broadcast latency
  * Active WebSocket client connections & subscription counts
  * Memory usage & GC pauses
  * Redis latency, memory, and AOF persistence health
  * Application `/health` and readiness endpoints

## Requirements Coverage

| Requirement | Status |
| --- | --- |
| Real-time market feed processing | Implemented |
| Internal rolling 24h calculations | Implemented |
| Persistent state recovery (Redis AOF) | Implemented |
| Multi-client WebSocket broadcast server | Implemented |
| Payload optimization (`~256KB` -> `< 10KB`) | Implemented |
| Low-latency architecture (`<= 50ms`) | Implemented |
| Fault tolerance & graceful recovery | Implemented |
| Dockerized deployment | Implemented |
| Modular, scalable architecture | Implemented |

## Author Notes

This project emphasizes production-oriented real-time systems engineering:

* Low-latency backend architecture
* Fault-tolerant stream processing
* Bandwidth-efficient market data distribution
* Scalable WebSocket infrastructure

The primary goal is to demonstrate sound engineering tradeoffs, scalability planning, and clean production architecture alongside a working implementation.