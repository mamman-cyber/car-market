import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, onSnapshot, increment } from 'firebase/firestore';

export default function DealerProfile() {
    const { currentUser, logout, changePassword } = useAuth();
    const navigate = useNavigate();
    const [dealerData, setDealerData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Password change state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Chat state
    const [adminConversation, setAdminConversation] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

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
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDealerData();
    }, [currentUser]);

    // Check for existing admin conversation
    useEffect(() => {
        if (!currentUser) return;

        const checkAdminConversation = async () => {
            try {
                const convQuery = query(
                    collection(db, 'conversations'),
                    where('dealerId', '==', currentUser.uid)
                );
                const convSnapshot = await getDocs(convQuery);

                // Find the admin conversation in memory to avoid composite index requirement
                const adminConv = convSnapshot.docs.find(doc => doc.data().isAdminConversation === true);

                if (adminConv) {
                    setAdminConversation({ id: adminConv.id, ...adminConv.data() });
                }
            } catch (error) {
                console.error('Error checking admin conversation:', error);
            }
        };

        checkAdminConversation();
    }, [currentUser]);

    // Listen to chat messages
    useEffect(() => {
        if (!adminConversation?.id) return;

        const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', adminConversation.id),
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs
                .map(docItem => ({ id: docItem.id, ...docItem.data() }))
                .sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0));
            setChatMessages(msgs);

            const unreadMsgs = msgs.filter(msg => msg.senderType === 'admin' && !msg.read);
            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach((msg) => {
                    updateDoc(doc(db, 'messages', msg.id), { read: true }).catch(console.error);
                });
                updateDoc(doc(db, 'conversations', adminConversation.id), { dealerUnreadCount: 0 }).catch(console.error);
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [adminConversation?.id]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Password change handler
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword(newPassword);
            setPasswordSuccess('Password changed successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/requires-recent-login') {
                setPasswordError('Please log out and log in again to change your password');
            } else {
                setPasswordError('Failed to change password. Please try again.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    // Chat with admin handler
    const handleChatWithAdmin = async () => {
        setShowChatModal(true);

        if (adminConversation) return;

        setChatLoading(true);
        try {
            // Create new admin conversation
            const convRef = await addDoc(collection(db, 'conversations'), {
                dealerId: currentUser.uid,
                dealerName: dealerData?.storeName || 'Dealer',
                buyerId: 'admin', // Special ID for admin
                buyerName: 'Admin',
                isAdminConversation: true,
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                dealerUnreadCount: 0,
                adminUnreadCount: 1,
                createdAt: serverTimestamp()
            });

            setAdminConversation({
                id: convRef.id,
                dealerId: currentUser.uid,
                dealerName: dealerData?.storeName || 'Dealer',
                isAdminConversation: true
            });
        } catch (error) {
            console.error('Error creating admin conversation:', error);
        } finally {
            setChatLoading(false);
        }
    };

    // Send message to admin
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !adminConversation) return;

        try {
            await addDoc(collection(db, 'messages'), {
                conversationId: adminConversation.id,
                senderId: currentUser.uid,
                senderType: 'dealer',
                content: newMessage.trim(),
                createdAt: serverTimestamp(),
                read: true
            });

            await updateDoc(doc(db, 'conversations', adminConversation.id), {
                lastMessage: newMessage.trim(),
                lastMessageTime: serverTimestamp(),
                adminUnreadCount: increment(1)
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const defaultCoverImage = "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&h=400&fit=crop";

    const menuItems = [
        { icon: 'dashboard', label: 'Dashboard', action: () => navigate('/dealer-home') },
        { icon: 'inventory_2', label: 'My Listings', action: () => navigate('/dealer-listings') },
        { icon: 'edit', label: 'Edit Store', action: () => navigate('/dealer-setup?edit=true') },
        { icon: 'add_circle', label: 'Add New Car', action: () => navigate('/add-car') },
        { icon: 'visibility', label: 'View Store', action: () => currentUser && navigate(`/dealer-store/${currentUser.uid}`) },
        { icon: 'support_agent', label: 'Chat with Admin', action: handleChatWithAdmin, showBadge: adminConversation?.dealerUnreadCount > 0 },
        { icon: 'lock', label: 'Change Password', action: () => setShowPasswordModal(true) },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white font-bold">Profile</p>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {/* Store Header */}
                <div className="relative mb-6">
                    <div
                        className="h-24 rounded-xl bg-cover bg-center"
                        style={{
                            backgroundImage: dealerData?.logoUrl
                                ? `url("${dealerData.logoUrl}")`
                                : `url("${defaultCoverImage}")`
                        }}
                    >
                        <div className="absolute inset-0 bg-black/40 rounded-xl"></div>
                    </div>
                    <div className="absolute bottom-[-20px] left-4">
                        <div className="h-14 w-14 rounded-xl border-4 border-background-light dark:border-background-dark shadow-lg overflow-hidden bg-gray-200">
                            {dealerData?.dealerPictureUrl ? (
                                <img src={dealerData.dealerPictureUrl} alt={dealerData.storeName} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-300">
                                    <span className="material-symbols-outlined text-xl text-gray-500">person</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{dealerData?.storeName || 'My Store'}</h2>
                    {dealerData?.moto && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dealerData.moto}</p>
                    )}
                </div>

                {/* Contact Info */}
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
                    <div className="space-y-2">
                        {dealerData?.dealerNumber && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-gray-500 text-lg">phone</span>
                                <span className="text-gray-700 dark:text-gray-300">{dealerData.dealerNumber}</span>
                            </div>
                        )}
                        {dealerData?.whatsapp && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-gray-500 text-lg">chat</span>
                                <span className="text-gray-700 dark:text-gray-300">{dealerData.whatsapp}</span>
                            </div>
                        )}
                        {dealerData?.telegram && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-gray-500 text-lg">send</span>
                                <span className="text-gray-700 dark:text-gray-300">{dealerData.telegram}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-gray-500 text-lg">email</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{currentUser?.email}</span>
                        </div>
                    </div>
                </div>

                {/* About */}
                {dealerData?.about && (
                    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{dealerData.about}</p>
                    </div>
                )}

                {/* Menu Items */}
                <div className="space-y-1">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className="flex items-center gap-3 p-4 w-full rounded-xl bg-white dark:bg-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">{item.icon}</span>
                            <span className="text-gray-900 dark:text-white font-medium text-sm">{item.label}</span>
                            {item.showBadge && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>
                            )}
                            <span className="material-symbols-outlined text-gray-400 ml-auto">chevron_right</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <button
                        onClick={() => navigate('/dealer-home')}
                        className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full"
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/dealer-listings')}
                        className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full"
                    >
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="text-[10px] font-medium">Listings</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {passwordLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat with Admin Modal */}
            {showChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md h-[500px] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat with Admin</h3>
                            <button onClick={() => setShowChatModal(false)} className="text-gray-500 hover:text-gray-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <span className="material-symbols-outlined text-4xl">chat</span>
                                    <p className="mt-2">Start a conversation with admin</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === currentUser.uid
                                                ? 'bg-primary text-white rounded-br-sm'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-primary text-white p-2 rounded-full disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

