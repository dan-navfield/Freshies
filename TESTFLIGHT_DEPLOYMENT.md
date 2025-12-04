# TestFlight Deployment Guide for Freshies

## ✅ Pre-Deployment Checklist Completed

### Dependencies Fixed
- ✅ Installed missing peer dependencies (`expo-application`, `expo-device`)
- ✅ Updated all Expo SDK packages to compatible versions
- ✅ Removed duplicate `@sentry/react-native` dependency
- ✅ Fixed React version conflicts with overrides
- ✅ Added `.npmrc` for legacy peer deps support
- ✅ 16/17 expo-doctor checks passing (1 minor version mismatch is acceptable)

### GitHub Repository
- ✅ Connected to: https://github.com/dan-navfield/Freshies
- ✅ All code pushed to `main` branch
- ✅ Sensitive `.env` file removed from git history
- ✅ `.gitignore` properly configured

### App Configuration
- ✅ Bundle ID: `com.freshies.app`
- ✅ App Name: Freshies
- ✅ Version: 1.0.0
- ✅ iOS permissions configured (Camera, Photo Library)
- ✅ Apple Sign In enabled
- ✅ App icons and splash screens present

---

## 🚀 Deployment Steps

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo Account
```bash
eas login
```

### 3. Configure EAS Project
```bash
eas build:configure
```

### 4. Build for TestFlight (Preview Build)
```bash
eas build --platform ios --profile preview
```

**What this does:**
- Creates an iOS build optimized for internal testing
- Uses bundle ID: `com.freshies.app.preview`
- Uploads to EAS servers
- Takes ~15-20 minutes

### 5. Submit to TestFlight
Once the build completes successfully:

```bash
eas submit --platform ios --latest
```

**You'll need:**
- Apple Developer Account credentials
- App Store Connect API Key (or manual login)
- App-specific password (if using 2FA)

### 6. Alternative: Manual Submit
If `eas submit` has issues, download the `.ipa` file from EAS and upload manually:

1. Go to https://expo.dev/accounts/[your-account]/projects/freshies-app/builds
2. Download the `.ipa` file
3. Use Transporter app (Mac App Store) to upload to TestFlight
4. Or use Application Loader / Xcode Organizer

---

## 📱 TestFlight Setup

### In App Store Connect:
1. Go to https://appstoreconnect.apple.com
2. Navigate to **My Apps** → **Freshies** (create if doesn't exist)
3. Go to **TestFlight** tab
4. Wait for build to process (~5-15 minutes after upload)
5. Add **Internal Testers** (up to 100)
6. Add **External Testers** (requires Beta App Review)

### Test Information Required:
- **Beta App Description**: "Freshies is a kid-friendly skincare app that helps children learn about skincare routines, scan products, and track their progress."
- **Feedback Email**: Your support email
- **Marketing URL**: (optional)
- **Privacy Policy URL**: (required for external testing)

---

## 🔧 Build Profiles Explained

### Development (`eas build --profile development`)
- For local development with dev client
- Bundle ID: `com.freshies.app.dev`
- Includes dev tools and debugging

### Preview (`eas build --profile preview`)
- For internal testing via TestFlight
- Bundle ID: `com.freshies.app.preview`
- Production-like but separate from production

### Production (`eas build --profile production`)
- For App Store release
- Bundle ID: `com.freshies.app`
- Auto-increments build number
- Use this when ready for public release

---

## 🔐 Environment Variables

### Required for Build:
Create `eas.json` secrets or use `.env` file:

```bash
# Add secrets to EAS
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

### Currently in `.env` (not committed):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`
- `EXPO_PUBLIC_BEAUTYFEEDS_API_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY`
- `EXPO_PUBLIC_CLAUDE_API_KEY`

**Note:** Only `EXPO_PUBLIC_*` variables are included in the app bundle.

---

## 🐛 Troubleshooting

### Build Fails with "Missing Credentials"
```bash
eas credentials
```
Follow prompts to configure iOS credentials (certificates, provisioning profiles).

### Build Fails with Dependency Issues
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "Duplicate React" Warning
This is expected due to `sentry-expo`. The app will still build and run correctly.

### TestFlight Upload Rejected
- Check bundle ID matches App Store Connect
- Ensure version/build number is incremented
- Verify all required permissions are declared in `app.json`

---

## 📊 Current Build Status

**Last Check:** December 4, 2024
**Expo Doctor:** 16/17 checks passing
**Dependencies:** All critical packages installed
**Git Status:** Clean, pushed to GitHub
**Ready for Build:** ✅ YES

---

## 🎯 Next Steps After TestFlight

1. **Internal Testing** (1-2 weeks)
   - Test all features on real devices
   - Fix critical bugs
   - Gather feedback from team

2. **External Beta** (2-4 weeks)
   - Submit for Beta App Review
   - Add external testers
   - Iterate based on feedback

3. **App Store Submission**
   - Prepare marketing materials
   - Screenshots (6.5", 6.7", 5.5" displays)
   - App description and keywords
   - Privacy policy and terms of service
   - Submit for App Review

---

## 📝 Important Notes

- **Build Time:** First build takes 15-30 minutes
- **TestFlight Processing:** Additional 5-15 minutes after upload
- **Beta Review:** 24-48 hours for external testing
- **App Review:** 1-3 days for production release

- **Concurrent Builds:** EAS allows 1 concurrent build on free tier
- **Build Minutes:** Check your Expo plan for limits

---

## 🆘 Support Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **TestFlight Guide:** https://developer.apple.com/testflight/
- **Expo Forums:** https://forums.expo.dev/
- **App Store Connect:** https://appstoreconnect.apple.com/

---

## 🔄 Quick Reference Commands

```bash
# Check project status
npx expo-doctor

# Start development build
eas build --profile development --platform ios

# Build for TestFlight
eas build --profile preview --platform ios

# Build for production
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios --latest

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

**Ready to deploy!** Run `eas build --platform ios --profile preview` to start your first TestFlight build.
