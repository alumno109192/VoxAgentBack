# Deployment Guides

## Railway Deployment

### Prerequisites
- Railway account
- Railway CLI installed

### Steps

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize project**
```bash
railway init
```

4. **Add MongoDB and Redis plugins**
- Go to Railway dashboard
- Click "New" → "Database" → "Add MongoDB"
- Click "New" → "Database" → "Add Redis"

5. **Set environment variables**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-here
railway variables set BLAND_API_KEY=your-key
railway variables set BLAND_API_SECRET=your-secret
railway variables set BLAND_WEBHOOK_SECRET=your-webhook-secret
# Add other required variables...
```

6. **Deploy**
```bash
railway up
```

7. **Get deployment URL**
```bash
railway domain
```

### Configuration in Railway Dashboard

1. Set build command: `npm install && npm run build`
2. Set start command: `npm start`
3. Set health check path: `/health`
4. Enable auto-deploy from GitHub

---

## Render Deployment

### Prerequisites
- Render account
- GitHub repository

### Steps

1. **Create Web Service**
- Go to Render Dashboard
- Click "New +" → "Web Service"
- Connect your GitHub repository

2. **Configure Service**
- **Name**: voice-assistant-backend
- **Environment**: Node
- **Region**: Choose closest to your users
- **Branch**: main
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

3. **Add Environment Variables**
Go to "Environment" tab and add:
```
NODE_ENV=production
PORT=4000
MONGO_URI=<your-mongodb-uri>
REDIS_URL=<your-redis-url>
JWT_SECRET=<your-secret>
BLAND_API_KEY=<your-key>
BLAND_API_SECRET=<your-secret>
BLAND_WEBHOOK_SECRET=<your-webhook-secret>
# Add other variables...
```

4. **Add MongoDB**
- Click "New +" → "PostgreSQL" or use external MongoDB Atlas
- For MongoDB Atlas:
  - Create free cluster at mongodb.com/cloud/atlas
  - Get connection string
  - Add to MONGO_URI variable

5. **Add Redis**
- Use Render's Redis addon or Upstash
- For Upstash:
  - Sign up at upstash.com
  - Create Redis database
  - Copy connection string to REDIS_URL

6. **Deploy**
- Click "Create Web Service"
- Wait for deployment to complete

7. **Configure Health Checks**
- Go to "Settings" → "Health Check Path"
- Set to: `/health`

---

## Fly.io Deployment

### Prerequisites
- Fly.io account
- Fly CLI installed

### Steps

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**
```bash
fly auth login
```

3. **Launch app**
```bash
fly launch
```

Follow prompts:
- App name: voice-assistant-backend
- Region: Choose closest
- PostgreSQL: No (we use MongoDB)
- Redis: Yes

4. **Create MongoDB**
Option A: Use MongoDB Atlas (recommended)
- Create cluster at mongodb.com
- Get connection string

Option B: Use third-party Fly addon
```bash
fly extensions mongodb create
```

5. **Set secrets**
```bash
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET=your-secret
fly secrets set MONGO_URI=your-mongodb-uri
fly secrets set BLAND_API_KEY=your-key
fly secrets set BLAND_API_SECRET=your-secret
fly secrets set BLAND_WEBHOOK_SECRET=your-webhook-secret
# Add other secrets...
```

6. **Configure fly.toml**
```toml
app = "voice-assistant-backend"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[[services]]
  protocol = "tcp"
  internal_port = 4000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

7. **Deploy**
```bash
fly deploy
```

8. **Check status**
```bash
fly status
fly logs
```

---

## Environment-specific Configuration

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 32 chars)
- [ ] Configure valid `MONGO_URI` with authentication
- [ ] Configure `REDIS_URL` with password
- [ ] Add all Bland Voice credentials
- [ ] Configure S3/storage credentials
- [ ] Enable HTTPS/TLS
- [ ] Set proper `CORS_ORIGIN`
- [ ] Configure error tracking (Sentry)
- [ ] Set up monitoring/alerts
- [ ] Configure log retention
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Test health checks
- [ ] Configure backup strategy

### Webhook Configuration

After deployment, configure Bland Voice webhook URL:

```
https://your-app-url.com/api/webhooks/bland/events
```

### Database Migration

For initial setup:

```bash
# SSH into deployment or use CLI
npm run seed
```

---

## Monitoring & Maintenance

### Health Check

```bash
curl https://your-app-url.com/health
```

### Logs

**Railway:**
```bash
railway logs
```

**Render:**
View in dashboard or use CLI

**Fly.io:**
```bash
fly logs
```

### Scaling

**Railway:** Auto-scales based on plan

**Render:**
- Go to Settings → Instance
- Adjust instance type

**Fly.io:**
```bash
fly scale count 2  # Scale to 2 instances
fly scale vm shared-cpu-1x --memory 512  # Adjust resources
```

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGO_URI format
   - Verify network access in MongoDB Atlas
   - Check firewall rules

2. **Redis Connection Failed**
   - Verify REDIS_URL
   - Check if Redis requires password
   - Test connection locally

3. **Webhook Signature Verification Failed**
   - Check BLAND_WEBHOOK_SECRET matches Bland dashboard
   - Verify request headers
   - Test with ngrok locally first

4. **Out of Memory**
   - Increase memory allocation
   - Review memory leaks
   - Optimize queries

5. **High CPU Usage**
   - Check for infinite loops
   - Optimize database queries
   - Add indexes

### Support

- Railway: https://railway.app/help
- Render: https://render.com/docs
- Fly.io: https://fly.io/docs
