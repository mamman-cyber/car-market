# Comprehensive Chat Improvements Plan

## Overview
Focus on all chatbox functionality in the project - making improvements and adding dealer-side chat.

## Tasks

### 1. Remove General Chat from Buyer Pages ✅
General chat (dealer selector without specific dealer) should only be accessible from BuyerChats page.
- [x] Remove `<ChatWidget />` from BuyerHome.jsx
- [x] Remove `<ChatWidget />` from BuyerProfile.jsx
- [x] Remove `<ChatWidget />` from BuyerSaved.jsx
- [x] Keep `<ChatWidget />` in BuyerChats.jsx (with preSelectedConv)

### 2. Improve ChatWidget Component ✅
Add features to improve user experience:
- [x] Add unread message count badge on floating button
- [x] Add "new message" indicator for conversations
- [x] Improve message timestamps
- [x] Add auto-scroll to latest message
- [x] Add message delivery status indicators (read receipts)

### 3. Add Dealer-Side Chat Widget ✅
- [x] DealerHome already has built-in chat for responding to inquiries
- [x] Added ChatWidget to DealerStore.jsx for buyers to chat directly with dealers
- [x] Fixed dealer chat to mark messages as read when viewed

### 4. Update Chat Functionality ✅
- [x] Add real-time unread count for buyers
- [x] Make chat work properly across all pages

## Implementation Notes
- ChatWidget is for buyers to initiate chat with dealers
- DealerHome already has built-in chat for responding to inquiries
- DealerStore now has embedded ChatWidget for buyers to view/repond to messages

## Chat Communication Flow:
1. **Buyer → Dealer**: Via ChatWidget on DealerStore or CarDetails page
2. **Dealer → Buyer**: Via Inquiries tab in DealerHome
3. **Admin**: Via AdminChatWidget on AdminDashboard

