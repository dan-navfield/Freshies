# Freshies - Teen Skincare Safety App

> AI-powered skincare product scanner and safety analyzer for teens and parents

## 🎯 What is Freshies?

Freshies is a React Native mobile app that helps teens and parents make informed decisions about skincare products. Using AI and comprehensive ingredient databases, it provides safety scores, personalized routine recommendations, and gamified engagement to build healthy skincare habits.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## 📱 Tech Stack

### Core Framework
- **Expo SDK 54** + React Native 0.81.5
- **Expo Router** - File-based routing with route groups
- **TypeScript 5.9.2** - Type-safe development

### Backend & Services
- **Supabase** - PostgreSQL database, Auth, Storage
- **OpenAI GPT-4** - AI product analysis
- **Anthropic Claude** - Alternative AI provider
- **Mistral AI** - Multi-provider support

### State Management
- **React Context API** - Auth & child profile
- **Zustand** - Feature-specific stores
- **AsyncStorage** - Persistent preferences

### UI & Design
- **Lucide React Native** - Icon library
- **Custom Design System** - Design tokens & components

## 🏗️ Architecture

Freshies uses a **module-based architecture** with domain-driven design:

```
src/modules/
├── identity/          # User auth, household, family
├── product-discovery/ # Barcode, OCR, AI vision
├── product-library/   # Shelf, usage, wishlist
├── safety/            # Fresh score calculation
├── ingredients/       # COSING database
├── routines/          # Skincare routine builder
├── recommendations/   # AI suggestions
├── gamification/      # Achievements, streaks
├── learning/          # Educational content
├── notifications/     # Push notifications
├── parent-controls/   # Approvals, family
├── admin/             # Content management
├── settings/          # User preferences
└── subscription/      # Billing (future)
```

**See [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) for complete details.**

## 📚 Documentation

### For Developers
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Complete developer reference
  - Tech stack details
  - Module structure & import patterns
  - Service layer documentation
  - State management guide
  - Authentication flows

### For Contributors
- **[ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)** - Visual architecture guide
  - Module map & dependencies
  - Directory structure
  - Design patterns & best practices

### Migration Documentation
- **[MODULE_MIGRATION_PLAN.md](MODULE_MIGRATION_PLAN.md)** - Detailed migration history
- **[MODULE_RESTRUCTURE_SUMMARY.md](MODULE_RESTRUCTURE_SUMMARY.md)** - Executive summary

## 🎮 Key Features

### For Teens (Child Mode)
- 📸 Product barcode & ingredient scanning
- 🎯 Personalized skincare routines
- 🏆 Achievement system & streak tracking
- 📚 Educational content about ingredients
- 💬 AI chat assistant (FreshiesAI)
- 📊 Progress tracking & before/after photos

### For Parents (Parent Mode)
- 👨‍👩‍👧‍👦 Family management & child profiles
- ✅ Product approval workflows
- 🔐 Granular permission controls
- 📈 Activity monitoring & insights
- 🚨 Safety alerts & notifications

### Core Technology
- 🔍 Multi-method product identification (barcode, OCR, AI vision)
- 🧪 COSING ingredient database integration
- 🎨 Fresh Score™ safety calculation
- 🤖 Multi-provider AI (OpenAI, Claude, Mistral)
- 🔔 Smart notifications & reminders

## 🔐 Environment Setup

### Required Secrets (via EAS Secrets)
```bash
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...

# Backend
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...

# Analytics & Monitoring
SENTRY_DSN=https://...
POSTHOG_KEY=phc_...
```

### EAS Configuration
Edit bundle IDs in `app.json`:
- `ios.bundleIdentifier`
- `android.package`

Profiles in `eas.json`:
- `development` - Dev builds
- `preview` - TestFlight/Internal testing
- `production` - Production releases

## 📦 Project Structure

```
freshies-app/
├── app/                    # Expo Router routes
│   ├── (auth)/            # Authentication flow
│   ├── (onboarding)/      # User onboarding
│   ├── (child)/           # Child interface
│   ├── (parent)/          # Parent interface
│   └── (shared)/          # Shared routes
├── src/
│   ├── modules/           # Feature modules (15 domains)
│   ├── components/        # UI components
│   ├── contexts/          # React contexts
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   ├── utils/             # Helper functions
│   ├── theme/             # Design tokens
│   └── lib/               # Third-party configs
├── assets/                # Images, fonts, animations
├── supabase/              # Database migrations
└── scripts/               # Build & data scripts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 🚢 Deployment

### TestFlight (iOS)
```bash
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

### Internal Testing (Android)
```bash
eas build --platform android --profile preview
eas submit --platform android --latest
```

### Production
```bash
eas build --platform all --profile production
eas submit --platform all --latest
```

**See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed deployment guide.**

## 🤝 Contributing

1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) to understand the architecture
2. Create a feature branch from `main`
3. Follow the module-based structure for new features
4. Update documentation for significant changes
5. Ensure tests pass and types check
6. Submit a pull request with clear description

## 📄 License

Copyright © 2026 Freshies. All rights reserved.

## 📞 Support

- **Documentation**: Check the guides in this repository
- **Issues**: [GitHub Issues](https://github.com/dan-navfield/Freshies/issues)
- **Questions**: Contact the team

---

Built with ❤️ using Expo, React Native, and AI
