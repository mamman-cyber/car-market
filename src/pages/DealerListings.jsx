import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';

export default function DealerListings() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [dealerData, setDealerData] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchDealerData = async () => {
            if (currentUser) {
                try {
                    const dealerDoc = await getDoc(doc(db, 'dealers', currentUser.uid));
                    if (dealerDoc.exists()) {
                        setDealerData(dealerDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching dealer data:', error);
                }
            }
        };
        fetchDealerData();
    }, [currentUser]);

    useEffect(() => {
        const fetchListings = async () => {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'cars'), where('dealerId', '==', currentUser.uid));
                const snapshot = await getDocs(q);
                const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setListings(cars);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleDelete = async (carId) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        setDeletingId(carId);
        try {
            await deleteDoc(doc(db, 'cars', carId));
            setListings(prev => prev.filter(car => car.id !== carId));
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (carId) => {
        navigate(`/edit-car/${carId}`);
    };

    const handleAddNew = () => {
        navigate('/add-car');
    };

    const defaultCoverImage = "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&h=400&fit=crop";

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return '₦' + new Intl.NumberFormat('en-NG').format(price);
    };

    const defaultCarImage = "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop";

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/dealer-home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2 transition-colors">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                        </button>
                        <p className="text-gray-900 dark:text-white font-bold">My Listings</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {/* Store Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200">
                        {dealerData?.dealerPictureUrl ? (
                            <img src={dealerData.dealerPictureUrl} alt={dealerData.storeName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-300">
                                <span className="material-symbols-outlined text-gray-500">person</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">{dealerData?.storeName || 'My Store'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{listings.length} listings</p>
                    </div>
                </div>

                {/* Add Button */}
                <button 
                    onClick={handleAddNew}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add New Listing
                </button>

                {/* Listings */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">directions_car</span>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">No listings yet</p>
                        <button 
                            onClick={handleAddNew}
                            className="mt-4 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Add Your First Listing
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listings.map((car) => (
                            <div 
                                key={car.id} 
                                className="flex gap-3 bg-white dark:bg-gray-800 rounded-xl p-3"
                            >
                                <div 
                                    className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                                    style={{ backgroundImage: `url("${car.images?.front || defaultCarImage}")` }}
                                >
                                    <span className={`inline-block mt-1 ml-1 px-2 py-0.5 text-[10px] font-medium rounded ${
                                        car.status === 'active' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-500 text-white'
                                    }`}>
                                        {car.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{car.name}</h3>
                                    <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(car.price)}</p>
                                    <div className="flex items-center gap-1 mt-1 text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        <span className="text-xs">{car.location}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => handleEdit(car.id)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg">edit</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(car.id)}
                                        disabled={deletingId === car.id}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === car.id ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg">delete</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <button 
                        onClick={() => navigate('/dealer-home')}
                        className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full"
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                        <span className="text-[10px] font-medium">Listings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

