import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function DealerSetup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const isEditMode = searchParams.get('edit') === 'true';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        storeName: '',
        moto: '',
        dealerNumber: '',
        whatsapp: '',
        telegram: '',
        companyLicense: '',
        about: '',
        logo: null,
        logoName: '',
        dealerPicture: null,
        dealerPictureName: ''
    });

    // Check if dealer already has profile (only for non-edit mode)
    useEffect(() => {
        const checkProfile = async () => {
            if (!currentUser) {
                navigate('/');
                return;
            }

            try {
                const dealerDoc = await getDoc(doc(db, 'dealers', currentUser.uid));
                if (dealerDoc.exists()) {
                    const data = dealerDoc.data();
                    // If profile is already set up and not in edit mode, go to dealer home
                    if (data.storeName && !isEditMode) {
                        navigate('/dealer-home');
                    }
                    // Pre-fill form data in edit mode
                    if (isEditMode && data.storeName) {
                        setFormData({
                            storeName: data.storeName || '',
                            moto: data.moto || '',
                            dealerNumber: data.dealerNumber || '',
                            whatsapp: data.whatsapp || '',
                            telegram: data.telegram || '',
                            companyLicense: data.companyLicense || '',
                            about: data.about || '',
                            logo: null,
                            logoName: data.logoUrl ? 'Current logo' : '',
                            dealerPicture: null,
                            dealerPictureName: data.dealerPictureUrl ? 'Current photo' : ''
                        });
                    }
                }
            } catch (err) {
                console.error('Error checking profile:', err);
            } finally {
                setInitialLoading(false);
            }
        };

        checkProfile();
    }, [currentUser, navigate, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, fieldName, fileNameField) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: file,
                [fileNameField]: file.name
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.storeName.trim()) {
            setError('Store name is required');
            return;
        }
        if (!formData.dealerNumber.trim()) {
            setError('Dealer number is required');
            return;
        }
        if (!formData.companyLicense.trim()) {
            setError('Company license number is required');
            return;
        }

        setLoading(true);

        try {
            // Get existing data to preserve images if not updated
            let existingLogoUrl = '';
            let existingDealerPictureUrl = '';
            
            if (isEditMode) {
                const existingDoc = await getDoc(doc(db, 'dealers', currentUser.uid));
                if (existingDoc.exists()) {
                    existingLogoUrl = existingDoc.data().logoUrl || '';
                    existingDealerPictureUrl = existingDoc.data().dealerPictureUrl || '';
                }
            }

            let logoUrl = existingLogoUrl;
            let dealerPictureUrl = existingDealerPictureUrl;

            // Upload logo if provided
            if (formData.logo) {
                const logoRef = ref(storage, `dealer_logos/${currentUser.uid}_logo`);
                const logoSnapshot = await uploadBytes(logoRef, formData.logo);
                logoUrl = await getDownloadURL(logoSnapshot.ref);
            }

            // Upload dealer picture if provided
            if (formData.dealerPicture) {
                const pictureRef = ref(storage, `dealer_pictures/${currentUser.uid}_picture`);
                const pictureSnapshot = await uploadBytes(pictureRef, formData.dealerPicture);
                dealerPictureUrl = await getDownloadURL(pictureSnapshot.ref);
            }

            // Save dealer profile to Firestore
            const profileData = {
                storeName: formData.storeName,
                moto: formData.moto,
                dealerNumber: formData.dealerNumber,
                whatsapp: formData.whatsapp,
                telegram: formData.telegram,
                companyLicense: formData.companyLicense,
                about: formData.about,
                logoUrl: logoUrl,
                dealerPictureUrl: dealerPictureUrl,
                status: 'approved',
                setupComplete: true,
                updatedAt: new Date()
            };

            if (isEditMode) {
                await updateDoc(doc(db, 'dealers', currentUser.uid), profileData);
            } else {
                profileData.createdAt = new Date();
                await setDoc(doc(db, 'dealers', currentUser.uid), profileData, { merge: true });
            }

            // Navigate to dealer home
            navigate('/dealer-home');
        } catch (err) {
            console.error('Setup error:', err);
            setError('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-[#1b1f27] rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="p-6 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">Set Up Your Store</h1>
                            <p className="text-gray-500 dark:text-gray-400">Complete your dealer profile to start selling</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Store Information */}
                            <div>
                                <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4">Store Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Store Name *</label>
                                        <input
                                            name="storeName"
                                            value={formData.storeName}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="Enter your store name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Moto / Tagline</label>
                                        <input
                                            name="moto"
                                            value={formData.moto}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g., Your Trusted Car Dealer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4">Contact Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Dealer Number *</label>
                                        <input
                                            name="dealerNumber"
                                            value={formData.dealerNumber}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="Enter your dealer number"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">WhatsApp Number</label>
                                        <input
                                            name="whatsapp"
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g., +2348012345678"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Telegram Link</label>
                                        <input
                                            name="telegram"
                                            value={formData.telegram}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g., https://t.me/yourtelegram"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Business Information */}
                            <div>
                                <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4">Business Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Company License Number *</label>
                                        <input
                                            name="companyLicense"
                                            value={formData.companyLicense}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 h-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="Enter your company license number"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">About Your Business</label>
                                        <textarea
                                            name="about"
                                            value={formData.about}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101622] px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            placeholder="Tell buyers about your business..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Images */}
                            <div>
                                <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4">Images</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Logo */}
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Store Logo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'logo', 'logoName')}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {formData.logo ? (
                                                <>
                                                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                                    <span className="text-sm text-primary mt-1">{formData.logoName}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-gray-400 text-2xl">add_photo_alternate</span>
                                                    <span className="text-sm text-gray-500 mt-1">Upload Logo</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    {/* Dealer Picture */}
                                    <div>
                                        <label className="text-gray-900 dark:text-white text-sm font-medium mb-2 block">Your Picture</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'dealerPicture', 'dealerPictureName')}
                                            className="hidden"
                                            id="picture-upload"
                                        />
                                        <label
                                            htmlFor="picture-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {formData.dealerPicture ? (
                                                <>
                                                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                                    <span className="text-sm text-primary mt-1">{formData.dealerPictureName}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-gray-400 text-2xl">person</span>
                                                    <span className="text-sm text-gray-500 mt-1">Upload Photo</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                * Required fields. You can add more details later in your profile settings.
                            </p>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Complete Setup'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
