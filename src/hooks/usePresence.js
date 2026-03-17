import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Hook to manage online/offline status and typing indicators
export function usePresence(conversationId = null) {
    const { currentUser } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef(null);

    // 1. Manage current user's online status
    useEffect(() => {
        if (!currentUser?.uid) return;

        const userStatusRef = doc(db, 'user_status', currentUser.uid);

        const setOnlineStatus = async (status) => {
            try {
                await setDoc(userStatusRef, {
                    isOnline: status,
                    lastSeen: serverTimestamp(),
                    typingIn: null
                }, { merge: true });
            } catch (error) {
                console.error("Error setting presence:", error);
            }
        };

        // Set online when component mounts
        setOnlineStatus(true);

        // Handle page visibility changes (switching tabs)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setOnlineStatus(true);
            } else {
                setOnlineStatus(false);
            }
        };

        // Handle window unload (closing tab/browser)
        const handleBeforeUnload = () => {
            // Note: sendBeacon might be more reliable here if setDoc fails on unload,
            // but standard Firebase practice relies on onDisconnect for RTDB, 
            // and manual status setting for Firestore.
            setOnlineStatus(false);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            setOnlineStatus(false);
        };
    }, [currentUser]);

    // 2. Set user as typing
    const setTyping = async (isTyping) => {
        if (!currentUser?.uid) return;

        try {
            const userStatusRef = doc(db, 'user_status', currentUser.uid);
            await setDoc(userStatusRef, {
                typingIn: isTyping ? conversationId : null
            }, { merge: true });
        } catch (error) {
            console.error("Error setting typing status:", error);
        }
    };

    // 3. Handle input change (debounced typing indicator)
    const handleTyping = () => {
        setTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
        }, 2000); // Stop typing after 2 seconds of inactivity
    };

    return { handleTyping, setTyping };
}
