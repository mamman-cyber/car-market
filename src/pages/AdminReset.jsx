import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminReset() {
    const [status, setStatus] = useState('loading');
    const [adminsFound, setAdminsFound] = useState(0);
    const [cleared, setCleared] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        clearAllAdmins();
    }, []);

    async function clearAllAdmins() {
        try {
            // Get all users
            const usersCollection = collection(db, "users");
            const allUsers = await getDocs(usersCollection);
            
            // Find admins
            const admins = allUsers.docs.filter(doc => doc.data().role === 'admin');
            setAdminsFound(admins.length);
            
            if (admins.length === 0) {
                setStatus('no-admins');
                return;
            }

            // Clear all admins - change role to 'buyer'
            for (const adminDoc of admins) {
                await updateDoc(doc(db, "users", adminDoc.id), {
                    role: 'buyer',
                    isSuperAdmin: false
                });
            }
            
            setCleared(true);
            setStatus('success');
        } catch (error) {
            console.error("Error clearing admins:", error);
            setStatus('error');
        }
    }

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Clearing all admins...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">Failed to clear admins. Please try again or do it manually in Firebase Console.</p>
                    <button 
                        onClick={() => navigate('/admin-login')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'no-admins') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-yellow-600 text-3xl">info</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No Admins Found</h2>
                    <p className="text-gray-600 mb-4">There are no admin accounts in the system. You can now create one.</p>
                    <button 
                        onClick={() => navigate('/admin-login')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Go to Admin Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Admins Cleared!</h2>
                <p className="text-gray-600 mb-2">{adminsFound} admin(s) found and cleared.</p>
                <p className="text-gray-500 text-sm mb-4">All admin roles have been changed to buyer.</p>
                <button 
                    onClick={() => navigate('/admin-login')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Go to Admin Login
                </button>
            </div>
        </div>
    );
}

