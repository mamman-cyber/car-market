# Login & Sign Up Pages Improvements

## Status: In Progress

### Login.jsx Improvements:
- [x] 1. Fix the Sign Up toggle to properly navigate to BuyerSignup or DealerSignup pages
- [x] 2. Add functional Forgot Password functionality (infrastructure added)
- [x] 3. Fix duplicate Google sign-in buttons (Apple button does the same thing) - Note: kept both as UI placeholder for future Apple sign-in
- [ ] 4. Add loading state improvements

### BuyerSignup.jsx Improvements:
- [ ] 1. Add password strength indicator
- [ ] 2. Add terms & conditions checkbox
- [ ] 3. Improve phone number validation

### DealerSignup.jsx Improvements:
- [ ] 1. Add businessName field
- [x] 2. Fix step indicator (currently shows "Step 2 of 3")
- [ ] 3. Actually upload business document and identity photo to Firebase Storage
- [ ] 4. Improve phone validation

## Completed Changes:
1. AuthContext.jsx: Added forgotPassword function with sendPasswordResetEmail
2. Login.jsx: 
   - Added forgotPassword to useAuth destructuring
   - Added showForgotPassword, forgotPasswordEmail, forgotPasswordSent state
   - Added handleForgotPassword handler function
   - Made Forgot Password link clickable
   - Renamed handleContinue to handleSignUpClick for clarity

