# LAMS - Labour Attendance Management System

**Production-Ready Attendance Tracking Application**

---

## 📋 Project Overview

LAMS is a modern, responsive web application for managing labour attendance, wage calculations, and reporting. Built with React, TypeScript, and Supabase for real-time data synchronization.

**Status**: ✅ Production Ready

---

## 🎯 Key Features

- ✅ **Attendance Tracking** - Mark attendance with date picker, bulk operations
- ✅ **Labour Management** - Add, edit, delete records with Aadhaar validation
- ✅ **Salary Reports** - Calculate wages, export PDF/Excel
- ✅ **Real-time Dashboard** - Live stats, charts, trends
- ✅ **User Authentication** - Email/password + Google OAuth
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Data Security** - Row-Level Security, session management
- ✅ **Input Validation** - Complete validation library
- ✅ **User Notifications** - Toast system for feedback
- ✅ **Error Tracking** - Sentry integration ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free at supabase.com)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local

# 3. Add Supabase credentials to .env.local
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 4. Run development server
npm run dev
```

---

## 🔧 Configuration

### Supabase Setup (REQUIRED)

1. Create account at supabase.com
2. Create new project
3. Copy `supabase-schema.sql` to Supabase SQL Editor
4. Run the SQL query
5. Get credentials from Settings → API
6. Add to .env.local:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-key-here
   VITE_APP_ENV=development
   ```

---

## ⭐ Key Features (New Utilities)

### Input Validation
Complete validation library for all forms:
```typescript
import { validateLabour, validateAadhaar } from '@/utils/validation';
```

### Toast Notifications
User feedback system:
```typescript
import { showSuccess, showError } from '@/utils/toast';
showSuccess('Labour added successfully!');
```

### Error Tracking (Optional)
Production error monitoring:
```bash
npm install @sentry/react @sentry/tracing
```

---

## 💻 Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Check code quality
npm run preview  # Preview production build
```

**Tech Stack**: React 19 | TypeScript 5.9 | Vite 7.2 | Supabase

---

## 🌐 Deployment to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com and import your GitHub repo

# 3. Add environment variables in Vercel dashboard:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
#    - VITE_APP_ENV=production

# 4. Click Deploy

# 5. Setup production Supabase (new project)
```

**Time**: ~2-3 hours (setup + deployment + testing)

---

## ✅ Launch Checklist

- [ ] .env.local configured with Supabase credentials
- [ ] Supabase schema imported successfully
- [ ] Build successful: `npm run build`
- [ ] All features tested locally
- [ ] Mobile responsive verified
- [ ] Deployed to Vercel
- [ ] Live URL tested in browser

---

## 🔐 Security Features

- ✅ HTTPS/SSL enabled
- ✅ Row-Level Security (RLS) configured
- ✅ Session expiry (7 days)
- ✅ Protected routes
- ✅ Password hashing
- ✅ Google OAuth support

---

## 📊 Project Structure

```
src/
├── pages/              # Page components
├── components/         # Reusable UI components
├── contexts/          # Auth state management
├── services/          # Database operations
├── utils/             # Helper functions
│   ├── validation.ts  # Input validation
│   ├── toast.ts       # Notifications
│   └── errorTracking.ts # Error tracking
└── types/             # TypeScript definitions
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot find Supabase | Create .env.local with URL and key |
| Build fails | Run `npm install` first |
| Real-time not working | Check Supabase Realtime is enabled |
| Validation errors | Check phone=10 digits, aadhaar=12 digits |

---

## 📞 Resources

- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Vercel**: https://vercel.com/docs

---

## 🎓 Next Steps

1. **Configure**: Set up .env.local with Supabase credentials
2. **Develop**: Run `npm run dev` and test locally
3. **Deploy**: Follow Deployment section above
4. **Monitor**: Optional - setup error tracking with Sentry

**Ready to launch in 1-2 hours!** 🚀

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
