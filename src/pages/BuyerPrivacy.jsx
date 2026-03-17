import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerPrivacy() {
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

    const privacyItems = [
        { icon: 'visibility', title: 'Profile Visibility', description: 'Control who can see your profile' },
        { icon: 'block', title: 'Blocked Users', description: 'Manage blocked users', path: '#' },
        { icon: 'key', title: 'Change Password', description: 'Update your account password', path: '#' },
        { icon: 'verified_user', title: 'Two-Factor Authentication', description: 'Add an extra layer of security', path: '#' },
        { icon: 'history', title: 'Login History', description: 'View your account login history', path: '#' },
        { icon: 'devices', title: 'Connected Devices', description: 'Manage devices logged into your account', path: '#' },
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
                        <p className="text-gray-900 dark:text-white text-lg font-bold">Privacy & Security</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                <div className="space-y-1">
                    {privacyItems.map((item, index) => (
                        <button 
                            key={index}
                            onClick={() => {
                                if (item.title === 'Profile Visibility') alert('Profile visibility: Public');
                                else if (item.title === 'Blocked Users') alert('No users blocked');
                                else if (item.title === 'Change Password') navigate('/admin-reset'); // Reuse reset page
                                else if (item.title === 'Two-Factor Authentication') alert('2FA: Disabled - Coming soon');
                                else if (item.title === 'Login History') alert('Recent logins: Today from this device');
                                else if (item.title === 'Connected Devices') alert('1 device connected');
                            }}
                            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left"
                        >
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                                {item.icon}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {item.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                    ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white dark:bg-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data & Privacy</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        We take your privacy seriously. Learn how we collect, use, and protect your data.
                    </p>
                    <button 
                        onClick={() => window.open('https://autohub.com/privacy', '_blank')}
                        className="text-primary font-medium hover:underline text-sm"
                    >
                        View Privacy Policy
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

