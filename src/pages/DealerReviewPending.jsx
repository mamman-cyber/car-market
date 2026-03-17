import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DealerReviewPending() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    useEffect(() => {
        // Get stored credentials
        const email = sessionStorage.getItem('dealerTempEmail') || '';
        const password = sessionStorage.getItem('dealerTempPassword') || '';
        setCredentials({ email, password });
    }, []);

    const handleGotIt = async () => {
        // Clear stored credentials
        sessionStorage.removeItem('dealerTempEmail');
        sessionStorage.removeItem('dealerTempPassword');
        
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-[500px] bg-white dark:bg-[#1b1f27] rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-8 sm:p-12 flex flex-col items-center text-center">

                    {/* Icon Component */}
                    <div className="flex size-24 items-center justify-center rounded-full bg-blue-50 dark:bg-primary/10 mb-8 ring-8 ring-blue-50/50 dark:ring-primary/5">
                        <div className="flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-primary/20 text-primary">
                            <span className="material-symbols-outlined text-[40px]">hourglass_top</span>
                        </div>
                    </div>

                    {/* HeadlineText Component */}
                    <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-3">Review in Progress</h1>

                    {/* Credentials Display */}
                    {credentials.password && (
                        <div className="w-full mb-6 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">Your login credentials (save these):</p>
                            <div className="text-left space-y-2">
                                <p className="text-sm">
                                    <span className="text-gray-500">Email: </span>
                                    <span className="text-gray-900 dark:text-white font-mono">{credentials.email}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Password: </span>
                                    <span className="text-gray-900 dark:text-white font-mono">{credentials.password}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* BodyText Component */}
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-relaxed mb-8 max-w-sm mx-auto">
                        Your dealership application is under review. You will be notified via email once it's approved. Please note that you cannot log in until your account has been approved by our admin team.
                    </p>

                    {/* SingleButton Component */}
                    <div className="w-full">
                        <button 
                            onClick={handleGotIt}
                            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            <span className="truncate">Got It</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
