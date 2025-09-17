# Deployment Guide

This document provides instructions for deploying the Airkrit backend to various platforms.

## Large Payload Support

The backend is configured to handle large course creation payloads (up to 100MB) with the following configurations:

### Elastic Beanstalk Configuration

**Files configured for large payloads:**
- `.ebextensions/01_environment.config` - Environment and Node.js settings
- `.ebextensions/02_large_payload.config` - Nginx and proxy configurations
- `Procfile` - Process configuration with memory optimization

**Key settings:**
- `client_max_body_size: 100M` - Maximum request body size
- `proxy_read_timeout: 300s` - Extended timeout for large requests
- `--max-old-space-size=1024` - Node.js memory limit (1GB)
- Load balancer idle timeout: 300 seconds

### Application Configuration

The Express.js application is configured with:
```javascript
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
```

# Backend Deployment to Elastic Beanstalk

## Author
**Karan Arora** ([@AroraKaran19](https://github.com/AroraKaran19))

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Create Deployment Package
Create a ZIP file including **ONLY**:
- `dist/` (compiled JavaScript)
- `package.json`
- `package-lock.json`
- `Procfile`
- `.ebextensions/` (AWS configuration files)

### 3. ZIP Command
```bash
# Windows
powershell Compress-Archive -Path "dist/*", "package.json", "package-lock.json", "Procfile", ".ebextensions" -DestinationPath backend-deploy.zip -Force

# Mac/Linux
zip -r backend-deploy.zip dist/ package.json package-lock.json Procfile .ebextensions/
```

### 4. Upload to Elastic Beanstalk
- Go to AWS Elastic Beanstalk Console
- Select your environment
- Upload the `backend-deploy.zip` file
- Deploy

## Files to Include
- `dist/` - Compiled TypeScript output
- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions
- `Procfile` - Process configuration
- `.ebextensions/` - AWS Elastic Beanstalk configuration files
  - `nginx.config` - Nginx configuration (fixes 413 Payload Too Large errors)
  - `express.config` - Express environment variables
  - `build.config` - Build process configuration

## Files to Exclude
- `src/` (source code - not needed)
- `node_modules/` (will be installed on server)
- `.env` (environment variables)
- `tsconfig.json`
- `.git/`
- `README.md`
- `DEPLOYMENT.md`

## Important Notes
- Ensure `Procfile` contains: `web: node dist/server.js`
- Environment variables must be configured in Elastic Beanstalk
- The server will run `npm install` automatically on deployment

## 413 Payload Too Large Error Fix

The `.ebextensions` folder contains configurations to handle large payloads (up to 100MB):

### What's Fixed:
- **Nginx Layer**: `client_max_body_size 100M` allows large request bodies
- **Express Layer**: JSON and URL-encoded limits set to 100MB
- **Memory**: Node.js memory increased to 2GB for processing large payloads

### Files Involved:
- `.ebextensions/nginx.config` - Nginx web server configuration
- `.ebextensions/express.config` - Express application environment variables
- `.ebextensions/build.config` - Build process configuration

### Deployment Impact:
- **No downtime** during configuration application
- **Automatic service reload** after deployment
- **Immediate effect** on payload size limits

## Troubleshooting

### If 413 Errors Persist:
1. **Verify .ebextensions inclusion**: Check that the folder is in your deployment ZIP
2. **Check EB logs**: Go to EB Console → Logs → Request Logs
3. **Verify nginx config**: SSH into instance and check `/etc/nginx/conf.d/`
4. **Test with smaller payloads**: Gradually increase payload size to identify limits

### Common Issues:
- **Missing .ebextensions**: Ensure folder is included in deployment package
- **Syntax errors**: Validate YAML syntax in configuration files
- **Permission issues**: EB will handle file permissions automatically

### Testing the Fix:
```bash
# Test with curl (replace with your EB URL)
curl -X POST https://your-app.elasticbeanstalk.com/api/courses \
  -H "Content-Type: application/json" \
  -d @large-course-payload.json
```
