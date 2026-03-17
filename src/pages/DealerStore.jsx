
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import ChatWidget from '../components/ChatWidget';

export default function DealerStore() {
    const { dealerId } = useParams();
    const navigate = useNavigate();
    const [dealerData, setDealerData] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('listings');

    useEffect(() => {
        const fetchDealerData = async () => {
            try {
                const dealerDoc = await getDoc(doc(db, 'dealers', dealerId));
                if (dealerDoc.exists()) {
                    setDealerData(dealerDoc.data());
                }
                const listingsQuery = query(collection(db, 'cars'), where('dealerId', '==', dealerId), where('status', '==', 'active'));
                const listingsSnapshot = await getDocs(listingsQuery);
                const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setListings(listingsData);
            } catch (error) {
                console.error('Error fetching dealer data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (dealerId) {
            fetchDealerData();
        }
    }, [dealerId]);

    const defaultCoverImage = "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&h=400&fit=crop";
    const defaultCarImage = "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop";

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return '₦' + new Intl.NumberFormat('en-NG').format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading store...</p>
                </div>
            </div>
        );
    }

    if (!dealerData) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-gray-300">store</span>
                    <p className="text-gray-500 dark:text-gray-400">Store not found</p>
                    <Link to="/home" className="text-primary font-medium hover:underline">Go back home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                    </button>
                    <p className="text-gray-900 dark:text-white font-bold truncate">{dealerData.storeName || 'Store'}</p>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Cover Image and Profile */}
            <div className="relative">
                <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: dealerData.coverUrl ? `url("${dealerData.coverUrl}")` : `url("${defaultCoverImage}")` }}>
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>
                <div className="absolute -bottom-6 left-4">
                    <div className="h-12 w-12 rounded-lg border-2 border-background-light dark:border-background-dark shadow overflow-hidden bg-gray-200">
                        {dealerData.logoUrl ? (
                            <img src={dealerData.logoUrl} alt={dealerData.storeName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-300">
                                <span className="material-symbols-outlined text-xl text-gray-500">store</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Store Info */}
            <div className="pt-8 pb-4 px-4">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{dealerData.storeName}</h1>
                {dealerData.moto && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dealerData.moto}</p>}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-4 px-4">
                <button onClick={() => setActiveTab('listings')} className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'listings' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
                    Listings ({listings.length})
                </button>
                <button onClick={() => setActiveTab('about')} className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
                    About
                </button>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {activeTab === 'listings' && (
                    <div className="grid grid-cols-2 gap-3">
                        {listings.length === 0 ? (
                            <div className="col-span-2 text-center py-8">
                                <span className="material-symbols-outlined text-5xl text-gray-300">directions_car</span>
                                <p className="mt-2 text-gray-500">No listings available</p>
                            </div>
                        ) : (
                            listings.map((car) => (
                                <div key={car.id} onClick={() => navigate(`/car/${car.id}`)} className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer">
                                    <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url("${car.images?.front || defaultCarImage}")` }}></div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{car.name}</h3>
                                        <p className="text-primary font-bold text-sm mt-1">{formatPrice(car.price)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About {dealerData.storeName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{dealerData.description || dealerData.about || 'No description available.'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {dealerData.phone && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">phone</span><span>{dealerData.phone}</span></div>}
                                {dealerData.whatsapp && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">chat</span><span>{dealerData.whatsapp}</span></div>}
                                {dealerData.state && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span><span>{dealerData.state}</span></div>}
                            </div>
                        </div>
                        {/* Chat Button */}
                        <button 
                            onClick={() => navigate('/buyer-chats')}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Chat with Dealer
                        </button>
                    </div>
                )}
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
                    <Link to="/buyer-profile" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>

            {/* Chat Widget - Embedded for direct communication with dealer */}
            <ChatWidget dealerId={dealerId} />
        </div>
    );
}

