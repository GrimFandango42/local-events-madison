# 🔐 Google Authentication & Calendar Integration Setup

This guide walks through setting up Google OAuth authentication and Google Calendar integration for Madison Events.

## 🎯 Privacy-First Implementation

**What we collect:**
- User's name, email, and profile image (from Google)
- Event favorites and preferences 
- Google Calendar access token (for adding events only)

**What we DON'T collect:**
- Browsing history or tracking data
- Existing calendar events (read access)
- Any personal data for advertising

## 📋 Prerequisites

1. Google Cloud Platform account
2. Domain name for production (for OAuth consent screen)

## 🛠️ Step 1: Google Cloud Console Setup

### Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Madison Events" 
4. Click "Create"

### Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - **Google Calendar API**
   - **Google+ API** (for profile info)

### Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select **External** user type → "Create"
3. Fill out required information:
   - **App name**: Madison Events
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
   - **App domain**: https://your-domain.com (production)
   - **Privacy Policy URL**: https://your-domain.com/privacy
   - **Terms of Service URL**: https://your-domain.com/terms

### Add Scopes
1. Click "Add or Remove Scopes"
2. Add these scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.events`

### Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: **Web application**
4. Name: "Madison Events Web Client"
5. **Authorized redirect URIs**:
   - Development: `http://localhost:5000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
6. Click "Create"
7. **Save the Client ID and Client Secret** - you'll need these!

## 🔧 Step 2: Environment Configuration

Update your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your-super-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (existing)
DATABASE_URL="file:./dev.db"
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## 🗄️ Step 3: Database Migration

Run the database migration to add authentication tables:

```bash
# Generate Prisma client with new schema
npm run db:generate

# Push schema changes to database
npm run db:push
```

Or manually run the SQL in `prisma/schema-auth-update.sql`.

## 🧪 Step 4: Testing Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication flow:**
   - Visit `http://localhost:5000/auth/signin`
   - Click "Sign in with Google"
   - Grant permissions for profile and calendar access
   - Should redirect back to homepage with session

3. **Test calendar integration:**
   - Browse to an event
   - Click "Add to Calendar" button
   - Check that event appears in your Google Calendar

## 🚀 Step 5: Production Deployment

### Update OAuth Settings
1. Add production domain to OAuth redirect URIs
2. Update `NEXTAUTH_URL` to production domain
3. Verify OAuth consent screen information

### Environment Variables
Set these in your production environment:
- `NEXTAUTH_URL=https://your-domain.com`
- `NEXTAUTH_SECRET=your-production-secret`
- `GOOGLE_CLIENT_ID=your-client-id`
- `GOOGLE_CLIENT_SECRET=your-client-secret`

## 🔒 Security Considerations

### Token Management
- Access tokens are stored encrypted in the database
- Refresh tokens handle automatic token renewal
- Sessions expire after 30 days

### Scope Permissions
- **Calendar Events**: Write-only access (can add events, cannot read existing)
- **Profile**: Basic profile information only
- **Email**: For user identification and notifications

### Privacy Controls
- Users can revoke access anytime via Google Account settings
- Minimal data collection with transparent privacy policy
- No third-party data sharing or tracking

## 🐛 Troubleshooting

### Common Issues

**"redirect_uri_mismatch"**
- Ensure redirect URI in Google Console matches your domain exactly
- Check for http vs https mismatch

**"invalid_client"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that OAuth client is enabled

**Calendar API errors**
- Ensure Google Calendar API is enabled
- Verify scope permissions include `calendar.events`
- Check that user granted calendar permissions

### Debug Mode
Enable debug logging in development:
```javascript
// In NextAuth config
debug: process.env.NODE_ENV === "development"
```

## 📝 User Experience

### Authentication Flow
1. User clicks "Sign in with Google"
2. Redirected to transparent consent screen
3. Permissions clearly explained:
   - Profile access for personalization
   - Calendar access for adding events
4. After consent, redirected back to app

### Calendar Integration
- "Add to Calendar" button on each event
- One-click addition to user's Google Calendar
- Events include source attribution
- Clear success/error feedback

## 🎉 Completion

Once setup is complete, users can:
- ✅ Sign in securely with Google
- ✅ Save favorite events and venues  
- ✅ Add events directly to Google Calendar
- ✅ Maintain full privacy and data control

The authentication system is designed to be transparent, privacy-focused, and user-friendly while enabling powerful calendar integration features.