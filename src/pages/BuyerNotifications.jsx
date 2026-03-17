import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerNotifications() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState({
        newListings: true,
        priceDrops: true,
        messages: true,
        promotions: false,
    });

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const toggleNotification = (key) => {
        setNotifications({
            ...notifications,
            [key]: !notifications[key]
        });
    };

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/buyer-profile')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2 transition-colors">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                        </button>
                        <p className="text-gray-900 dark:text-white text-lg font-bold">Notifications</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Push Notifications</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="text-gray-900 dark:text-white font-medium">New Listings</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new cars match your saved searches</p>
                                </div>
                                <button
                                    onClick={() => toggleNotification('newListings')}
                                    className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications.newListings ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifications.newListings ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="text-gray-900 dark:text-white font-medium">Price Drops</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when saved cars have price reductions</p>
                                </div>
                                <button
                                    onClick={() => toggleNotification('priceDrops')}
                                    className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications.priceDrops ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifications.priceDrops ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="text-gray-900 dark:text-white font-medium">Messages</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you receive new messages from dealers</p>
                                </div>
                                <button
                                    onClick={() => toggleNotification('messages')}
                                    className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications.messages ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifications.messages ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="text-gray-900 dark:text-white font-medium">Promotions</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive promotional offers and deals</p>
                                </div>
                                <button
                                    onClick={() => toggleNotification('promotions')}
                                    className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications.promotions ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifications.promotions ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-primary text-white py-3 rounded-xl font-medium">
                        Save Preferences
                    </button>
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

