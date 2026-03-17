import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc, addDoc, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { usePresence } from '../hooks/usePresence';

export default function DealerHome() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dealerData, setDealerData] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Advanced Chat Features
    const [inboxFilter, setInboxFilter] = useState('all'); // 'all', 'unread'
    const [buyerPresence, setBuyerPresence] = useState({ isOnline: false, typingIn: null });
    const { handleTyping } = usePresence(selectedConversation?.id);

    useEffect(() => {
        const fetchDealerData = async () => {
            if (currentUser) {
                try {
                    const dealerDoc = await getDoc(doc(db, 'dealers', currentUser.uid));
                    if (dealerDoc.exists()) {
                        setDealerData(dealerDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching dealer data:', error);
                }
            }
        };
        fetchDealerData();
    }, [currentUser]);

    useEffect(() => {
        const fetchListings = async () => {
            if (!currentUser) return;

            try {
                const q = query(collection(db, 'cars'), where('dealerId', '==', currentUser.uid));
                const snapshot = await getDocs(q);
                const cars = snapshot.docs.map(docItem => ({
                    id: docItem.id,
                    ...docItem.data()
                }));
                setListings(cars);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const convQuery = query(
            collection(db, 'conversations'),
            where('dealerId', '==', currentUser.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(convQuery, (snapshot) => {
            const convs = snapshot.docs.map(docItem => ({
                id: docItem.id,
                ...docItem.data()
            }));
            setConversations(convs);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!selectedConversation) return;

        const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', selectedConversation.id),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(docItem => ({
                id: docItem.id,
                ...docItem.data()
            }));
            setMessages(msgs);

            // Mark messages as read when dealer views them
            const unreadMsgs = msgs.filter(msg =>
                msg.senderId !== currentUser.uid && !msg.read
            );
            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach((msg) => {
                    updateDoc(doc(db, 'messages', msg.id), {
                        read: true
                    }).catch(e => console.error('Error marking message as read:', e));
                });

                updateDoc(doc(db, 'conversations', selectedConversation.id), {
                    dealerUnreadCount: 0
                }).catch(e => console.error('Error resetting unread count:', e));
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedConversation, currentUser]);

    // Listen to Buyer's Presence Status
    useEffect(() => {
        if (!selectedConversation?.buyerId) return;

        const presenceRef = doc(db, 'user_status', selectedConversation.buyerId);
        const unsubscribe = onSnapshot(presenceRef, (docSnap) => {
            if (docSnap.exists()) {
                setBuyerPresence(docSnap.data());
            } else {
                setBuyerPresence({ isOnline: false, typingIn: null });
            }
        });

        return () => unsubscribe();
    }, [selectedConversation?.buyerId]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleDelete = async (carId) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;

        setDeletingId(carId);
        try {
            await deleteDoc(doc(db, 'cars', carId));
            setListings(prev => prev.filter(car => car.id !== carId));
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (carId) => {
        navigate(`/edit-car/${carId}`);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await addDoc(collection(db, 'messages'), {
                conversationId: selectedConversation.id,
                senderId: currentUser.uid,
                senderType: 'dealer',
                content: newMessage.trim(),
                createdAt: serverTimestamp(),
                read: false
            });

            await updateDoc(doc(db, 'conversations', selectedConversation.id), {
                lastMessage: newMessage.trim(),
                lastMessageTime: serverTimestamp(),
                buyerUnreadCount: increment(1)
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return '₦' + new Intl.NumberFormat('en-NG').format(price);
    };

    const stats = {
        totalListings: listings.length,
        activeListings: listings.filter(car => car.status === 'active').length,
        totalViews: listings.reduce((sum, car) => sum + (car.views || 0), 0),
        inquiries: conversations.length
    };

    const defaultCoverImage = "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&h=400&fit=crop";
    const defaultCarImage = "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop";

    const getCarImage = (car) => {
        if (car.images?.front) return car.images.front;
        if (car.image) return car.image;
        return defaultCarImage;
    };

    // Full screen mobile layout
    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white font-bold">{dealerData?.storeName || 'My Store'}</p>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 no-scrollbar">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dashboard'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'listings'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Listings ({listings.length})
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inquiries'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Inquiries ({conversations.length})
                </button>
            </div>

            {/* Main Content */}
            <div className="p-4 pb-24">

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-4">
                        {/* Store Preview Card */}
                        <div className="relative rounded-xl overflow-hidden">
                            <div
                                className="h-32 bg-cover bg-center"
                                style={{
                                    backgroundImage: dealerData?.logoUrl
                                        ? `url("${dealerData.logoUrl}")`
                                        : `url("${defaultCoverImage}")`
                                }}
                            >
                                <div className="absolute inset-0 bg-black/40"></div>
                            </div>
                            <div className="absolute -bottom-8 left-4">
                                <div className="h-16 w-16 rounded-xl border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gray-200">
                                    {dealerData?.dealerPictureUrl ? (
                                        <img
                                            src={dealerData.dealerPictureUrl}
                                            alt={dealerData.storeName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-300">
                                            <span className="material-symbols-outlined text-2xl text-gray-500">person</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 pb-2">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{dealerData?.storeName || 'My Store'}</h2>
                            {dealerData?.moto && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dealerData.moto}</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/dealer-store/${currentUser?.uid}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/10 text-green-600 text-sm font-medium hover:bg-green-500/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                                View Store
                            </button>
                            <button
                                onClick={() => navigate('/add-car')}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Add Car
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                                <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalListings}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Listings</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                                <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeListings}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                                <span className="material-symbols-outlined text-blue-500 text-xl">visibility</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalViews}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Views</p>
                            </div>
                            <div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => setActiveTab('inquiries')}
                            >
                                <span className="material-symbols-outlined text-orange-500 text-xl">chat</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.inquiries}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Inquiries</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && (
                    <div className="">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">directions_car</span>
                                <p className="text-gray-500 dark:text-gray-400 mt-4">No listings yet</p>
                                <button
                                    onClick={() => navigate('/add-car')}
                                    className="mt-4 text-primary font-medium hover:underline"
                                >
                                    Add your first car
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {listings.map((car) => (
                                    <div
                                        key={car.id}
                                        className="flex gap-3 bg-white dark:bg-gray-800 rounded-xl p-3"
                                    >
                                        <div
                                            className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                                            style={{ backgroundImage: `url("${getCarImage(car)}")` }}
                                        ></div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{car.name}</h3>
                                            <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(car.price)}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${car.status === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {car.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{car.views || 0} views</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleEdit(car.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(car.id)}
                                                disabled={deletingId === car.id}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Inquiries Tab */}
                {activeTab === 'inquiries' && (
                    <div className="">
                        {selectedConversation ? (
                            // Chat View
                            <div className="flex flex-col h-[calc(100vh-200px)]">
                                <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 mb-4">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {selectedConversation.buyerName || 'Buyer'}
                                            {buyerPresence.isOnline && (
                                                <span className="flex items-center gap-1 text-xs text-green-500 font-normal">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {messages.length === 0 ? (
                                        <p className="text-gray-400 text-center text-sm">Start the conversation...</p>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.senderId === currentUser?.uid;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] p-3 rounded-2xl ${isMe
                                                            ? 'bg-primary text-white rounded-br-sm'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        {isMe && (
                                                            <div className="flex justify-end mt-1">
                                                                <span className="text-[10px] text-white/70">
                                                                    {msg.read ? '✓✓' : '✓'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                    {buyerPresence.typingIn === selectedConversation.id && (
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

                                <form onSubmit={handleSendMessage} className="mt-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping();
                                            }}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="bg-primary text-white p-2.5 rounded-full disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined">send</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            // Conversations List
                            <div className="flex flex-col h-full">
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setInboxFilter('all')}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${inboxFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setInboxFilter('unread')}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${inboxFilter === 'unread' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        Unread
                                    </button>
                                </div>
                                {conversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64">
                                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">chat_bubble_outline</span>
                                        <p className="text-gray-500 dark:text-gray-400 mt-4">No inquiries yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-10">
                                        {conversations
                                            .filter(conv => inboxFilter === 'all' || conv.dealerUnreadCount > 0)
                                            .map(conv => (
                                                <div
                                                    key={conv.id}
                                                    onClick={() => setSelectedConversation(conv)}
                                                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                                                        <span className="material-symbols-outlined text-primary">person</span>
                                                        {(conv.dealerUnreadCount > 0) && (
                                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                                {conv.dealerUnreadCount > 99 ? '99+' : conv.dealerUnreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium truncate ${conv.dealerUnreadCount > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-900 dark:text-white'}`}>
                                                            {conv.buyerName || 'Buyer'}
                                                        </p>
                                                        <p className={`text-sm truncate ${conv.dealerUnreadCount > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>
                                                            {conv.lastMessage || 'No messages'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${activeTab === 'dashboard' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${activeTab === 'listings' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'listings' ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
                        <span className="text-[10px] font-medium">Listings</span>
                    </button>
                    <button
                        onClick={() => navigate('/dealer-profile')}
                        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${activeTab === 'profile' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

