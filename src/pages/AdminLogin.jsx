import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminLogin() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminExists, setAdminExists] = useState(null);
    const navigate = useNavigate();
    const { login, currentUser, userRole } = useAuth();


    useEffect(() => {
        checkAdminExists();
    }, []);

    // Redirect after login - with logging and fallback for missing Firestore data
    useEffect(() => {
        console.log("Auth state changed:", { currentUser: !!currentUser, userRole });
        
        // If logged in and is admin, redirect
        if (currentUser && userRole === 'admin') {
            console.log("User is admin, redirecting...");
            setLoading(false);
            navigate('/admin', { replace: true });
        }
        // If logged in but not admin (role is loaded and not admin)
        else if (currentUser && userRole !== null && userRole !== 'admin') {
            console.log("User is not admin:", userRole);
            setLoading(false);
            setError('You do not have admin access');
        }
        // If userRole is null but user exists - still loading role from Firestore
        else if (currentUser && userRole === null) {
            console.log("User logged in but role still loading or no Firestore document...");
            // After 3 seconds, if still no role, show error
            const timer = setTimeout(() => {
                if (userRole === null) {
                    setLoading(false);
                    setError('Unable to verify admin access. Please contact support.');
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, userRole, navigate]);

    async function checkAdminExists() {
        try {
            const usersCollection = collection(db, "users");
            const userDocs = await getDocs(usersCollection);
            const hasAdmin = userDocs.docs.some(doc => doc.data().role === 'admin');
            setAdminExists(hasAdmin);
        } catch (e) {
            setAdminExists(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        
        if (!email || !password || !fullName) {
            setError('Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create admin document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email,
                fullName: fullName,
                role: 'admin',
                createdAt: serverTimestamp(),
                status: 'active',
                isSuperAdmin: true,
            });
            
            setAdminExists(true);
            
            // Redirect to admin dashboard
            navigate('/admin');
            
        } catch (err) {
            console.error("Signup error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already registered. Please login.');
            } else {
                setError('Failed to create admin account');
            }
        }
        
        setLoading(false);
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        
        setLoading(true);
        
        try {
            console.log("Attempting login...");
            await login(email, password);
            console.log("Login successful, waiting for redirect...");
            
            // Timeout fallback - if no redirect in 5 seconds, reset loading
            setTimeout(() => {
                if (loading) {
                    console.log("Timeout - checking user role manually");
                    // Try to get role directly from Firestore
                }
            }, 5000);
        } catch (err) {
            console.error("Login error:", err);
            setError('Invalid email or password: ' + err.message);
            setLoading(false);
        }
    };

    if (adminExists === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-white text-3xl">admin_panel_settings</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-gray-500 mt-1">
                        {isLoginMode ? 'Sign in to your admin account' : 'Create your admin account'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4">
                    {!isLoginMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    {!isLoginMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            isLoginMode ? 'Sign In' : 'Create Admin Account'
                        )}
                    </button>
                </form>

                {/* Toggle */}
                {adminExists && (
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <button
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="text-sm text-gray-500 hover:text-red-600"
                        >
                            {isLoginMode ? "Don't have an admin account? Create one" : 'Already have an admin account? Sign in'}
                        </button>
                    </div>
                )}

                {/* Back Link */}
                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to main site
                    </Link>
                </div>
            </div>
        </div>
    );
}

