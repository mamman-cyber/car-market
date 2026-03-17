import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerAbout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const aboutItems = [
        { icon: 'directions_car', title: 'AutoHub', description: 'Your trusted car marketplace' },
        { icon: 'verified', title: 'Version', description: '1.0.0' },
        { icon: 'calendar_today', title: 'Release Date', description: 'coming soon' },
    ];

    const links = [
        { label: 'Privacy Policy', path: '#' },
        { label: 'Terms of Service', path: '#' },
        { label: 'Cookie Policy', path: '#' },
    ];

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/buyer-profile')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2 transition-colors">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                        </button>
                        <p className="text-gray-900 dark:text-white text-lg font-bold">About</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {/* App Logo and Name */}
                <div className="flex flex-col items-center py-8">
                    <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-white text-4xl">
                            directions_car
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AutoHub</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Version 1.0.0</p>
                </div>

                {/* About Info */}
                <div className="space-y-2 mb-6">
                    {aboutItems.map((item, index) => (
                        <div 
                            key={index}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800"
                        >
                            <span className="material-symbols-outlined text-primary">
                                {item.icon}
                            </span>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Description */}
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About AutoHub</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        AutoHub is your trusted destination for finding the perfect vehicle. 
                        We connect buyers with verified dealers across Nigeria, making car buying 
                        simple, transparent, and secure.
                    </p>
                </div>

                {/* Links */}
                <div className="space-y-1 mb-6">
                    {links.map((link, index) => (
                        <button 
                            key={index}
                            onClick={() => {
                                const urls = {
                                    'Privacy Policy': 'https://autohub.com/privacy',
                                    'Terms of Service': 'https://autohub.com/terms',
                                    'Cookie Policy': 'https://autohub.com/cookies'
                                };
                                window.open(urls[link.label], '_blank');
                            }}
                            className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                        >
                            <span className="font-medium text-gray-900 dark:text-white">{link.label}</span>
                            <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                        </button>
                    ))}
                </div>

                {/* Copyright */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © 2026 AutoHub. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Made with ❤️ by Mamman
                    </p>
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

