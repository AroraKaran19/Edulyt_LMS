# Frontend Deployment to Elastic Beanstalk

## Author
**Karan Arora** ([@AroraKaran19](https://github.com/AroraKaran19))

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Create Deployment Package
Create a ZIP file excluding:
- `node_modules/`
- `.next/`
- `.git/`
- `.env.local`
- `README.md`
- `DEPLOYMENT.md`

### 3. ZIP Command
```bash
# Windows
powershell Compress-Archive -Path * -DestinationPath frontend-deploy.zip -Force

# Mac/Linux
zip -r frontend-deploy.zip . -x "node_modules/*" ".next/*" ".git/*" ".env.local" "README.md" "DEPLOYMENT.md"
```

### 4. Upload to Elastic Beanstalk
- Go to AWS Elastic Beanstalk Console
- Select your environment
- Upload the `frontend-deploy.zip` file
- Deploy

## Files to Include
- All source code
- `package.json`
- `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- Public assets
- Environment configuration

## Files to Exclude
- `node_modules/` (will be installed on server)
- `.next/` (will be built on server)
- `.git/` (version control)
- `.env.local` (local environment)
- `README.md`
- `DEPLOYMENT.md`
