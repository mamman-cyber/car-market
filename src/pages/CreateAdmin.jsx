import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function CreateAdmin() {
    const [status, setStatus] = useState('loading');
    const navigate = useNavigate();

    useEffect(() => {
        createAdminAccount();
    }, []);

    async function createAdminAccount() {
        const adminEmail = 'mammanoliver@gmail.com';
        const adminPassword = 'Mamman11$';
        const adminName = 'Admin';

        try {
            // Try to get existing user first
            let userId = null;
            
            // Try to sign in - if it works, user exists
            try {
                const signInResult = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                userId = signInResult.user.uid;
                console.log("User already exists, signing in...");
            } catch (signInError) {
                // User doesn't exist, create them
                if (signInError.code === 'auth/user-not-found') {
                    console.log("Creating new user...");
                    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
                    userId = userCredential.user.uid;
                } else {
                    // Wrong password or other error
                    throw signInError;
                }
            }

            // Check if user document exists in Firestore
            const userDocRef = doc(db, "users", userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Create the admin document in Firestore
                await setDoc(userDocRef, {
                    uid: userId,
                    email: adminEmail,
                    fullName: adminName,
                    role: 'admin',
                    createdAt: serverTimestamp(),
                    status: 'active',
                    isSuperAdmin: true,
                });
            } else {
                // Update existing user to be admin
                const userData = userDoc.data();
                if (userData.role !== 'admin') {
                    await setDoc(userDocRef, {
                        ...userData,
                        role: 'admin',
                        isSuperAdmin: true,
                    }, { merge: true });
                }
            }

            setStatus('success');
            
            // Redirect to admin dashboard after short delay
            setTimeout(() => {
                navigate('/admin');
            }, 1500);

        } catch (error) {
            console.error("Error:", error);
            
            // If error is wrong password, try to inform user
            if (error.code === 'auth/wrong-password') {
                setStatus('wrong-password');
            } else {
                setStatus('error');
            }
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Setting up admin account...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Admin Account Ready!</h2>
                    <p className="text-gray-600 mt-2">Redirecting to admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (status === 'wrong-password') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-sm">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-yellow-600 text-3xl">warning</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Account Exists</h2>
                    <p className="text-gray-600 mt-2">An account with this email already exists but with a different password.</p>
                    <p className="text-gray-500 text-sm mt-4">Please go to Firebase Console to reset the password or use the correct password.</p>
                    <button 
                        onClick={() => navigate('/admin-login')}
                        className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Go to Admin Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Error</h2>
                <p className="text-gray-600 mt-2">Failed to create admin account.</p>
                <button 
                    onClick={() => navigate('/admin-login')}
                    className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Go to Admin Login
                </button>
            </div>
        </div>
    );
}

