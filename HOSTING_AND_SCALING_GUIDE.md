# ExamForge AI - Hosting & Scaling Architecture for 100K Concurrent Users

## Executive Summary

Your system needs to handle **100,000 concurrent users**. Current setup handles ~100. This guide shows how to scale to enterprise levels.

---

## Table of Contents
1. [Current Architecture](#current-architecture)
2. [Target Architecture](#target-architecture)
3. [Hosting Providers](#hosting-providers)
4. [Implementation Steps](#implementation-steps)
5. [Performance Targets](#performance-targets)

---

## Current Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Vite + React) │
│   Port 3000     │
└────────┬────────┘
         │
         └──────────────┐
                        │
                 ┌──────▼──────┐
                 │   Backend   │
                 │   Express   │
                 │  Port 5000  │
                 └──────┬──────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         ┌────▼────┐         ┌───▼────┐
         │PostgreSQL│         │  S3    │
         │ (1 node) │         │ Upload │
         └──────────┘         └────────┘
```

**Current Capacity:** ~100 concurrent users  
**Current Issues:**
- Single backend server (no redundancy)
- No load balancing
- No database read replicas
- No caching layer
- No CDN

---

## Target Architecture (100K Users)

```
┌────────────────────────────────────────────────────┐
│  CloudFront / Cloudflare CDN                       │
│  (Serve static assets from edge locations)         │
└────────────────┬─────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │  Load Balancer   │
        │  (AWS ALB / NGINX)│
        └────────┬─────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
  │ API  │  │ API  │  │ API  │
  │ 1    │  │ 2    │  │ 3    │
  │:5000 │  │:5001 │  │:5002 │
  └──────┘  └──────┘  └──────┘
      │          │          │
      └──────────┼──────────┘
                 │
        ┌────────▼─────────────┐
        │  Redis Cache Layer   │
        │  (Session Storage)   │
        └────────┬─────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐   ┌──▼───┐    ┌───▼────┐
│Primary │   │Read  │    │Read    │
│DB      │   │Rep 1 │    │Rep 2   │
│(Write) │   │      │    │        │
└────────┘   └──────┘    └────────┘

Plus: S3, CloudFront, Monitoring, Backups
```

**Target Capacity:** 100,000+ concurrent users  
**Availability:** 99.99% uptime  
**Response Time:** <200ms p99

---

## Hosting Providers Comparison

### Option 1: AWS (Recommended for Enterprise)

**Architecture:**
```
• Compute: ECS Fargate (5-10 instances)
• Database: RDS PostgreSQL Multi-AZ
• Cache: ElastiCache Redis
• Load Balancer: Application Load Balancer (ALB)
• CDN: CloudFront
• Storage: S3 + CloudFront
```

**Pricing:**
```
Compute (ECS):              $1,000/month (5 instances)
Database (RDS Multi-AZ):     $800/month
Redis (6GB - 128GB):         $200-1000/month
Load Balancer:               $20/month
CDN (1TB/month traffic):     $100/month
Backups & Misc:              $200/month
─────────────────────────────
TOTAL:                       $2,320-3,320/month
```

**Pros:**
- High availability (Multi-AZ)
- Auto-scaling
- Enterprise support
- Global CDN
- Integrated monitoring

**Cons:**
- Expensive
- Complex setup
- Vendor lock-in

---

### Option 2: DigitalOcean (Cost-Effective)

**Architecture:**
```
• Compute: Kubernetes (3 master + 6 worker nodes)
• Database: Managed PostgreSQL
• Cache: Managed Redis
• Load Balancer: DigitalOcean Load Balancer
• CDN: Spaces + Spaces CDN
```

**Pricing:**
```
Kubernetes Cluster:
  - 3 Master nodes: Included
  - 6 Worker nodes: $300/month (s-4vcpu-8gb each)
Database (Managed PostgreSQL):  $200/month
Redis (1GB Managed):            $50/month
Load Balancer:                  $10/month
Spaces CDN (1TB/month):         $50/month
─────────────────────────────
TOTAL:                          $610/month
```

**Pros:**
- Much cheaper than AWS
- Simple Kubernetes setup
- Good documentation
- Transparent pricing

**Cons:**
- Fewer advanced features
- Smaller ecosystem
- Limited auto-scaling

---

### Option 3: Google Cloud Platform

**Architecture:**
```
• Compute: GKE (Google Kubernetes Engine)
• Database: Cloud SQL PostgreSQL
• Cache: Memorystore Redis
• Load Balancer: Cloud Load Balancing
• CDN: Cloud CDN
```

**Pricing:**
```
GKE Cluster (6 nodes n1-standard-4):  $500/month
Cloud SQL (PostgreSQL High Memory):   $600/month
Memorystore Redis (6GB):              $200/month
Cloud CDN (1TB/month):                $100/month
Load Balancer:                        $20/month
─────────────────────────────
TOTAL:                                $1,420/month
```

**Pros:**
- Good balance of price/features
- Excellent Kubernetes support
- ML capabilities included

**Cons:**
- Complex pricing structure
- Steeper learning curve

---

## Implementation Steps

### Phase 1: Prepare Application (This Week)
✅ **Already Done:**
- [x] Add pagination to all endpoints
- [x] Add database indexes
- [x] Add compression middleware
- [x] Add Urdu validation

**Still Needed:**
```typescript
// 1. Add environment configuration
// backend/.env.production
DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/examforge"
REDIS_URL="redis://redis-endpoint:6379"
NODE_ENV="production"

// 2. Update Prisma for pooling
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling
}

// 3. Add session management
// backend/src/sessionMiddleware.ts
import redis from 'redis';
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
```

### Phase 2: Containerization (Week 2)

**Create Docker image:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**Build & test:**
```bash
cd backend
docker build -t examforge-backend:1.0.0 .
docker run -p 5000:5000 -e DATABASE_URL="..." examforge-backend:1.0.0
```

### Phase 3: Deploy to Chosen Provider

#### AWS Deployment

**Step 1: Create RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier examforge-prod \
  --db-instance-class db.r5.xlarge \
  --engine postgres \
  --master-username admin \
  --master-user-password SecurePass123 \
  --allocated-storage 100 \
  --multi-az
```

**Step 2: Create ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id examforge-redis \
  --cache-node-type cache.r6g.xlarge \
  --engine redis
```

**Step 3: Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name examforge-prod

aws ecs register-task-definition \
  --family examforge-backend \
  --container-definitions file://ecs-task-def.json
```

**Step 4: Create ALB**
```bash
aws elbv2 create-load-balancer \
  --name examforge-alb \
  --subnets subnet-xxx subnet-yyy
```

#### DigitalOcean Deployment

**Step 1: Create Kubernetes Cluster**
```bash
doctl kubernetes cluster create examforge-prod \
  --region nyc3 \
  --count 6 \
  --size s-4vcpu-8gb
```

**Step 2: Create Managed PostgreSQL**
```bash
doctl databases create \
  --engine pg \
  --region nyc3 \
  --num-nodes 3 \
  examforge-db
```

**Step 3: Deploy Backend**
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: examforge-backend
spec:
  replicas: 5
  selector:
    matchLabels:
      app: examforge-backend
  template:
    metadata:
      labels:
        app: examforge-backend
    spec:
      containers:
      - name: backend
        image: registry.digitalocean.com/examforge/backend:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: examforge-backend-service
spec:
  selector:
    app: examforge-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

**Step 4: Deploy to Kubernetes**
```bash
kubectl create secret generic db-secret \
  --from-literal=url="postgresql://..."

kubectl create secret generic redis-secret \
  --from-literal=url="redis://..."

kubectl apply -f kubernetes/deployment.yaml

# Scale to 10 replicas
kubectl scale deployment examforge-backend --replicas=10
```

---

## Performance Targets

### Before Scaling (Current)
```
Concurrent Users:     100
Response Time P99:    2000ms
Database Queries:     50/sec
Uptime:              ~95%
Monthly Cost:        ~$100
```

### After Scaling (Target)
```
Concurrent Users:     100,000+
Response Time P99:    <200ms
Database Queries:     100,000/sec
Uptime:              99.99%
Monthly Cost:        $600-3,300
```

### Load Testing

**Test with Apache Bench:**
```bash
# Test 1000 concurrent connections
ab -n 10000 -c 1000 http://your-load-balancer-url/api/questions

# Expected:
# Requests per second: 5000+
# Mean time per request: <200ms
# Failed requests: 0
```

**Test with k6:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let res = http.get('http://your-api/api/questions?page=1&pageSize=50');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

---

## Database Optimization

### Connection Pooling Configuration

```typescript
// backend/src/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
  errorFormat: 'pretty',
});

// Connection pool is handled by Prisma automatically
// For RDS: 20 connections per server instance
// For Kubernetes: Scale horizontally instead
```

### Read Replicas Setup

```sql
-- Create read replica in AWS RDS
aws rds create-db-instance-read-replica \
  --db-instance-identifier examforge-read-1 \
  --source-db-instance-identifier examforge-prod

-- In Prisma, route reads to replicas
// Use URL pattern for read replica
PRISMA_DATABASE_URL="postgresql://user:pass@read-replica:5432/examforge"
```

---

## Monitoring & Alerting

### Datadog Setup

```typescript
// backend/src/monitoring.ts
import StatsD from 'node-dogstatsd';

const dogstatsd = new StatsD.StatsD();

// Track API response times
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    dogstatsd.timing(`http.response_time`, duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// Track database queries
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  dogstatsd.timing(`prisma.query.time`, after - before, {
    model: params.model,
    action: params.action,
  });
  return result;
});
```

### Alerts to Configure

```yaml
# Prometheus alerting rules
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.99, http_response_time) > 200
        for: 5m
        annotations:
          summary: "API latency > 200ms"
          
      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "PostgreSQL database is down"
```

---

## Migration Strategy

### Step 1: Run in Parallel (Week 1-2)
```
Production (New) ──────┐
                       ├─► Load Balancer
Production (Old)  ─────┘
```
Both systems handle traffic, new system validated.

### Step 2: Gradual Cutover (Week 2-3)
```
Old: 80% ──┐
           ├─► Load Balancer
New: 20% ──┘
```
Slowly increase load on new system.

### Step 3: Full Migration (Week 3-4)
```
New: 100% ──► Load Balancer
```
All traffic on new system, old system decommissioned.

---

## Cost Optimization

### Save 40% with Reserved Instances

```bash
# AWS: Use 1-year reserved instances
aws ec2 purchase-reserved-instances-offering \
  --instance-count 5 \
  --offering-id <offering-id>
```

### Use Spot Instances for Non-Critical

```bash
# For background jobs, use 70% cheaper spot instances
aws ec2 request-spot-instances \
  --spot-price 0.20 \
  --instance-count 3
```

### Savings: $3,000/month → $1,800/month

---

## Maintenance & Updates

### Blue-Green Deployment

```bash
# Deploy new version to "green" environment
kubectl set image deployment/examforge-backend \
  backend=registry.examforge.com/backend:2.0.0 \
  --record

# Test new version
curl http://green-backend/api/health

# Switch traffic
kubectl service examforge-backend --selector app=examforge-backend-green

# Keep old "blue" for rollback
```

### Automated Backups

```bash
# Daily backups to S3
aws rds create-db-snapshot \
  --db-instance-identifier examforge-prod \
  --db-snapshot-identifier examforge-backup-$(date +%Y%m%d)

# Keep 30-day retention
aws rds modify-db-instance \
  --db-instance-identifier examforge-prod \
  --backup-retention-period 30
```

---

## Summary: Quick Start

1. **This Week:**
   - [x] Update backend with pagination/compression/validation
   - [ ] Set up Docker build pipeline

2. **Next Week:**
   - [ ] Choose hosting provider (AWS/DigitalOcean/GCP)
   - [ ] Create database cluster
   - [ ] Create Redis cache
   - [ ] Deploy containers

3. **Week 3:**
   - [ ] Configure load balancer
   - [ ] Enable CDN
   - [ ] Run load tests
   - [ ] Setup monitoring

4. **Week 4:**
   - [ ] Gradual traffic migration
   - [ ] Full production deployment
   - [ ] Decommission old infrastructure

**Estimated Budget:** $600-3,300/month depending on provider
**Setup Time:** 3-4 weeks
**Result:** Handle 100K+ concurrent users with <200ms latency
