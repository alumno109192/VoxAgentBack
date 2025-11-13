# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        External Services                     │
├─────────────────────────────────────────────────────────────┤
│  Bland Voice API  │  AWS S3  │  Stripe  │  SendGrid │ OpenAI│
└────────┬──────────┴─────┬────┴────┬─────┴──────┬────┴───┬───┘
         │                │         │            │        │
         │ Webhooks       │ Storage │ Payments   │ Email  │ AI
         │                │         │            │        │
┌────────▼────────────────▼─────────▼────────────▼────────▼───┐
│                      API Gateway (Express)                    │
├───────────────────────────────────────────────────────────────┤
│  Middleware: Auth │ Rate Limit │ CORS │ Validation │ Logging │
└────────┬──────────────────────────────────────────────────┬──┘
         │                                                   │
    ┌────▼─────┐                                        ┌───▼────┐
    │  REST    │                                        │ WebSocket│
    │  Routes  │                                        │(Socket.IO)│
    └────┬─────┘                                        └───┬────┘
         │                                                  │
    ┌────▼──────────────────────────────────────────────────▼────┐
    │                     Controllers Layer                       │
    │  Auth │ Calls │ Transcriptions │ Admin │ Webhooks │ Billing│
    └────┬──────────────────────────────────────────────────┬────┘
         │                                                   │
    ┌────▼───────────────────────────────────────────────────▼───┐
    │                     Services Layer                          │
    │  BlandService │ TranscriptionService │ StorageService │ ... │
    └────┬────────────────────────────────────────────────────┬──┘
         │                                                     │
    ┌────▼─────────────────────────────────────────────────────▼─┐
    │                    Data Access Layer                        │
    │         Mongoose Models │ Redis Cache │ BullMQ Jobs         │
    └────┬────────────────────────────────────────────────────┬──┘
         │                                                     │
    ┌────▼──────────────┐                          ┌─────────▼────┐
    │    MongoDB        │                          │     Redis    │
    │  - Users          │                          │  - Cache     │
    │  - Tenants        │                          │  - Sessions  │
    │  - CallLogs       │                          │  - Queues    │
    │  - Transcriptions │                          └──────────────┘
    │  - BillingRecords │
    │  - AuditLogs      │
    └───────────────────┘
```

## Component Breakdown

### 1. API Gateway (Express)

**Responsibilities:**
- Request routing
- Middleware execution
- Response formatting
- Error handling

**Key Middleware:**
- `helmet`: Security headers
- `cors`: Cross-origin resource sharing
- `compression`: Response compression
- `express-rate-limit`: Rate limiting
- `morgan/winston`: Logging

### 2. Routes Layer

**Organization:**
```
/routes
  ├── health.ts        # Health checks
  ├── auth.ts          # Authentication
  ├── webhooks.ts      # Bland Voice webhooks
  ├── admin.ts         # Admin operations
  └── contact.ts       # Transcription upload
```

**Responsibilities:**
- Route definition
- Request validation
- Authorization checks
- Controller delegation

### 3. Controllers Layer

**Pattern:** Thin controllers, fat services

**Responsibilities:**
- Request/response handling
- Input validation
- Service orchestration
- Error responses

### 4. Services Layer

#### BlandService
- Token management (caching + refresh)
- API communication
- Call operations (initiate, answer, end)
- TTS messaging
- Recording retrieval

#### TranscriptionService
- Audio processing
- Whisper integration
- Result formatting
- Chunk handling

#### StorageService
- S3 upload/download
- Presigned URL generation
- Local storage fallback
- File lifecycle management

#### NotificationService
- Email via SendGrid
- SMS (future)
- Push notifications (future)

### 5. Data Models

```typescript
User
├── id
├── email
├── role (admin|operator|service)
├── tenantId
└── hashedPassword

Tenant
├── id
├── name
├── apiKey
├── quotaLimits
└── billingMethod

CallLog
├── id
├── blandCallId
├── tenantId
├── from/to
├── status
├── recordingUrl
├── durationSec
├── cost
└── metadata (PII/PHI)

Transcription
├── id
├── callId
├── text
├── chunks[]
├── confidence
└── provider

BillingRecord
├── id
├── tenantId
├── callId
├── amount
└── status

AuditLog
├── action
├── actorId
├── resourceType
├── before/after
└── timestamp
```

## Data Flow

### 1. Incoming Call Flow

```
Bland Voice → Webhook → Verify HMAC → Create CallLog
                                    ↓
                              Emit Socket.IO event
                                    ↓
                              Admin Dashboard
```

### 2. Transcription Flow (Async)

```
Call Ends → Bland sends recording URL
              ↓
        Download recording
              ↓
        Upload to S3
              ↓
        Queue transcription job (BullMQ)
              ↓
        Worker processes (Whisper API)
              ↓
        Save Transcription to DB
              ↓
        Emit Socket.IO event
              ↓
        Update Admin Dashboard
```

### 3. Billing Flow

```
Completed Call → Calculate cost
                      ↓
                Create BillingRecord
                      ↓
                Daily reconciliation job
                      ↓
                Group by tenant
                      ↓
                Stripe API charge
                      ↓
                Update status → Send invoice email
```

## Authentication & Authorization

### JWT Flow

```
Login → Validate credentials
           ↓
      Generate JWT (access + refresh)
           ↓
      Store refresh token in DB
           ↓
      Return tokens to client
           ↓
      Client stores in memory/localStorage
           ↓
      Subsequent requests: Bearer token
           ↓
      Middleware validates JWT
           ↓
      Attach user to req.user
           ↓
      RBAC check (authorize middleware)
           ↓
      Proceed to controller
