import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DealerSignup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const fileInputRef = useRef(null);
    const identityInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        state: '',
        password: '',
        confirmPassword: '',
        businessDoc: null,
        businessDocName: '',
        identityPhoto: null
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, JPG, or PNG file');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            setFormData(prev => ({
                ...prev,
                businessDoc: file,
                businessDocName: file.name
            }));
            setError('');
        }
    };

    const handleIdentityPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    identityPhoto: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.fullName.trim()) {
            setError('Please enter your full legal name');
            return;
        }
        if (!formData.email.trim()) {
            setError('Please enter your business email');
            return;
        }
        if (!formData.state) {
            setError('Please select your state of operation');
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
            await signup(formData.email, formData.password, 'dealer', {
                fullName: formData.fullName,
                phone: formData.phone,
                state: formData.state,
                businessDocUrl: '',
                businessDocName: formData.businessDoc ? formData.businessDocName : ''
            });

            navigate('/dealer-review-pending');
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-[600px] bg-white dark:bg-[#1b1f27] rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-6 sm:p-10">
                    <div className="flex items-center justify-between pb-6">
                        <Link to="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors -ml-2">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white text-2xl">arrow_back</span>
                        </Link>
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block">Dealer Sign Up</h2>
                        <div className="size-10"></div>
                    </div>

                    <div className="flex flex-col gap-2 pb-8">
                        <div className="flex gap-6 justify-between">
                            <p className="text-gray-900 dark:text-white text-base font-bold">Business Details</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Step 2 of 3</p>
                        </div>
                        <div className="w-full rounded-full bg-gray-100 dark:bg-gray-800 h-2">
                            <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: '66%' }}></div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight pb-4">Your Information</h3>
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="fullName" className="text-gray-900 dark:text-white text-sm font-medium">Full Legal Name</label>
                                        <input 
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                            placeholder="Enter your full legal name" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="email" className="text-gray-900 dark:text-white text-sm font-medium">Business Email</label>
                                        <input 
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-input flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                            placeholder="Enter your business email address" 
                                        />
                                    </div>
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
                                </div>
                            </div>

                            <div>
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight pb-4">Create Password</h3>
                                <div className="flex flex-col gap-5">
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
                                </div>
                            </div>

                            <div>
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight pb-4">Business Verification</h3>
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-gray-900 dark:text-white text-sm font-medium">Business Registration Proof (Optional)</p>
                                        <input 
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                        />
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#101622] hover:bg-gray-100 dark:hover:bg-[#151b29] transition-colors cursor-pointer group"
                                        >
                                            {formData.businessDoc ? (
                                                <>
                                                    <span className="material-symbols-outlined text-4xl text-primary mb-2">check_circle</span>
                                                    <p className="font-semibold text-primary">{formData.businessDocName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click to change file</p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 mb-2 group-hover:text-primary transition-colors">cloud_upload</span>
                                                    <button type="button" className="font-semibold text-primary group-hover:text-primary/80 transition-colors">Upload Document</button>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PDF, JPG, PNG accepted</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="state" className="text-gray-900 dark:text-white text-sm font-medium">State of Operation</label>
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
                                </div>
                            </div>

                            <div>
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight pb-4">Identity Confirmation</h3>
                                <div className="flex flex-col items-center justify-center w-full p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#101622]">
                                    {formData.identityPhoto ? (
                                        <div className="text-center">
                                            <img 
                                                src={formData.identityPhoto} 
                                                alt="Identity" 
                                                className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-primary"
                                            />
                                            <p className="text-green-600 font-medium mb-2">Photo captured!</p>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, identityPhoto: null }))}
                                                className="text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                Retake Photo
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
                                            </div>
                                            <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Confirm Your Identity</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs leading-relaxed">Center your face in the frame. We use a live photo to prevent fraud.</p>
                                            <input 
                                                type="file"
                                                ref={identityInputRef}
                                                onChange={handleIdentityPhotoChange}
                                                accept="image/*"
                                                capture="user"
                                                className="hidden"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => identityInputRef.current?.click()}
                                                className="bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 px-8 rounded-xl transition-colors"
                                            >
                                                Take Photo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating Account...' : 'Continue'}
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">By continuing, you agree to our <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a>.</p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
