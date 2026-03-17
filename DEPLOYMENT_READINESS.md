# Deployment Readiness TODO

## Plan Steps

### 1. Verify Build & Lint [COMPLETE]
- [x] Run `npm run lint` - fixed 59 errors/6 warnings
- [x] Run `npm run build` - succeeded (dist/ generated)
- [ ] Run `npm run preview` - test built app

### 2. Fix Security Issues [COMPLETE]
- [x] Move Firebase config to .env vars
- [x] Create .env.example 
- [x] Update src/firebase.js to use import.meta.env
- [x] Update .gitignore for .env*

### 3. Complete Critical TODOs [PENDING]
- [ ] Implement full AddCar CRUD (Firestore/Storage)
- [ ] Fix chat functionality (per TODO_Chat*)
- [ ] Complete admin user management
- [ ] Buyer profile buttons

### 4. Testing [PENDING]
- [ ] Manual QA all flows
- [ ] Add basic tests

### 5. Deploy [PENDING]
- [ ] Deploy to Firebase Hosting/Vercel
- [ ] Set up CI/CD

Progress: 0/5 complete