```

### API Key Flow (for service-to-service)

```
Request with X-API-Key header
           ↓
      Lookup tenant by apiKey
           ↓
      Check quota limits
           ↓
      Proceed if valid
```

## Queue Architecture (BullMQ)

### Queues

1. **transcription-queue**
   - Priority: High
   - Concurrency: 5
   - Retry: 3 attempts (exponential backoff)
   - Jobs: Audio → Text processing

2. **billing-queue**
   - Priority: Medium
   - Concurrency: 2
   - Jobs: Daily reconciliation, charge processing

3. **notification-queue**
   - Priority: Low
   - Concurrency: 10
   - Jobs: Email, SMS, push notifications

### Worker Management

```typescript
// Auto-scaling based on queue size
if (queueSize > threshold) {
  scaleWorkers(currentWorkers + 2);
}
```

## Real-time Communication

### Socket.IO Events

**Server → Client:**
- `call:incoming` - New call received
- `call:connected` - Call established
- `call:disconnected` - Call ended
- `transcription:chunk` - Partial transcription
- `transcription:completed` - Full transcription ready
- `call:error` - Call error occurred

**Client → Server:**
- `subscribe:tenant` - Subscribe to tenant events
- `unsubscribe:tenant` - Unsubscribe

### Room Management

```typescript
// Each tenant has a room
io.on('connection', (socket) => {
  socket.join(`tenant:${tenantId}`);
  
  // Emit to specific tenant
  io.to(`tenant:${tenantId}`).emit('call:incoming', data);
});
```

## Caching Strategy

### Redis Cache

**Token Cache:**
- Key: `bland:auth:token`
- TTL: 5 minutes (configurable)
- Strategy: Cache-aside

**Rate Limiting:**
- Key: `ratelimit:{ip}:{endpoint}`
- TTL: 15 minutes
- Strategy: Sliding window

**Session Data:**
- Key: `session:{userId}`
- TTL: Token expiry time

## Error Handling

### Error Hierarchy

```typescript
AppError (operational)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
└── ConflictError (409)

SystemError (non-operational)
├── DatabaseError (500)
├── ExternalAPIError (502)
└── UnknownError (500)
```

### Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "requestId": "uuid",
  "timestamp": "2024-11-12T10:00:00Z",
  "details": {} // Only in development
}
```

## Logging Strategy

### Log Levels

- `error`: System errors, exceptions
- `warn`: Potential issues, deprecated usage
- `info`: General info, API calls
- `debug`: Detailed debugging info

### Log Format

```json
{
  "timestamp": "2024-11-12T10:00:00Z",
  "level": "info",
  "message": "User logged in",
  "requestId": "uuid",
  "userId": "user-id",
  "tenantId": "tenant-id",
  "metadata": {}
}
```

### Log Aggregation

- Development: Console + local files
- Production: Winston → CloudWatch/Datadog/Papertrail

## Security Layers

### 1. Network Layer
- HTTPS/TLS 1.2+
- VPC isolation
- Firewall rules

### 2. Application Layer
- Helmet security headers
- CORS policies
- Rate limiting
- Input validation

### 3. Authentication Layer
- JWT tokens
- Password hashing (bcrypt)
- API key validation

### 4. Authorization Layer
- RBAC
- Tenant isolation
- Resource-level permissions

### 5. Data Layer
- Encryption at rest
- Encryption in transit
- Field-level encryption (PII/PHI)

## Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- No in-memory sessions (use Redis)
- JWT tokens (no server-side session)
- Shared MongoDB/Redis

**Load Balancing:**
```
         Load Balancer
               │
    ┌──────────┼──────────┐
    │          │          │
Instance 1  Instance 2  Instance 3
    │          │          │
    └──────────┴──────────┘
         Shared DB/Redis
```

### Vertical Scaling

- Increase container resources
- Optimize database queries
- Add indexes
- Cache frequently accessed data

### Database Scaling

**Read Replicas:**
- Primary: Writes
- Replicas: Reads

**Sharding (future):**
- Shard by tenantId
- Geographic sharding

## Monitoring & Observability

### Key Metrics

**Application:**
- Request rate
- Response time
- Error rate
- Active connections

**Business:**
- Calls per day
- Transcription success rate
- Average call duration
- Revenue metrics

**Infrastructure:**
- CPU usage
- Memory usage
- Disk I/O
- Network throughput

### Health Checks

```
/health
├── database: connected/disconnected
├── redis: connected/disconnected
├── bland-api: ok/unavailable
└── status: ok/degraded/down
```

## Disaster Recovery

### Backup Strategy

**MongoDB:**
- Daily automated backups
- Point-in-time recovery
- Cross-region replication

**S3 Recordings:**
- Versioning enabled
- Lifecycle policies
- Cross-region replication

**Redis:**
- AOF persistence
- Snapshot backups

### Recovery Procedures

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 15 minutes

## Future Enhancements

1. **Microservices Split**
   - Auth service
   - Call service
   - Transcription service
   - Billing service

2. **Event Sourcing**
   - Kafka/RabbitMQ
   - Event store
   - CQRS pattern

3. **GraphQL API**
   - Alternative to REST
   - Real-time subscriptions

4. **ML/AI Features**
   - Sentiment analysis
   - Medical term extraction
   - Automated summarization

5. **Multi-region Deployment**
   - Geographic distribution
   - Data residency compliance

---

**Version:** 1.0  
**Last Updated:** November 2024
