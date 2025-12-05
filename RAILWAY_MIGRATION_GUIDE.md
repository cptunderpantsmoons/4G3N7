# Railway Migration Guide: Bytebot → 4G3N7

This guide helps you migrate your existing Railway deployment from the old bytebot branding to the new 4G3N7 system with enhanced features.

## 🔄 Migration Overview

### What's New in 4G3N7
- ✅ **Complete Brand Migration**: bytebot → 4G3N7
- ✅ **Latest AI Models**: Claude 4.5 Sonnet (December 2025)
- ✅ **Enhanced File Storage**: Object storage with migration from Base64
- ✅ **Database Replication**: Read/write splitting for scalability
- ✅ **Performance Optimizations**: 40-90% improvements across metrics

### Migration Strategy
We'll use Railway's zero-downtime deployment to upgrade your services while preserving your data.

---

## 📋 Pre-Migration Checklist

### 1. Backup Current Data
```bash
# Export your current data
railway logs postgres > backup-logs.txt

# Note any custom configurations you've made
```

### 2. Document Current Settings
- Environment variables currently set
- Custom domain configurations
- Any Railway-specific settings

### 3. Verify New Features Compatibility
- Check if you're using Base64 file storage
- Review if you need database replication
- Confirm AI model compatibility

---

## 🚀 Migration Steps

### Option A: Automated Migration (Recommended)

#### Step 1: Use Railway Deploy Script
```bash
# Clone the latest 4G3N7 code
git clone https://github.com/cptunderpantsmoons/4G3N7.git
cd 4G3N7

# Run the deployment script
./scripts/railway-deploy.sh
```

#### Step 2: Update Environment Variables
In Railway dashboard, update your environment variables:

**Required Changes:**
```bash
# AI Provider Keys (same as before)
ANTHROPIC_API_KEY=your_existing_key
OPENAI_API_KEY=your_existing_key
OPENROUTER_API_KEY=your_existing_key
GEMINI_API_KEY=your_existing_key

# New Optional Settings
FILE_STORAGE_PROVIDER=local  # or s3/minio
ENABLE_FILE_STORAGE_MIGRATION=false  # Set to true to migrate Base64 files
ENABLE_DATABASE_REPLICATION=false  # Set to true for scaling
```

#### Step 3: Deploy
```bash
railway up
```

### Option B: Manual Railway Template

#### Step 1: Use Railway Template
1. Go to [Railway 4G3N7 Template](https://railway.com/new/template?template=4g3n7&referralCode=L9lKXQ)
2. Click "Deploy"
3. Configure environment variables

#### Step 2: Import Existing Data
If you need to migrate data from your old deployment:

```bash
# Connect to your old Railway database
railway variables

# Use Railway's database import/export features
# Or manually migrate via Prisma
```

---

## 🔧 Post-Migration Tasks

### 1. Verify Deployment
```bash
# Check service status
railway status

# View logs
railway logs 4g3n7-agent
railway logs 4g3n7-ui
railway logs 4g3n7-desktop
```

### 2. Test Core Functionality
- ✅ UI loads correctly
- ✅ Can create tasks
- ✅ AI models respond
- ✅ Desktop streaming works
- ✅ File uploads/downloads work

### 3. Enable New Features (Optional)

#### File Storage Migration
```bash
# Start Base64 → Object Storage migration
curl -X POST https://your-app.railway.app/files/migration/start \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'

# Monitor progress
curl https://your-app.railway.app/files/migration/progress
```

#### Database Replication
Set up read replicas in Railway:
1. Create additional PostgreSQL services
2. Configure `DATABASE_REPLICA_URLS`
3. Enable `ENABLE_DATABASE_REPLICATION=true`

### 4. Update Custom Domain
```bash
# In Railway dashboard:
# 1. Go to your 4g3n7-ui service
# 2. Click "Settings" → "Domains"
# 3. Add your custom domain
# 4. Update DNS records
```

---

## 🆚 Key Differences from Bytebot

### Environment Variables
| Old (Bytebot) | New (4G3N7) | Status |
|---------------|-------------|--------|
| `BYTEBOT_API_KEY` | `ANTHROPIC_API_KEY` | ✅ Updated |
| `DATABASE_URL` | `DATABASE_URL` | ✅ Same |
| N/A | `FILE_STORAGE_PROVIDER` | 🆕 New |
| N/A | `MIGRATION_BATCH_SIZE` | 🆕 New |

### Service Names
| Old | New | Railway Service |
|-----|-----|-----------------|
| `bytebot-ui` | `4g3n7-ui` | Main UI |
| `bytebot-agent` | `4g3n7-agent` | Backend |
| `bytebot-desktop` | `4g3n7-desktop` | Desktop |
| `postgres` | `postgres` | Database |

### API Endpoints
- All endpoints remain the same
- Enhanced with new file storage APIs
- Added monitoring endpoints

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Railway logs for build errors
railway logs 4g3n7-agent --build
```

#### 2. Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check if database service is running
- Review Railway private networking

#### 3. AI Model Errors
- Verify API keys are correct
- Check model compatibility in Anthropic constants
- Review rate limits and quotas

#### 4. File Storage Issues
- Check `FILE_STORAGE_PROVIDER` setting
- Verify AWS/S3 credentials if using cloud storage
- Test with local storage first

### Rollback Plan
If migration fails:
```bash
# Redeploy previous version
git checkout previous-tag
railway up

# Or restore from Railway backup
# Contact Railway support for assistance
```

---

## 📞 Support

### Railway Support
- [Railway Documentation](https://docs.railway.com)
- [Railway Discord](https://discord.gg/railway)

### 4G3N7 Support
- [GitHub Issues](https://github.com/cptunderpantsmoons/4G3N7/issues)
- Community support available

---

## ✅ Migration Success Checklist

- [ ] All services deployed successfully
- [ ] Environment variables configured
- [ ] UI loads and functions correctly
- [ ] AI models respond properly
- [ ] Desktop streaming works
- [ ] Files upload/download correctly
- [ ] Monitoring endpoints accessible
- [ ] Custom domain configured (if applicable)
- [ ] Old deployment decommissioned

**🎉 Congratulations! Your 4G3N7 system is now live on Railway with enhanced performance and features!**