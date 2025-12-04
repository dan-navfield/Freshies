# 🔍 Google Cloud Vision API Setup

## Quick Setup (5 minutes)

### 1. **Get Your API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Cloud Vision API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### 2. **Add to Your .env File**

Create or update `.env` in your project root:

```bash
# Google Cloud Vision API
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_api_key_here
```

### 3. **Restart Your Dev Server**

```bash
npm start
```

That's it! The app will now use Google Cloud Vision for barcode scanning from photos.

---

## 💰 Pricing

**Free Tier:**
- First 1,000 images/month: **FREE**
- After that: $1.50 per 1,000 images

**For your use case:**
- Even with 100 users scanning 10 products/month = 1,000 scans = **FREE**
- Very affordable for MVP/testing

---

## 🎯 What You Get

✅ **Excellent barcode detection:**
- Works with curved surfaces (lipstick, bottles)
- Handles poor lighting
- Detects multiple barcode formats
- Works with blurry/low-quality images

✅ **Fallback system:**
- Tries Cloud Vision first
- Falls back to expo-camera if not configured
- Graceful degradation

---

## 🔒 Security Best Practices

### **For Production:**

1. **Restrict your API key:**
   - Go to API key settings in Google Cloud Console
   - Add "Application restrictions" → "iOS apps" or "Android apps"
   - Add your bundle ID: `com.freshies.app`

2. **Set API restrictions:**
   - Restrict to "Cloud Vision API" only

3. **Monitor usage:**
   - Set up billing alerts
   - Monitor in Google Cloud Console

### **Alternative (More Secure):**

Instead of client-side API calls, you can:
1. Create a backend endpoint (Supabase Edge Function)
2. Call Cloud Vision from your backend
3. Keep API key server-side only

---

## 🧪 Testing

Once configured, test with your product images:

1. Open app
2. Tap purple "Upload" button
3. Select product image
4. Cloud Vision will detect the barcode
5. Check console logs for "✅ Found barcode with Cloud Vision"

---

## 🐛 Troubleshooting

**"Cloud Vision API key not configured"**
- Make sure `.env` file exists in project root
- Restart dev server after adding API key
- Check variable name: `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`

**"API error: 403"**
- API key is invalid or restricted
- Make sure Cloud Vision API is enabled
- Check API key restrictions

**"No barcode detected"**
- Image quality too low
- Barcode not visible/clear enough
- Try cropping closer to barcode

---

## 📚 Resources

- [Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
