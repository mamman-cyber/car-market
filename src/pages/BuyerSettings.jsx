import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export default function BuyerSettings() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        darkMode: localStorage.getItem('darkMode') === 'true',
        location: true,
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [settings.darkMode]);

    const { currentUser } = useAuth();
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const toggleDarkMode = () => {
        setSettings({ ...settings, darkMode: !settings.darkMode });
    };

    const toggleLocation = async () => {
        try {
            setSettings({ ...settings, location: !settings.location });
            if (currentUser) {
                // Save to Firestore
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    settings: { ...(await getDoc(doc(db, 'users', currentUser.uid)).data()?.settings || {}), locationServices: !settings.location }
                });
            }
        } catch (error) {
            console.error('Error saving location setting:', error);
        }
    };

    const handleClearCache = () => {
        localStorage.removeItem('darkMode');
        // Clear app-specific cache
        alert('Cache cleared for AutoHub!');
        setSettings({ darkMode: false, location: true });
        window.location.reload();
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify({ settings, timestamp: new Date().toISOString() }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'autohub-settings.json';
        link.click();
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Delete account? This cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'users', currentUser.uid));
                await logout();
                navigate('/');
            } catch (error) {
                alert('Error deleting account');
            }
        }
        setShowDeleteModal(false);
    };

    const menuItems = [
        { icon: 'dark_mode', label: 'Dark Mode', toggle: 'darkMode' },
        { icon: 'location_on', label: 'Location Services', toggle: 'location' },
        { icon: 'language', label: 'Language', value: 'English', onClick: () => alert('Coming soon: Multi-language support') },
        { icon: 'palette', label: 'Appearance', value: 'System', onClick: () => alert('Coming soon: Custom themes') },
        { icon: 'storage', label: 'Clear Cache', onClick: handleClearCache },
        { icon: 'download', label: 'Export Data', onClick: handleExportData },
        { icon: 'delete_forever', label: 'Delete Account', danger: true, onClick: () => setShowDeleteModal(true) },
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
                        <p className="text-gray-900 dark:text-white text-lg font-bold">Settings</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                <div className="space-y-1">
                {menuItems.map((item, index) => {
        const handleClick = () => {
            if (item.onClick) {
                item.onClick();
            } else if (item.toggle) {
                if (item.toggle === 'darkMode') toggleDarkMode();
                else if (item.toggle === 'location') toggleLocation();
            }
        };
        const toggleState = item.toggle ? settings[item.toggle] : false;
        return (
            <button 
                key={index}
                onClick={handleClick}
                className={`flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left ${item.danger ? 'hover:bg-red-50' : ''}`}
            >
                <span className={`material-symbols-outlined ${item.danger ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                    {item.icon}
                </span>
                <div className="flex-1">
                    <p className={`font-medium ${item.danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {item.label}
                    </p>
                    {item.value && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.value}</p>
                    )}
                </div>
                {item.toggle ? (
                    <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${toggleState ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ml-0.5 ${toggleState ? 'translate-x-5 -ml-0.5' : ''}`}></div>
                    </div>
                ) : (
                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                )}
            </button>
        );
    })}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        AutoHub v1.0.0<br />
                        © 2026 AutoHub. All rights reserved.
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

