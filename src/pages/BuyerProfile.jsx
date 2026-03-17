import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function BuyerProfile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const menuItems = [
        { icon: 'chat', label: 'My Chats', path: '/buyer-chats' },
        { icon: 'person', label: 'Edit Profile', path: '/buyer-edit-profile' },
        { icon: 'notifications', label: 'Notifications', path: '/buyer-notifications' },
        { icon: 'settings', label: 'Settings', path: '/buyer-settings' },
        { icon: 'security', label: 'Privacy & Security', path: '/buyer-privacy' },
        { icon: 'help', label: 'Help & Support', path: '/buyer-help' },
        { icon: 'info', label: 'About', path: '/buyer-about' },
    ];

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white text-lg font-bold">Profile</p>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {/* Profile Header */}
                <div className="flex flex-col items-center py-8">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-4xl text-primary">
                            {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'P'}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{userData?.fullName || 'User'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{userData?.email || currentUser?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                    {menuItems.map((item, index) => (
                        <Link 
                            key={index}
                            to={item.path}
                            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">{item.icon}</span>
                            <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
                            <span className="material-symbols-outlined text-gray-400 ml-auto">chevron_right</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <Link to="/home" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>
                    <Link to="/buyer-saved" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/buyer-profile" className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

