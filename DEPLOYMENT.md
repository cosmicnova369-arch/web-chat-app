# 🚀 Deployment Guide

## Deploy to Render (Recommended - Free Tier)

### Quick Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment Steps

1. **Sign Up to Render**
   - Go to https://render.com
   - Click "Get Started for Free"
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your `web-chat-app` repository
   - Click "Connect"

3. **Configure Settings**
   - **Name**: `web-chat-app`
   - **Region**: Choose closest to your location
   - **Branch**: `master`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your app will be live at: `https://your-app-name.onrender.com`

### Environment Variables
No additional environment variables are required for basic deployment. The app automatically:
- Uses `process.env.PORT` for the port (Render provides this)
- Creates SQLite database automatically
- Sets up uploads directory

### Features Available After Deployment
- ✅ Real-time chat with WebSocket support
- ✅ Private room functionality
- ✅ Image, video, and voice message sharing
- ✅ Message persistence with SQLite
- ✅ File uploads (up to 50MB)
- ✅ Mobile responsive design

### Custom Domain (Optional)
After deployment, you can add a custom domain in Render's dashboard under Settings → Custom Domains.

### Troubleshooting
- **Build fails**: Ensure `package.json` has correct Node.js version (>=14.0.0)
- **App won't start**: Check that start command is `npm start`
- **WebSocket issues**: Render fully supports WebSocket on free tier

### Free Tier Limitations
- App sleeps after 15 minutes of inactivity
- 512MB RAM, 0.1 CPU
- 750 hours/month (plenty for most use cases)

### Production Considerations
For high-traffic production use:
- Upgrade to paid plan for better performance
- Consider using PostgreSQL instead of SQLite
- Add Redis for session management
- Implement user authentication
