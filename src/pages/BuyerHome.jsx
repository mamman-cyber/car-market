import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function BuyerHome() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ stores: [], cars: [] });
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch approved stores
                const storesQuery = query(
                    collection(db, 'dealers'),
                    where('status', '==', 'approved'),
                    where('setupComplete', '==', true)
                );
                const storesSnapshot = await getDocs(storesQuery);
                const storesData = storesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'store',
                    ...doc.data()
                }));
                setStores(storesData);

                // Fetch active cars
                const carsQuery = query(
                    collection(db, 'cars'),
                    where('status', '==', 'active')
                );
                const carsSnapshot = await getDocs(carsQuery);
                const carsData = carsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'car',
                    ...doc.data()
                }));
                setCars(carsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setStores([]);
                setCars([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const defaultStoreImages = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBGisB7sBMp6X_HHI0f02mFMYXeXIRoXBsSmdLKMgomgmR47eLGeGGSlUar25uXamB1ggDuOhu7ortMJcCc1LkZQfUpWifKbraTRDhdHR7LebbUxYQPKj5MqOUdUucuBJBuOzhBQKUgxFI06Pci5urYlSpI6TfzSQ8d3OAJB5CqkA_WkBbejkiBYX3sZwOWc4LfBKfPk_A595k1UkulKwhxKI7A6uYDYdribk-gGkxQSUo3OPsoeBepuV4XFy5yQszP33M6aKLDdBc",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlNR6SEq34_ueD65xGdyhpaP3EU-jqK1dtWi6fehsm8d6qc_nDX9xD56woCd7etXDG8mTPbz94ifKCR-o-hScsDMj2aqOnfAuWM7bbaeWs9WSL0Gy9TRlC7t8S05gO6RfFLP_4T4SPmW1gH6ykk7vhumTN0timhaRA2Hr_cB_RfkpEtiaUGwJ31bKYnZH8aDt51s2CwYBzDoz6WVBhtSryN-mxdRHkfCgjYnac9mfEq0CeGBHxVdOI2SjAUTwLgxj4UgUfav8VqDY",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBIu2Ur6X_6B2uxbRVH8pPWpdlmSE1Iw6hcnJQrinUxC4FdNnqJRAzXS-W7IY4lsGnO4gqNofNR9t5sodz8vupbW8r4zSrYI853_nNojfEV9SMuk274MMcdsD9AU38dF8rsMXTrsaPrK1DGbdYMbPvxD3kmoGC2onMtvFbXiyGqzWmMUJ9a3YRS_wfFsZgu-y4GhDs5C3MFXJp5O-MJfIKmPLaZWClDMZgcl-kn_SxKk7__zKYAYQ98P3gj7-uMkhzHSe1iL1biI_k",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBATEkUJ2JRfvMr48L3LQu9FZ_xTaO6xfNgkyf-1VeLzyDZ9S6enOcVlXA3UFjhXSDv8H1QZCjJmiibYmNI07mShhDKqIoINWxiU1x-tLMUV2rqbFjDvhc-2WFpbtoLT3hQbYXYfa9rP-Ku4OQD-W5mXGl24kOrp7h7biGRqlYfIxfc4POrGROkgFkriyg4YSj5bLUvIVWxWFaXofcTQRYUQ0dAGKKSWRE4Id0fWA5wVexCTCM2BFC9XoLbNvVpRAI3MSvkPoW7Ekk"
    ];

    const defaultCarImages = [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
    ];

    // Search function that handles store name, car name, car model, and dealer's name
    const handleSearch = (query) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults({ stores: [], cars: [] });
            return;
        }

        setIsSearching(true);
        const lowerQuery = query.toLowerCase();

        // Search stores by store name, dealer's name, and moto
        const matchedStores = stores.filter(store => 
            store.storeName?.toLowerCase().includes(lowerQuery) ||
            store.moto?.toLowerCase().includes(lowerQuery) ||
            store.dealerName?.toLowerCase().includes(lowerQuery) ||
            store.fullName?.toLowerCase().includes(lowerQuery)
        );

        // Search cars by name, model, make, year
        const matchedCars = cars.filter(car => 
            car.name?.toLowerCase().includes(lowerQuery) ||
            car.make?.toLowerCase().includes(lowerQuery) ||
            car.model?.toLowerCase().includes(lowerQuery) ||
            car.year?.toString().includes(lowerQuery) ||
            car.description?.toLowerCase().includes(lowerQuery)
        );

        setSearchResults({
            stores: matchedStores,
            cars: matchedCars
        });
    };

    const getCarImage = (car, index) => {
        if (car.images?.front) return car.images.front;
        if (car.image) return car.image;
        return defaultCarImages[index % defaultCarImages.length];
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return typeof price === 'number' 
            ? `₦${price.toLocaleString('en-NG')}` 
            : price;
    };

    const displayStores = isSearching ? searchResults.stores : stores;
    const displayCars = isSearching ? searchResults.cars : [];

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white text-lg font-bold">AutoHub</p>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">logout</span>
                    </button>
                </div>
                
                {/* Search Bar */}
                <div className="mt-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                        <input 
                            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary text-sm" 
                            placeholder="Search stores, cars, dealers..." 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => handleSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Results Header */}
            {isSearching && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {searchResults.stores.length + searchResults.cars.length} results found
                    </p>
                </div>
            )}

            {isSearching && searchResults.stores.length === 0 && searchResults.cars.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
                    <p className="text-gray-500 dark:text-gray-400 text-center">No results found for "{searchQuery}"</p>
                </div>
            )}

            {/* Content */}
            <div className="p-4 pb-24">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col gap-3 pb-3">
                                <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayStores.map((store, index) => (
                            <div 
                                key={store.id} 
                                className="flex flex-col gap-3 pb-3 cursor-pointer"
                                onClick={() => navigate(`/dealer-store/${store.id}`)}
                            >
                                <div 
                                    className="w-full aspect-[4/3] bg-cover bg-center rounded-xl" 
                                    style={{ 
                                        backgroundImage: store.logoUrl 
                                            ? `url("${store.logoUrl}")` 
                                            : `url("${defaultStoreImages[index % defaultStoreImages.length]}")` 
                                    }}
                                ></div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium text-sm leading-normal">{store.storeName}</p>
                                    {store.moto && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{store.moto}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <Link to="/home" className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
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
        </div>
    );
}

