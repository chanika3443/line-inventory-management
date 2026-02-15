---
inclusion: manual
---

# Deployment Guide

## Prerequisites

1. GitHub repository: `chanika3443/line-inventory-management`
2. Google Cloud Project with Sheets API enabled
3. LINE LIFF app configured
4. Node.js 18+ installed locally

## Step 1: Setup Google Sheets API

### Create API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: 
     - `https://chanika3443.github.io/*`
     - `http://localhost:3000/*` (for development)
   - **API restrictions**: Google Sheets API only
6. Copy the API key

### Make Sheet Public

1. Open your Google Sheet
2. Click **Share** → **Change to anyone with the link**
3. Set permission to **Viewer**
4. Or: **File** → **Share** → **Publish to web** → **Publish**

## Step 2: Configure GitHub Secrets

1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Add **Repository secrets**:
   - `VITE_LIFF_ID`: `2008893142-t04JvNpe`
   - `VITE_SPREADSHEET_ID`: `13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8`
   - `VITE_GOOGLE_API_KEY`: (your API key from step 1)

## Step 3: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `gh-pages` / `(root)`
4. Click **Save**

## Step 4: Local Development

```bash
# Clone repository
git clone https://github.com/chanika3443/line-inventory-management.git
cd line-inventory-management/react-inventory

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env

# Start development server
npm run dev
```

## Step 5: Deploy

### Option A: Automatic (GitHub Actions)

```bash
# Commit and push to main branch
git add .
git commit -m "Deploy React version"
git push origin main
```

GitHub Actions will automatically:
1. Build the project
2. Deploy to GitHub Pages
3. Available at: https://chanika3443.github.io/line-inventory-management/

### Option B: Manual

```bash
# Build and deploy manually
npm run deploy
```

## Step 6: Update LINE LIFF

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Select your provider and channel
3. Go to **LIFF** tab
4. Edit your LIFF app:
   - **Endpoint URL**: `https://chanika3443.github.io/line-inventory-management/`
   - **Scope**: `profile`, `openid`
   - **Module mode**: OFF
5. Save changes

## Step 7: Test

1. Open LINE app
2. Go to your LINE OA
3. Click LIFF link or menu
4. Test all features:
   - Login with LIFF
   - View products
   - Withdraw/Receive/Return
   - Check dashboard
   - View logs

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Key Not Working

- Check API key restrictions in Google Cloud Console
- Verify domain is whitelisted
- Check if Sheets API is enabled
- Try creating a new API key

### CORS Errors

- Ensure Google Sheet is public
- Use Sheets API (not direct URL fetch)
- Check API key restrictions

### LIFF Not Loading

- Verify LIFF ID is correct
- Check Endpoint URL in LINE Developers Console
- Ensure HTTPS is used
- Check browser console for errors

### GitHub Actions Fails

- Check secrets are set correctly
- Verify workflow file syntax
- Check build logs in Actions tab
- Ensure gh-pages branch exists

### Page Not Found (404)

- Check GitHub Pages settings
- Verify base path in vite.config.js
- Wait 1-2 minutes for deployment
- Clear browser cache

## Monitoring

### Check Deployment Status

1. Go to **Actions** tab in GitHub
2. View latest workflow run
3. Check build and deploy logs

### Check API Usage

1. Go to Google Cloud Console
2. **APIs & Services** → **Dashboard**
3. View Sheets API usage
4. Monitor quota limits

### Check Errors

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for storage issues

## Rollback

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push -f origin main
```

## Performance Optimization

1. **Enable caching**:
   - Cache products in localStorage
   - Cache user profile
   - Implement stale-while-revalidate

2. **Reduce API calls**:
   - Batch read operations
   - Debounce search inputs
   - Use pagination for large datasets

3. **Optimize bundle**:
   - Lazy load routes
   - Code splitting
   - Tree shaking

4. **CDN**:
   - GitHub Pages uses CDN automatically
   - Assets are cached globally

## Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update major versions
npm install react@latest react-dom@latest
```

### Monitor Issues

- Check GitHub Issues
- Monitor LINE OA messages
- Review error logs
- Track API quota usage

### Backup

- Google Sheets auto-saves
- Keep git history
- Export data periodically
- Document changes in CHANGELOG.md
