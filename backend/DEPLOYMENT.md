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

### 3. ZIP Command
```bash
# Windows
powershell Compress-Archive -Path "dist/*", "package.json", "package-lock.json", "Procfile" -DestinationPath backend-deploy.zip -Force

# Mac/Linux
zip -r backend-deploy.zip dist/ package.json package-lock.json Procfile
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
