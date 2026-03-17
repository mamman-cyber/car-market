import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';

export default function CarDetails() {
    const { carId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [car, setCar] = useState(null);
    const [dealer, setDealer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchCarData = async () => {
            try {
                const carDoc = await getDoc(doc(db, 'cars', carId));
                if (carDoc.exists()) {
                    const carData = { id: carDoc.id, ...carDoc.data() };
                    setCar(carData);

                    if (carData.dealerId) {
                        const dealerDoc = await getDoc(doc(db, 'dealers', carData.dealerId));
                        if (dealerDoc.exists()) {
                            setDealer({ id: dealerDoc.id, ...dealerDoc.data() });
                        }
                    }

                    if (currentUser) {
                        const savedQuery = query(
                            collection(db, 'savedCars'),
                            where('userId', '==', currentUser.uid),
                            where('carId', '==', carId)
                        );
                        const savedSnapshot = await getDocs(savedQuery);
                        setIsSaved(!savedSnapshot.empty);
                    }
                }
            } catch (error) {
                console.error('Error fetching car data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (carId && currentUser) {
            fetchCarData();
        }
    }, [carId, currentUser]);

    const handleSaveCar = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setSaving(true);
        try {
            if (isSaved) {
                const savedQuery = query(
                    collection(db, 'savedCars'),
                    where('userId', '==', currentUser.uid),
                    where('carId', '==', carId)
                );
                const savedSnapshot = await getDocs(savedQuery);
                for (const docItem of savedSnapshot.docs) {
                    await deleteDoc(docItem.ref);
                }
                setIsSaved(false);
            } else {
                await addDoc(collection(db, 'savedCars'), {
                    userId: currentUser.uid,
                    carId: carId,
                    savedAt: new Date()
                });
                setIsSaved(true);
            }
        } catch (error) {
            console.error('Error saving car:', error);
        } finally {
            setSaving(false);
        }
    };

    const defaultCarImages = [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop'
    ];

    const getCarImages = () => {
        if (!car?.images) return defaultCarImages;
        const imageUrls = Object.values(car.images).filter(Boolean);
        return imageUrls.length > 0 ? imageUrls : defaultCarImages;
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return typeof price === 'number' ? `₦${price.toLocaleString('en-NG')}` : price;
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading car details...</p>
                </div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-gray-300">directions_car</span>
                    <p className="text-gray-500 dark:text-gray-400">Car not found</p>
                    <Link to="/home" className="text-primary font-medium hover:underline">Go back home</Link>
                </div>
            </div>
        );
    }

    const carImages = getCarImages();

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                    </button>
                    <p className="text-gray-900 dark:text-white font-bold truncate mx-2">Car Details</p>
                    <button onClick={handleSaveCar} disabled={saving} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <span className={`material-symbols-outlined text-2xl ${isSaved ? 'text-red-500' : 'text-gray-900 dark:text-white'}`} style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
                            favorite
                        </span>
                    </button>
                </div>
            </div>

            <div className="pb-24">
                <div className="relative">
                    <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url("${carImages[currentImageIndex]}")` }}></div>
                    
                    {carImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {carImages.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    )}

                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1}/{carImages.length}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{car.name}</h1>
                        <p className="text-2xl font-bold text-primary mt-1">{formatPrice(car.price)}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {car.year && <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"><span className="material-symbols-outlined text-gray-500 text-sm">calendar_today</span><span className="text-sm text-gray-700 dark:text-gray-300">{car.year}</span></div>}
                        {car.mileage && <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"><span className="material-symbols-outlined text-gray-500 text-sm">speed</span><span className="text-sm text-gray-700 dark:text-gray-300">{car.mileage} km</span></div>}
                        {car.transmission && <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"><span className="material-symbols-outlined text-gray-500 text-sm">settings</span><span className="text-sm text-gray-700 dark:text-gray-300">{car.transmission}</span></div>}
                        {car.fuelType && <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"><span className="material-symbols-outlined text-gray-500 text-sm">local_gas_station</span><span className="text-sm text-gray-700 dark:text-gray-300">{car.fuelType}</span></div>}
                    </div>

                    {car.description && (
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{car.description}</p>
                        </div>
                    )}

                    {car.condition && (
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Condition</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{car.condition}</p>
                        </div>
                    )}

                    {car.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span className="text-sm">{car.location}</span>
                        </div>
                    )}

                    {dealer && (
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Seller</h3>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dealer-store/${dealer.id}`)}>
                                <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    {dealer.logoUrl ? (
                                        <img src={dealer.logoUrl} alt={dealer.storeName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-500">store</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{dealer.storeName}</p>
                                    {dealer.state && <p className="text-xs text-gray-500 dark:text-gray-400">{dealer.state}</p>}
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => dealer && navigate(`/dealer-store/${dealer.id}`)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90">
                            Contact Dealer
                        </button>
                        <button onClick={handleSaveCar} disabled={saving} className={`px-4 py-3 rounded-xl border ${isSaved ? 'border-red-200 text-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex h-16">
                    <Link to="/home" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full justify-center">
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>
                    <Link to="/buyer-saved" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full justify-center">
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/buyer-profile" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full justify-center">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>

            <ChatWidget dealerId={car?.dealerId} carId={carId} carName={car?.name} />
        </div>
    );
}

