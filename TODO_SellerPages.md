# Seller Pages Improvements Plan

## Overview
Focus on improving the seller (dealer) pages with enhanced profile features, admin communication, and password management.

## Tasks

### 1. Fix DealerStore.jsx Chat Issue ✅ COMPLETED
- [x] Fix "Chat with Dealer" button to properly start conversation with specific dealer
- [x] Pass dealerId to create/select conversation

### 2. Enhance DealerProfile.jsx ✅ COMPLETED
- [x] Add Edit Profile functionality (navigate to DealerSetup with edit mode)
- [x] Add Chat with Admin functionality
- [x] Add Change Password functionality

### 3. Update DealerSetup.jsx ✅ COMPLETED
- [x] Support edit mode for updating profile
- [x] Pre-fill existing data for editing

### 4. Add Search/Filter to Dealer Pages
- [ ] Add search functionality to DealerListings.jsx

### 5. Add password change to AuthContext ✅ COMPLETED
- [x] Add updatePassword function

## Implementation Notes
- Use Firebase Firestore for conversations
- Create admin conversation on first message
- Use Firebase Auth for password change

## Summary of Changes

### Files Modified:
1. **src/context/AuthContext.jsx**
   - Added `updatePassword` import from Firebase Auth
   - Added `changePassword` function
   - Exported `changePassword` in value object

2. **src/pages/DealerProfile.jsx**
   - Added imports for Firestore functions (collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, onSnapshot)
   - Added state for password change modal and chat with admin modal
   - Implemented `handlePasswordChange` function using `changePassword` from AuthContext
   - Implemented `handleChatWithAdmin` to create/view admin conversations
   - Added "Chat with Admin" and "Change Password" menu items
   - Updated "Edit Store" to navigate to `/dealer-setup?edit=true`
   - Added modals for password change and chat with admin

3. **src/pages/DealerSetup.jsx**
   - Added `useSearchParams` import
   - Added `isEditMode` based on URL parameter
   - Updated useEffect to pre-fill form data in edit mode
   - Updated handleSubmit to use updateDoc in edit mode (preserves existing images)
   - Added updatedAt timestamp for edit mode

