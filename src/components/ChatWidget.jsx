import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp,
    increment,
} from 'firebase/firestore';
import { usePresence } from '../hooks/usePresence';

export default function ChatWidget({ dealerId, carId, carName, preSelectedConv }) {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [dealers, setDealers] = useState([]);
    const [dealerData, setDealerData] = useState(null);
    const [totalUnread, setTotalUnread] = useState(0);
    const messagesEndRef = useRef(null);

    // Presence integrations
    const [dealerPresence, setDealerPresence] = useState({ isOnline: false, typingIn: null });
    const { handleTyping } = usePresence(selectedConversation?.id);

    useEffect(() => {
        const savedIsOpen = localStorage.getItem('chatWidgetOpen');
        const savedDealerId = localStorage.getItem('chatWidgetDealerId');
        const savedConv = localStorage.getItem('chatWidgetSelectedConv');

        if (savedIsOpen === 'true' && savedDealerId) {
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
        localStorage.setItem('chatWidgetOpen', isOpen.toString());
        if (dealerId) {
            localStorage.setItem('chatWidgetDealerId', dealerId);
        }
    }, [isOpen, dealerId]);

    useEffect(() => {
        if (selectedConversation) {
            localStorage.setItem('chatWidgetSelectedConv', JSON.stringify({
                dealerId: selectedConversation.dealerId,
                dealerName: selectedConversation.dealerName,
                id: selectedConversation.id
            }));
        } else {
            localStorage.removeItem('chatWidgetSelectedConv');
        }
    }, [selectedConversation]);

    useEffect(() => {
        if (!dealerId) return;

        const fetchDealerInfo = async () => {
            try {
                const dealerDoc = await getDoc(doc(db, 'dealers', dealerId));
                if (dealerDoc.exists()) {
                    setDealerData({ id: dealerDoc.id, ...dealerDoc.data() });
                }
            } catch (error) {
                console.error('Error fetching dealer:', error);
            }
        };

        fetchDealerInfo();
    }, [dealerId]);

    useEffect(() => {
        if (!currentUser) return;

        // Get all dealers
        getDocs(collection(db, 'dealers')).then(snapshot => {
            setDealers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(console.error);

        // Get all conversations and filter in memory
        const unsubscribe = onSnapshot(collection(db, 'conversations'), (snapshot) => {
            const allConvs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const buyerConvs = allConvs.filter(c => c.buyerId === currentUser.uid);
            buyerConvs.sort((a, b) => {
                const timeA = a.lastMessageTime?.toDate?.()?.getTime() || 0;
                const timeB = b.lastMessageTime?.toDate?.()?.getTime() || 0;
                return timeB - timeA;
            });
            setConversations(buyerConvs);
            const unreadCount = buyerConvs.reduce((sum, conv) => sum + (conv.buyerUnreadCount || 0), 0);
            setTotalUnread(unreadCount);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!selectedConversation || !selectedConversation.id) {
            setMessages([]);
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'messages'), (snapshot) => {
            const allMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const convMsgs = allMsgs.filter(m => m.conversationId === selectedConversation.id);
            convMsgs.sort((a, b) => {
                const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
                const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
                return timeA - timeB;
            });
            setMessages(convMsgs);

            const unreadMsgs = convMsgs.filter(msg => msg.senderId !== currentUser.uid && !msg.read);
            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach((msg) => {
                    updateDoc(doc(db, 'messages', msg.id), { read: true }).catch(console.error);
                });
                updateDoc(doc(db, 'conversations', selectedConversation.id), { buyerUnreadCount: 0 }).catch(console.error);
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedConversation?.id, currentUser]);

    // Listen to Dealer's Presence Status
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

    useEffect(() => {
        if (preSelectedConv) {
            setSelectedConversation(preSelectedConv);
            setIsOpen(true);
        } else if (dealerId && currentUser && conversations !== null) {
            const existingConv = conversations.find(c => c.dealerId === dealerId);
            if (existingConv) {
                setSelectedConversation(existingConv);
                setIsOpen(true);
            } else if (!selectedConversation && dealerData) {
                setSelectedConversation({
                    dealerId: dealerId,
                    dealerName: dealerData?.storeName || 'Dealer',
                    isNew: true
                });
                setIsOpen(true);
            }
        }
    }, [dealerId, conversations, currentUser, dealerData, preSelectedConv]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            let conversationId = selectedConversation.id;

            if (selectedConversation.isNew) {
                // Check if conversation already exists for this buyer-dealer pair
                const existingConvsSnapshot = await getDocs(query(
                    collection(db, 'conversations'),
                    where('buyerId', '==', currentUser.uid),
                    where('dealerId', '==', selectedConversation.dealerId)
                ));
                
                if (!existingConvsSnapshot.empty) {
                    // Use existing conversation
                    const existingConv = existingConvsSnapshot.docs[0];
                    conversationId = existingConv.id;
                    setSelectedConversation({
                        id: conversationId,
                        dealerId: selectedConversation.dealerId,
                        dealerName: selectedConversation.dealerName || dealerData?.storeName || 'Dealer'
                    });
                } else {
                    // Create new conversation
                    const convRef = await addDoc(collection(db, 'conversations'), {
                        buyerId: currentUser.uid,
                        dealerId: selectedConversation.dealerId,
                        dealerName: selectedConversation.dealerName || dealerData?.storeName || 'Dealer',
                        buyerName: currentUser.displayName || currentUser.email || 'Buyer',
                        lastMessage: newMessage.trim(),
                        lastMessageTime: serverTimestamp(),
                        buyerUnreadCount: 0,
                        dealerUnreadCount: 1,
                        createdAt: serverTimestamp()
                    });
                    conversationId = convRef.id;
                    setSelectedConversation({
                        id: conversationId,
                        dealerId: selectedConversation.dealerId,
                        dealerName: selectedConversation.dealerName || dealerData?.storeName || 'Dealer'
                    });
                }
            }

            await addDoc(collection(db, 'messages'), {
                conversationId: conversationId,
                senderId: currentUser.uid,
                senderType: 'buyer',
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

    const getDealerName = (dId) => {
        const dealer = dealers.find(d => d.id === dId);
        return dealer?.storeName || 'Dealer';
    };

    // Main render
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>

            <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
                <div className="bg-blue-600 p-3 flex items-center justify-between rounded-t-lg">
                    <h3 className="text-white font-semibold flex flex-col">
                        <span>{selectedConversation ? (selectedConversation.dealerName || getDealerName(selectedConversation.dealerId)) : 'Messages'}</span>
                        {selectedConversation && dealerPresence.isOnline && (
                            <span className="text-xs text-blue-200 flex items-center gap-1 font-normal">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span> Online
                            </span>
                        )}
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {!currentUser ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <p className="text-gray-500 text-center">Please log in to chat</p>
                    </div>
                ) : conversations === null ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : selectedConversation ? (
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {messages.length === 0 ? (
                                <p className="text-gray-400 text-center text-sm">Start a conversation</p>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === currentUser.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-2 rounded-lg ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                                {isMe && (
                                                    <div className="flex justify-end mt-1">
                                                        <span className="text-[10px] text-blue-200">
                                                            {msg.read ? '✓✓' : '✓'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {dealerPresence.typingIn === selectedConversation.id && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-500 rounded-lg p-2 rounded-bl-sm text-xs flex items-center gap-1">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-2 border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 justify-center flex items-center text-white w-9 h-9 rounded-full disabled:opacity-50 transition-colors hover:bg-blue-700">
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                            <select
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    const selectedDealerId = e.target.value;
                                    const dealer = dealers.find(d => d.id === selectedDealerId);
                                    const existingConv = conversations.find(c => c.dealerId === selectedDealerId);
                                    if (existingConv) {
                                        setSelectedConversation(existingConv);
                                    } else {
                                        setSelectedConversation({
                                            dealerId: selectedDealerId,
                                            dealerName: dealer?.storeName || 'Dealer',
                                            isNew: true
                                        });
                                    }
                                    e.target.value = '';
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                            >
                                <option value="">Select a dealer...</option>
                                {dealers.map(dealer => (
                                    <option key={dealer.id} value={dealer.id}>
                                        {dealer.storeName || dealer.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {conversations && conversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">No conversations yet</p>
                            </div>
                        ) : conversations && conversations.length > 0 && (
                            <div>
                                {conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600">D</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{conv.dealerName || getDealerName(conv.dealerId)}</p>
                                                <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages'}</p>
                                            </div>
                                            {(conv.buyerUnreadCount > 0) && (
                                                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{conv.buyerUnreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
