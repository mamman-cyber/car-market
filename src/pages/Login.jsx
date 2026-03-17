import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('buyer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
    const navigate = useNavigate();
    const { login, currentUser, signInWithGoogle, forgotPassword } = useAuth();

    // Check dealer status and redirect accordingly
    const checkDealerStatus = async (userId) => {
        try {
            const dealerDoc = await getDoc(doc(db, 'dealers', userId));
            if (dealerDoc.exists()) {
                const dealerData = dealerDoc.data();
                
                // Check if dealer has completed their profile setup
                if (!dealerData.setupComplete) {
                    // Dealer hasn't completed setup, redirect to setup page
                    navigate('/dealer-setup');
                    return;
                }
                
                if (dealerData.status === 'approved') {
                    // Dealer is approved - redirect to dealer home
                    navigate('/dealer-home');
                } else {
                    // Dealer is still pending or rejected
                    navigate('/dealer-review-pending');
                }
            } else {
                // No dealer record found, go to pending
                navigate('/dealer-review-pending');
            }
        } catch (error) {
            console.error('Error checking dealer status:', error);
            navigate('/dealer-review-pending');
        }
    };

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            const userRole = currentUser.role;
            if (userRole === 'admin') {
                navigate('/admin');
            } else if (userRole === 'buyer') {
                navigate('/home');
            } else if (userRole === 'dealer') {
                checkDealerStatus(currentUser.uid);
            }
        }
    }, [currentUser, navigate]);

    const handleLogin = async (userRole) => {
        setError('');
        setLoading(true);
        
        if (!email || !password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        try {
            await login(email, password);
            
            // After login, the useEffect will handle redirection based on role
            // But we need to manually check for dealer status
            setTimeout(async () => {
                if (currentUser && currentUser.role === 'dealer') {
                    checkDealerStatus(currentUser.uid);
                }
            }, 200);
        } catch (err) {
            console.error("Login error:", err);
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Invalid email address');
                    break;
                case 'auth/user-disabled':
                    setError('This account has been disabled');
                    break;
                case 'auth/user-not-found':
                    setError('No account found with this email');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password');
                    break;
                case 'auth/invalid-credential':
                    setError('Invalid email or password');
                    break;
                default:
                    setError('Failed to log in. Please try again.');
            }
        }
        setLoading(false);
    };

    const handleSignUpClick = () => {
        if (role === 'buyer') {
            navigate('/buyer-signup');
        } else if (role === 'dealer') {
            navigate('/dealer-signup');
        }
    };

    // Handle Forgot Password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!forgotPasswordEmail) {
            setError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotPasswordEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(forgotPasswordEmail);
            setForgotPasswordSent(true);
        } catch (err) {
            console.error("Forgot password error:", err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        }
        setLoading(false);
    };

    // Handle Google Sign-In
    const handleGoogleSignIn = async (userRole) => {
        setError('');
        setLoading(true);
        
        try {
            await signInWithGoogle(userRole);
            
            // After Google sign-in, wait for auth state to update and redirect
            setTimeout(() => {
                if (userRole === 'buyer') {
                    navigate('/home');
                } else if (userRole === 'dealer') {
                    // For dealers, redirect to signup to complete profile and await approval
                    navigate('/dealer-signup');
                }
            }, 500);
        } catch (err) {
            console.error("Google sign-in error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in was cancelled. Please try again.');
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with a different sign-in method.');
            } else {
                setError('Failed to sign in with Google. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4 py-8 font-display">
            <div className="w-full max-w-sm mx-auto">
                {/* App Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                        <span className="material-symbols-outlined text-white text-4xl">directions_car</span>
                    </div>
                </div>

                {/* Segmented Buttons for Login/Sign Up */}
                <div className="flex px-4 py-3">
                    <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-200 dark:bg-black/20 p-1.5">
                        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:shadow-md has-[:checked]:text-gray-900 has-[:checked]:dark:text-white text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal transition-all">
                            <span className="truncate">Log In</span>
                            <input
                                className="invisible w-0"
                                name="auth-toggle"
                                type="radio"
                                checked={isLogin}
                                onChange={() => setIsLogin(true)}
                            />
                        </label>
                        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:shadow-md has-[:checked]:text-gray-900 has-[:checked]:dark:text-white text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal transition-all">
                            <span className="truncate">Sign Up</span>
                            <input
                                className="invisible w-0"
                                name="auth-toggle"
                                type="radio"
                                checked={!isLogin}
                                onChange={() => setIsLogin(false)}
                            />
                        </label>
                    </div>
                </div>

                {isLogin ? (
                    /* Login Form Content */
                    <div className="space-y-6 pt-6">
                        <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight px-4 text-center pb-3 pt-6">Welcome Back</h1>

                        {/* Error Message */}
                        {error && (
                            <div className="mx-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="flex max-w-full flex-wrap items-end gap-4 px-4">
                            <label className="flex flex-col min-w-40 flex-1">
                                <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Email</p>
                                <div className="relative flex w-full flex-1 items-stretch rounded-xl">
                                    <input
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal"
                                        placeholder="Enter your email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                        <span className="material-symbols-outlined">mail</span>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Password Field */}
                        <div className="flex max-w-full flex-wrap items-end gap-4 px-4">
                            <label className="flex flex-col min-w-40 flex-1">
                                <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Password</p>
                                <div className="relative flex w-full flex-1 items-stretch rounded-xl">
                                    <input
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal"
                                        placeholder="Enter your password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Forgot Password Link */}
                        <p 
                            onClick={() => { setShowForgotPassword(true); setForgotPasswordSent(false); setForgotPasswordEmail(''); setError(''); }}
                            className="text-primary text-sm font-medium leading-normal pb-3 pt-1 px-4 text-right underline cursor-pointer"
                        >
                            Forgot Password?
                        </p>

                        {/* Primary CTA Buttons */}
                        <div className="px-4 py-3 space-y-3">
                            <button 
                                onClick={() => handleLogin('buyer')} 
                                disabled={loading}
                                className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Log In as Buyer'}
                            </button>
                            <button 
                                onClick={() => handleLogin('dealer')} 
                                disabled={loading}
                                className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-primary bg-transparent px-6 text-base font-semibold text-primary shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Log In as Seller'}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 px-4 py-2">
                            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Or continue with</p>
                            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
                        </div>

                        {/* Social Logins */}
                        <div className="flex justify-center gap-4 px-4">
                            <button 
                                onClick={() => handleGoogleSignIn('buyer')}
                                disabled={loading}
                                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => handleGoogleSignIn('buyer')}
                                disabled={loading}
                                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                <svg className="h-6 w-6 dark:invert" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.13-.48-3.08.48-1.04.98-2.18.98-3.33 0-2.31-1.97-3.69-5.12-3.69-8.48 0-3.4 2.13-5.23 4.43-5.23 1.15 0 1.93.53 2.72.53.84 0 1.68-.53 2.97-.53 1.51 0 2.69.75 3.33 1.84-2.8 1.48-2.35 6.09.28 7.23-.39 1.4-1.12 3-2.55 4.31v-.5zm-4.23-14c.36-1.57 1.85-2.88 3.51-3.05.36 1.76-1.4 3.51-3.51 3.05z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Sign Up Form Content */
                    <div className="space-y-6 pt-6">
                        <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight px-4 text-center pb-3 pt-6">Create Your Account</h1>

                        <div className="px-4 space-y-4">
                            <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">Choose your role</p>

                            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-300 dark:border-gray-700 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">I'm a Buyer</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Browse and purchase vehicles.</p>
                                </div>
                                <input type="radio" name="role" className="form-radio text-primary focus:ring-primary" checked={role === 'buyer'} onChange={() => setRole('buyer')} />
                            </label>

                            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-300 dark:border-gray-700 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">I'm a Dealer</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">List and manage your inventory.</p>
                                </div>
                                <input type="radio" name="role" className="form-radio text-primary focus:ring-primary" checked={role === 'dealer'} onChange={() => setRole('dealer')} />
                            </label>
                        </div>

                        <div className="px-4 py-3">
                            <button onClick={handleSignUpClick} className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-sm transition-transform active:scale-95">Continue</button>
                        </div>

                        <div className="flex items-center gap-4 px-4 py-2">
                            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Or continue with</p>
                            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
                        </div>

                        <div className="flex justify-center gap-4 px-4">
                            <button 
                                onClick={() => handleGoogleSignIn(role)}
                                disabled={loading}
                                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => handleGoogleSignIn(role)}
                                disabled={loading}
                                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800/50 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                <svg className="h-6 w-6 dark:invert" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.13-.48-3.08.48-1.04.98-2.18.98-3.33 0-2.31-1.97-3.69-5.12-3.69-8.48 0-3.4 2.13-5.23 4.43-5.23 1.15 0 1.93.53 2.72.53.84 0 1.68-.53 2.97-.53 1.51 0 2.69.75 3.33 1.84-2.8 1.48-2.35 6.09.28 7.23-.39 1.4-1.12 3-2.55 4.31v-.5zm-4.23-14c.36-1.57 1.85-2.88 3.51-3.05.36 1.76-1.4 3.51-3.51 3.05z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
