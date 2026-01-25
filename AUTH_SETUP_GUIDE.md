# 🔐 Authentication Setup Guide

## Issue 1: Email Verification Failing

### Why It's Happening
Supabase has **email confirmation enabled by default**, which requires users to:
1. Receive a confirmation email
2. Click the link in the email
3. Get redirected back to your app

### ✅ Solution A: Disable Email Confirmation (For Development/Testing)

**Step 1: Go to Supabase Dashboard**
- Open [supabase.com](https://supabase.com)
- Select your project
- Go to: **Authentication** → **Providers** → **Email**

**Step 2: Disable Email Confirmation**
- Find: "Confirm email"
- Toggle: **OFF** (disable it)
- Click: **Save**

**Step 3: Test**
- Go back to your app
- Create account
- Should work instantly ✅

---

### ✅ Solution B: Keep Email Confirmation (With Free Email Service)

**Recommended: Use Mailgun (5,000 emails/month FREE)**

#### Step 1: Set Up Mailgun Account

1. Go to [mailgun.com](https://mailgun.com)
2. Click **Sign Up**
3. Create account with email & password
4. Verify your email
5. On dashboard, go to **Sending** → **Domain Settings**
6. Copy these credentials:
   - **API Key** (starts with `key-`)
   - **Domain** (e.g., `sandboxXXXXXXXXX.mailgun.org`)
   - **SMTP Username** (e.g., `postmaster@sandboxXXXXXXXXX.mailgun.org`)
   - **SMTP Password**

#### Step 2: Configure Supabase with Mailgun

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Go to: **Authentication** → **SMTP Settings**
3. Fill in the form:
   - **SMTP Host**: `smtp.mailgun.org`
   - **SMTP Port**: `587`
   - **SMTP Username**: `postmaster@sandboxXXXXXXXXX.mailgun.org`
   - **SMTP Password**: (paste your Mailgun password)
   - **Sender Email**: `noreply@sandboxXXXXXXXXX.mailgun.org`
   - **Sender Name**: `Attendance App`
4. Click **Save**

#### Step 3: Enable Email Confirmation

1. Go to: **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to **ON**
3. Toggle **"Confirm email"** (email verification) to **ON**
4. Click **Save**

#### Step 4: Test Email Flow

1. Go back to your app
2. Create a new account with test email
3. Check your email inbox for verification link
4. Click the link to confirm
5. You should be logged in ✅

#### Other Free Email Services (Optional)

**Brevo (formerly Sendinblue)** - RECOMMENDED FOR PRODUCTION
- ✅ 300 emails/day FREE
- ✅ Easy SMTP setup
- ✅ Great deliverability
- Setup: See [Brevo Setup Guide](#brevo-setup-guide) below

**SendGrid** (100 emails/day FREE):
- Go to [sendgrid.com](https://sendgrid.com)
- Sign up & get API key
- In Supabase, select **SendGrid** from provider dropdown
- Paste API key & save

**AWS SES** (62,000 emails/month FREE):
- More complex setup but most emails/month
- Requires AWS account

**Resend** (100 emails/day FREE):
- Modern alternative: [resend.com](https://resend.com)
- Good for developers

#### Step 5: Understand the Flow
```
User creates account 
  ↓ 
Email sent (via Mailgun) 
  ↓ 
User clicks confirmation link 
  ↓ 
Auto login to app ✅
```

#### Troubleshooting Email Issues

**"No email received?"**
- Check spam/promotions folder
- Mailgun free tier requires domain verification (check Mailgun docs)
- Check Supabase Logs: **Auth** → **Logs** for errors

**"Email taking too long?"**
- Mailgun may take 1-5 minutes
- Check email settings in Supabase → **Auth** → **Email Templates**
- Verify SMTP credentials are correct

**"Error: SMTP connection failed"**
- Double-check SMTP credentials
- Verify Mailgun account is active
- Try refreshing Supabase dashboard

---

## Issue 2: Google OAuth Not Working on Localhost

### Why It's Happening
Google OAuth provider requires **authorized redirect URIs**. Localhost is blocked by default for security.

### ✅ Solution: Configure Google OAuth Redirect URLs

**Step 1: Go to Supabase Dashboard**
- Open [supabase.com](https://supabase.com)
- Select your project
- Go to: **Authentication** → **Providers** → **Google**

**Step 2: Add Localhost Redirect URI**
- Find: "Redirect URL" field
- Current URL: `https://your-project.supabase.co/auth/v1/callback`
- This redirects to your app after Google login

**Step 3: Configure Google Cloud Console**
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Find your project
- Go to: **OAuth 2.0 Client IDs**
- Find your app's OAuth ID
- Click: **Edit**
- Go to: **Authorized redirect URIs**

**Step 4: Add These URLs**
```
http://localhost:5173/dashboard
http://localhost:3000/dashboard
http://10.105.65.67:5173/dashboard
```

**Step 5: Save Changes**

**Step 6: Test**
- Restart your dev server
- Go to login page
- Click "Sign in with Google"
- Should work ✅

---

## 📱 Mobile Testing with Google OAuth

If testing on phone (`http://10.105.65.67:5173`):

**Add to Google Cloud Console Authorized URIs:**
```
http://10.105.65.67:5173/dashboard
```

---

## 🛠️ Common Auth Issues & Fixes

### Issue: "Redirect URL mismatch"
**Cause**: Your app's redirect URL doesn't match Google's authorized URLs
**Fix**: Add your exact URL to Google Cloud Console's "Authorized redirect URIs"

### Issue: "Email already exists"
**Cause**: User account was already created
**Fix**: Either:
- Use "Reset Password" to set new password
- Delete the user in Supabase Dashboard (Users tab)
- Use a different email

### Issue: "Email verification not sent"
**Cause**: Email confirmation is disabled, or email provider not configured
**Fix**: Enable email confirmation + configure SendGrid/Mailgun

### Issue: "Magic link expired"
**Cause**: Password reset link works for 24 hours
**Fix**: Request new password reset link

---

## ✅ Checklist Before Going Live

- [ ] Email confirmation: Either enabled with email provider OR disabled for testing
- [ ] Google OAuth: Authorized redirect URIs configured in Google Cloud Console
- [ ] Test account creation with email
- [ ] Test Google OAuth sign in
- [ ] Test password reset
- [ ] Test on mobile phone
- [ ] Test logout

---

## 🚀 Quick Start (For Development)

**Fastest Setup:**

1. **Disable email confirmation** (in Supabase)
   - Auth → Providers → Email → Disable "Confirm email"

2. **Add Google OAuth redirect URIs** (in Google Cloud)
   - Add: `http://localhost:5173/dashboard`
   - Add: `http://10.105.65.67:5173/dashboard` (for mobile)

3. **Test**
   - Create account → works instantly
   - Google login → works instantly
   - All other features → work normally

---

## 📞 Still Not Working?

**For Email Issues:**
- Check Supabase → Logs for error messages
- Verify email confirmation is disabled (for testing)
- Check spam folder for confirmation emails

**For Google OAuth Issues:**
- Check browser console for error messages
- Verify Google Cloud OAuth credentials are correct
- Verify redirect URIs match exactly (case-sensitive)
- Clear browser cache/cookies and try again

---

## � Brevo Setup Guide

### Why Brevo + Supabase?
- Brevo handles SMTP email delivery
- Supabase handles authentication & email templates
- Together = reliable email confirmation

### Step 1: Create Brevo Account & Get SMTP Credentials

1. Go to [brevo.com](https://brevo.com)
2. Click **Sign up**
3. Create account & verify email
4. Go to **SMTP & API**
5. Click **SMTP** tab
6. Enable SMTP if not already enabled
7. Copy credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your Brevo email (usually your account email)
   - **Password**: Generate API key (in Settings → API Keys)

### Step 2: Configure Supabase SMTP Settings

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Go to: **Authentication** → **SMTP Settings**
3. Fill in:
   - **SMTP Host**: `smtp-relay.brevo.com`
   - **SMTP Port**: `587`
   - **SMTP Username**: Your Brevo login email
   - **SMTP Password**: Your Brevo API key/password
   - **Sender Email**: `noreply@yourdomain.com` (or use Brevo's sender email)
   - **Sender Name**: `Attendance System`
4. Click **Test Connection** (should say "Connection successful")
5. Click **Save**

### Step 3: Enable Email Confirmation

1. Go to: **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to **ON**
3. Click **Save**

### Step 4: Test the Flow

1. Go back to your app
2. Create a new account
3. Check email inbox for verification email (may take 1-2 minutes)
4. Click the link
5. You should be logged in ✅

### Brevo Free Plan Limits
- ✅ 300 emails/day (plenty for testing)
- ✅ Unlimited contacts
- ✅ Lifetime free
- No credit card needed

### Troubleshooting Brevo Issues

**"Test Connection Failed"**
- Verify SMTP credentials are exact (copy-paste from Brevo dashboard)
- Check Port is 587 (not 465 or 25)
- Verify Brevo account is active

**"Email not received"**
- Check spam/promotions folder
- Wait 2-3 minutes (Brevo can be slow)
- Check Supabase Logs: **Auth** → **Logs** for delivery errors
- Verify sender email is correct

**"Invalid SMTP Password"**
- Don't use your Brevo login password
- Use the API key from Settings → **API Keys**
- Generate new key if needed

**"Too many emails"**
- Brevo free = 300/day limit
- Upgrade to paid plan or use another service
- Check if test emails are being sent repeatedly

---

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Brevo SMTP Setup](https://www.brevo.com/help-center/smtp-settings/)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Email Configuration](https://supabase.com/docs/guides/auth/auth-email)
