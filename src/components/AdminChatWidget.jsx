import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp,
    increment,
} from 'firebase/firestore';
import { usePresence } from '../hooks/usePresence';

export default function AdminChatWidget() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const messagesEndRef = useRef(null);

    // Advanced Chat Features
    const [searchQuery, setSearchQuery] = useState('');
    const [dealerPresence, setDealerPresence] = useState({ isOnline: false, typingIn: null });
    const { handleTyping } = usePresence(selectedConversation?.id);

    // Load initial state from localStorage
    useEffect(() => {
        const savedIsOpen = localStorage.getItem('adminChatOpen');
        const savedConv = localStorage.getItem('adminChatSelectedConv');

        if (savedIsOpen === 'true') {
            setIsOpen(true);
        }

        if (savedConv) {
            try {
                const parsedConv = JSON.parse(savedConv);
                setSelectedConversation(parsedConv);
            } catch (e) {
                console.error('Error parsing saved conversation:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('adminChatOpen', isOpen.toString());
    }, [isOpen]);

    useEffect(() => {
        if (selectedConversation) {
            localStorage.setItem('adminChatSelectedConv', JSON.stringify({
                dealerId: selectedConversation.dealerId,
                dealerName: selectedConversation.dealerName,
                id: selectedConversation.id
            }));
        } else {
            localStorage.removeItem('adminChatSelectedConv');
        }
    }, [selectedConversation]);

    // Fetch all dealers
    useEffect(() => {
        const fetchDealers = async () => {
            try {
                const dealersQuery = query(collection(db, 'dealers'));
                const dealersSnapshot = await getDocs(dealersQuery);
                const dealersData = dealersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDealers(dealersData);
            } catch (error) {
                console.error('Error fetching dealers:', error);
            }
        };

        fetchDealers();
    }, []);

    // Fetch conversations where admin is involved
    useEffect(() => {
        if (!currentUser) return;

        const fetchConversations = async () => {
            try {
                // Query for all conversations, filter admin chats in memory
                const convQuery = query(
                    collection(db, 'conversations')
                );

                const unsubscribe = onSnapshot(convQuery, (snapshot) => {
                    let convs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Filter for admin conversations in memory to avoid query failures
                    convs = convs.filter(conv => conv.isAdminConversation === true);

                    // Sort in memory to avoid needing a Firestore composite index
                    convs.sort((a, b) => {
                        const timeA = a.lastMessageTime?.toDate?.()?.getTime() || 0;
                        const timeB = b.lastMessageTime?.toDate?.()?.getTime() || 0;
                        return timeB - timeA;
                    });

                    setConversations(convs);

                    const unreadCount = convs.reduce((sum, conv) => sum + (conv.adminUnreadCount || 0), 0);
                    setTotalUnread(unreadCount);

                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching conversations:', error);
                setLoading(false);
            }
        };

        fetchConversations();
    }, [currentUser]);

    // Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConversation || !selectedConversation.id) {
            setMessages([]);
            return;
        }

        const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', selectedConversation.id)
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            msgs.sort((a, b) => {
                const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
                const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
                return timeA - timeB;
            });

            setMessages(msgs);

            // Mark messages as read
            const unreadMsgs = msgs.filter(msg =>
                msg.senderType !== 'admin' && !msg.read
            );
            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach((msg) => {
                    updateDoc(doc(db, 'messages', msg.id), {
                        read: true
                    }).catch(e => console.error('Error marking message as read:', e));
                });

                updateDoc(doc(db, 'conversations', selectedConversation.id), {
                    adminUnreadCount: 0
                }).catch(e => console.error('Error resetting unread count:', e));
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedConversation?.id, currentUser]);

    // Listen to Dealer's Presence
    useEffect(() => {
        if (!selectedConversation?.dealerId) return;

        const presenceRef = doc(db, 'user_status', selectedConversation.dealerId);
        const unsubscribe = onSnapshot(presenceRef, (docSnap) => {
            if (docSnap.exists()) {
                setDealerPresence(docSnap.data());
            } else {
                setDealerPresence({ isOnline: false, typingIn: null });
            }
        });

        return () => unsubscribe();
    }, [selectedConversation?.dealerId]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            let conversationId = selectedConversation.id;

            if (selectedConversation.isNew) {
                const convRef = await addDoc(collection(db, 'conversations'), {
                    dealerId: selectedConversation.dealerId,
                    dealerName: selectedConversation.dealerName,
                    lastMessage: newMessage.trim(),
                    lastMessageTime: serverTimestamp(),
                    adminUnreadCount: 0,
                    dealerUnreadCount: 1,
                    createdAt: serverTimestamp(),
                    isAdminChat: true
                });
                conversationId = convRef.id;

                setSelectedConversation({
                    id: conversationId,
                    dealerId: selectedConversation.dealerId,
                    dealerName: selectedConversation.dealerName
                });
            }

            await addDoc(collection(db, 'messages'), {
                conversationId: conversationId,
                senderId: currentUser.uid,
                senderType: 'admin',
                content: newMessage.trim(),
                createdAt: serverTimestamp(),
                read: true
            });

            await updateDoc(doc(db, 'conversations', conversationId), {
                lastMessage: newMessage.trim(),
                lastMessageTime: serverTimestamp(),
                dealerUnreadCount: increment(1)
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const getDealerName = (dealerId) => {
        const dealer = dealers.find(d => d.id === dealerId);
        return dealer?.storeName || dealer?.businessName || dealer?.email || 'Dealer';
    };

    const getFormattedDealerName = (dealerId) => {
        const dealer = dealers.find(d => d.id === dealerId);
        if (!dealer) return 'Unknown Store';
        const store = dealer.storeName || dealer.businessName || 'Store';
        const owner = dealer.firstName ? `${dealer.firstName} ${dealer.lastName || ''}`.trim() : dealer.email;
        return owner ? `${store} — ${owner}` : store;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    };

    // Get dealers that haven't been chatted with yet
    const availableDealers = dealers.filter(
        d => !conversations.some(c => c.dealerId === d.id)
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            >
                <span className="material-symbols-outlined text-2xl">support_agent</span>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 bg-white dark:bg-[#1b1f27] rounded-2xl shadow-2xl w-[380px] h-[550px] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                    <div className="bg-red-600 p-4 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined">support_agent</span>
                            Admin Chat
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : selectedConversation ? (
                            <div className="flex flex-col h-full">
                                <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="flex items-center gap-1 text-red-600 text-sm hover:text-red-700"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                        Back to conversations
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center">
                                            <p className="text-gray-400 text-sm">Start a conversation with {selectedConversation.dealerName || getDealerName(selectedConversation.dealerId)}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-3 rounded-2xl ${msg.senderType === 'admin'
                                                        ? 'bg-red-600 text-white rounded-br-sm'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.content}</p>

                                                    <div className={`flex justify-end gap-1 mt-1 ${msg.senderType === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                                                        <span className="text-[10px]">
                                                            {msg.createdAt?.toDate ? formatTime(msg.createdAt) : ''}
                                                        </span>
                                                        {msg.senderType === 'admin' && (
                                                            <span className="text-[10px]">
                                                                {msg.read ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {dealerPresence.typingIn === selectedConversation.id && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl p-3 rounded-bl-sm text-xs flex items-center gap-1">
                                                <span className="animate-bounce">●</span>
                                                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                                                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping();
                                            }}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-600"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="bg-red-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-red-700"
                                        >
                                            <span className="material-symbols-outlined">send</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {/* Start new conversation */}
                                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 mb-2">Start new conversation with dealer</p>
                                    <select
                                        onChange={async (e) => {
                                            if (!e.target.value) return;
                                            const selectedDealerId = e.target.value;
                                            const dealer = dealers.find(d => d.id === selectedDealerId);

                                            // Check if conversation already exists
                                            const existingConv = conversations.find(c => c.dealerId === selectedDealerId);
                                            if (existingConv) {
                                                setSelectedConversation(existingConv);
                                            } else {
                                                setSelectedConversation({
                                                    dealerId: selectedDealerId,
                                                    dealerName: dealer?.storeName || dealer?.businessName || 'Dealer',
                                                    isNew: true
                                                });
                                            }
                                            e.target.value = '';
                                        }}
                                        value=""
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-600"
                                    >
                                        <option value="">Select a dealer...</option>
                                        {availableDealers.map(dealer => (
                                            <option key={dealer.id} value={dealer.id}>
                                                {dealer.storeName || dealer.businessName || dealer.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {conversations.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                                        <p className="mt-2 text-sm">No conversations yet</p>
                                        <p className="text-xs text-gray-400">Select a dealer above to start chatting</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full border-t border-gray-100 dark:border-gray-700">
                                        {/* Search Bar */}
                                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 text-sm">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Search stores or dealers..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-red-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[300px]">
                                            {conversations
                                                .filter(conv => {
                                                    if (!searchQuery) return true;
                                                    const name = getFormattedDealerName(conv.dealerId).toLowerCase();
                                                    return name.includes(searchQuery.toLowerCase());
                                                })
                                                .map(conv => (
                                                    <div
                                                        key={conv.id}
                                                        onClick={() => setSelectedConversation(conv)}
                                                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${conv.adminUnreadCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center relative">
                                                                <span className="material-symbols-outlined text-red-600">
                                                                    store
                                                                </span>
                                                                {(conv.adminUnreadCount > 0) && (
                                                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center">
                                                                        {conv.adminUnreadCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <p className={`font-medium truncate ${conv.adminUnreadCount > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-900 dark:text-white'}`}>
                                                                        {getFormattedDealerName(conv.dealerId)}
                                                                    </p>
                                                                    <span className="text-xs text-gray-400">
                                                                        {formatTime(conv.lastMessageTime)}
                                                                    </span>
                                                                </div>
                                                                {conv.lastMessage && (
                                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                                        {conv.lastMessage}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {searchQuery && conversations.filter(conv => getFormattedDealerName(conv.dealerId).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                <p className="text-center text-gray-500 text-sm py-4">No results found for "{searchQuery}"</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

