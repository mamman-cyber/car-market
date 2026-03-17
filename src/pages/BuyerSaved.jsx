import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';

export default function BuyerSaved() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [savedCars, setSavedCars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedCars = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const savedQuery = query(
                    collection(db, 'savedCars'),
                    where('userId', '==', currentUser.uid)
                );
                const savedSnapshot = await getDocs(savedQuery);
                
                const carsWithDetails = await Promise.all(
                    savedSnapshot.docs.map(async (savedDoc) => {
                        const carId = savedDoc.data().carId;
                        const carDoc = await getDoc(doc(db, 'cars', carId));
                        if (carDoc.exists()) {
                            return {
                                id: carDoc.id,
                                ...carDoc.data(),
                                savedId: savedDoc.id
                            };
                        }
                        return null;
                    })
                );

                setSavedCars(carsWithDetails.filter(Boolean));
            } catch (error) {
                console.error('Error fetching saved cars:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedCars();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleRemoveSaved = async (savedId, e) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'savedCars', savedId));
            setSavedCars(savedCars.filter(car => car.savedId !== savedId));
        } catch (error) {
            console.error('Error removing saved car:', error);
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return typeof price === 'number' 
            ? `₦${price.toLocaleString('en-NG')}` 
            : price;
    };

    const defaultCarImages = [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
    ];

    const getCarImage = (car) => {
        if (car.images?.front) return car.images.front;
        if (car.image) return car.image;
        return defaultCarImages[car.id % defaultCarImages.length];
    };

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white text-lg font-bold">Saved</p>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : savedCars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">favorite_border</span>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">No saved cars yet</p>
                        <Link 
                            to="/home" 
                            className="mt-4 text-primary font-medium hover:underline"
                        >
                            Browse cars
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {savedCars.map((car) => (
                            <div 
                                key={car.id} 
                                className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer relative"
                                onClick={() => navigate(`/car/${car.id}`)}
                            >
                                <button 
                                    onClick={(e) => handleRemoveSaved(car.savedId, e)}
                                    className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 rounded-full p-1.5 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-red-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        favorite
                                    </span>
                                </button>
                                
                                <div 
                                    className="aspect-[4/3] bg-cover bg-center"
                                    style={{ backgroundImage: `url("${getCarImage(car)}")` }}
                                ></div>
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{car.name}</h3>
                                    <p className="text-primary font-bold text-sm mt-1">{formatPrice(car.price)}</p>
                                </div>
                            </div>
                        ))}
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
                    <Link to="/buyer-saved" className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/buyer-profile" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

