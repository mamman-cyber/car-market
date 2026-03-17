import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerSignup() {
    const navigate = useNavigate();
    const { signup, currentUser } = useAuth();
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        state: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.fullName.trim()) {
            setError('Please enter your full name');
            return;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email address');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Please enter your phone number');
            return;
        }
        if (!formData.state) {
            setError('Please select your state');
            return;
        }
        if (!formData.password) {
            setError('Please enter a password');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await signup(formData.email, formData.password, 'buyer', {
                fullName: formData.fullName,
                phone: formData.phone,
                state: formData.state
            });

            // Don't navigate immediately - wait for auth state to update
            // The useEffect below will handle navigation after currentUser is set
        } catch (err) {
            console.error('Signup error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Wait for auth state to be ready after signup before navigating
    useEffect(() => {
        if (currentUser && currentUser.role === 'buyer') {
            navigate('/home');
        }
    }, [currentUser, navigate]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#1b1f27] rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-6 sm:p-10">
                    {/* Top App Bar */}
                    <div className="flex items-center pb-6">
                        <Link to="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors -ml-2">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white text-2xl">arrow_back</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">Create Account</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base mb-8">Sign up to browse and buy cars.</p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-5">
                            {/* Full Name TextField */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="fullName" className="text-gray-900 dark:text-white text-sm font-medium">Full Name</label>
                                <input 
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                    placeholder="Enter your full name" 
                                />
                            </div>

                            {/* Email Address TextField */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-gray-900 dark:text-white text-sm font-medium">Email Address</label>
                                <input 
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                    placeholder="Enter your email address" 
                                />
                            </div>

                            {/* Phone Number TextField */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="phone" className="text-gray-900 dark:text-white text-sm font-medium">Phone Number</label>
                                <input 
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                    placeholder="Enter your phone number" 
                                />
                            </div>

                            {/* State Selector */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="state" className="text-gray-900 dark:text-white text-sm font-medium">State</label>
                                <div className="relative w-full">
                                    <select 
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="form-select appearance-none w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    >
                                        <option className="text-gray-400" disabled value="">Select your state</option>
                                        <option value="Abia">Abia</option>
                                        <option value="Adamawa">Adamawa</option>
                                        <option value="Akwa Ibom">Akwa Ibom</option>
                                        <option value="Anambra">Anambra</option>
                                        <option value="Bauchi">Bauchi</option>
                                        <option value="Bayelsa">Bayelsa</option>
                                        <option value="Benue">Benue</option>
                                        <option value="Borno">Borno</option>
                                        <option value="Cross River">Cross River</option>
                                        <option value="Delta">Delta</option>
                                        <option value="Ebonyi">Ebonyi</option>
                                        <option value="Edo">Edo</option>
                                        <option value="Ekiti">Ekiti</option>
                                        <option value="Enugu">Enugu</option>
                                        <option value="FCT">Federal Capital Territory</option>
                                        <option value="Gombe">Gombe</option>
                                        <option value="Imo">Imo</option>
                                        <option value="Jigawa">Jigawa</option>
                                        <option value="Kaduna">Kaduna</option>
                                        <option value="Kano">Kano</option>
                                        <option value="Katsina">Katsina</option>
                                        <option value="Kebbi">Kebbi</option>
                                        <option value="Kogi">Kogi</option>
                                        <option value="Kwara">Kwara</option>
                                        <option value="Lagos">Lagos</option>
                                        <option value="Nasarawa">Nasarawa</option>
                                        <option value="Niger">Niger</option>
                                        <option value="Ogun">Ogun</option>
                                        <option value="Ondo">Ondo</option>
                                        <option value="Osun">Osun</option>
                                        <option value="Oyo">Oyo</option>
                                        <option value="Plateau">Plateau</option>
                                        <option value="Rivers">Rivers</option>
                                        <option value="Sokoto">Sokoto</option>
                                        <option value="Taraba">Taraba</option>
                                        <option value="Yobe">Yobe</option>
                                        <option value="Zamfara">Zamfara</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-xl">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Password TextField */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-gray-900 dark:text-white text-sm font-medium">Password</label>
                                <input 
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                    placeholder="Create a password" 
                                />
                            </div>

                            {/* Confirm Password TextField */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="confirmPassword" className="text-gray-900 dark:text-white text-sm font-medium">Confirm Password</label>
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                    placeholder="Confirm your password" 
                                />
                            </div>

                            {/* Informational Text */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 mt-2">
                                <span className="material-symbols-outlined text-primary text-xl shrink-0">verified_user</span>
                                <p className="text-sm text-gray-600 dark:text-gray-300">You'll get immediate access to browse and buy after signing up.</p>
                            </div>

                            {/* Sign Up Button */}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary mt-4 text-base font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            {/* Log In Link */}
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Already have an account?{' '}
                                <Link className="font-semibold text-primary hover:text-primary/80 transition-colors" to="/">Log In</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
