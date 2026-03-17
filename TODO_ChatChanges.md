# Chat Widget Changes - TODO

## Task
Make chat box only visible when buyer clicks on a store (not general chat)

## Changes Required:
- [x] Remove `<ChatWidget />` from BuyerHome.jsx (general chat)
- [x] Add `<ChatWidget />` to DealerStore.jsx with `dealerId` prop (store-specific)

## Status:
- [x] CarDetails.jsx - Already has ChatWidget with dealerId, carId, carName props
- [x] BuyerHome.jsx - Removed general chat ✅
- [x] DealerStore.jsx - Added embedded ChatWidget with dealerId ✅

## Summary:
The chat widget is now visible on:
1. DealerStore.jsx - When buyer views a specific store (embedded chat widget)
2. CarDetails.jsx - When buyer views a specific car (floating widget)
3. BuyerChats.jsx - Full chat page for managing conversations

The chat is no longer visible on the general BuyerHome page.

