import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminChatWidget from '../components/AdminChatWidget';

export default function AdminDashboard() {
    const { logout, getStats, getAllUsers, getPendingDealers, getAllDealers, approveDealer, rejectDealer, deleteUser, getAllCars, deleteCar, suspendUser, activateUser } = useAuth();
    
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBuyers: 0,
        totalSellers: 0,
        pendingApprovals: 0,
        activeSellers: 0,
        totalCars: 0
    });
    const [pendingDealers, setPendingDealers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allDealers, setAllDealers] = useState([]);
    const [allCars, setAllCars] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [userSubTab, setUserSubTab] = useState('buyers');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [dealerCars, setDealerCars] = useState([]);
    const [loadingDealerCars, setLoadingDealerCars] = useState(false);
    const [selectedPendingDealer, setSelectedPendingDealer] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const buyers = useMemo(() => {
        return allUsers.filter(user => user.role === 'buyer' || !user.role);
    }, [allUsers]);

    const dealers = useMemo(() => {
        const dealerUsers = allUsers.filter(user => user.role === 'dealer');
        return [...dealerUsers, ...allDealers];
    }, [allUsers, allDealers]);

    const filteredBuyers = useMemo(() => {
        if (!searchQuery.trim()) return buyers;
        const query = searchQuery.toLowerCase();
        return buyers.filter(buyer => 
            (buyer.email && buyer.email.toLowerCase().includes(query)) ||
            (buyer.fullName && buyer.fullName.toLowerCase().includes(query)) ||
            (buyer.phone && buyer.phone.toLowerCase().includes(query)) ||
            (buyer.uid && buyer.uid.toLowerCase().includes(query))
        );
    }, [buyers, searchQuery]);

    const filteredDealers = useMemo(() => {
        if (!searchQuery.trim()) return dealers;
        const query = searchQuery.toLowerCase();
        return dealers.filter(dealer => 
            (dealer.email && dealer.email.toLowerCase().includes(query)) ||
            (dealer.fullName && dealer.fullName.toLowerCase().includes(query)) ||
            (dealer.businessName && dealer.businessName.toLowerCase().includes(query)) ||
            (dealer.storeName && dealer.storeName.toLowerCase().includes(query)) ||
            (dealer.phone && dealer.phone.toLowerCase().includes(query)) ||
            (dealer.uid && dealer.uid.toLowerCase().includes(query))
        );
    }, [dealers, searchQuery]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [statsData, usersData, pendingData, dealersData, carsData] = await Promise.all([
                getStats(),
                getAllUsers(),
                getPendingDealers(),
                getAllDealers(),
                getAllCars()
            ]);
            setStats(statsData);
            setAllUsers(usersData);
            setPendingDealers(pendingData);
            setAllDealers(dealersData);
            setAllCars(carsData);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    }

    async function handleApprove(dealerId) {
        try {
            await approveDealer(dealerId);
            await loadData();
            alert('Dealer approved!');
        } catch (error) {
            alert('Error approving dealer');
        }
    }

    async function handleReject(dealerId) {
        try {
            await rejectDealer(dealerId);
            await loadData();
            alert('Dealer rejected');
        } catch (error) {
            alert('Error rejecting dealer');
        }
    }

    async function handleSuspendUser(userId) {
        if (!confirm('Are you sure you want to suspend this user?')) return;
        try {
            await suspendUser(userId);
            await loadData();
            alert('User suspended!');
        } catch (error) {
            alert('Error suspending user');
        }
    }

    async function handleUnsuspendUser(userId) {
        if (!confirm('Are you sure you want to unsuspend this user?')) return;
        try {
            await activateUser(userId);
            await loadData();
            alert('User unsuspended!');
        } catch (error) {
            alert('Error unsuspending user');
        }
    }

    async function handleDeleteUser(userId) {
        if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
        try {
            await deleteUser(userId);
            await loadData();
            alert('User deleted!');
        } catch (error) {
            alert('Error deleting user');
        }
    }

    async function handleDeleteCar(carId) {
        if (!confirm('Delete this car?')) return;
        try {
            await deleteCar(carId);
            await loadData();
        } catch (error) {
            alert('Error deleting car');
        }
    }

    async function handleLogout() {
        await logout();
        window.location.reload();
    }

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price);
    };

    async function handleViewDealer(dealer) {
        setSelectedDealer(dealer);
        setLoadingDealerCars(true);
        try {
            const dealerId = dealer.id || dealer.uid;
            const cars = allCars.filter(car => car.dealerId === dealerId);
            setDealerCars(cars);
        } catch (error) {
            console.error("Error loading dealer cars:", error);
        }
        setLoadingDealerCars(false);
    }

    function closeDealerModal() {
        setSelectedDealer(null);
        setDealerCars([]);
    }

    function handleViewPendingDealerDetails(dealer) {
        setSelectedPendingDealer(dealer);
    }

    function closePendingDealerModal() {
        setSelectedPendingDealer(null);
    }

    function handleViewUser(user) {
        setSelectedUser(user);
    }

    function closeUserModal() {
        setSelectedUser(null);
    }

    const dealerStats = useMemo(() => {
        const totalCars = dealerCars.length;
        const carsInStore = totalCars; 
        const carsSold = 0;
        const totalValue = dealerCars.reduce((sum, car) => sum + (car.price || 0), 0);
        return { totalCars, carsInStore, carsSold, totalValue };
    }, [dealerCars]);

    const renderUserRow = (user, isDealer = false) => (
        <tr key={user.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
            </td>
            {isDealer && (
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.storeName || user.businessName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">ID: {user.uid?.slice(0, 8)}...</div>
                </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 
                    user.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                }`}>
                    {user.status || 'active'}
                </span>
            </td>
            {isDealer && (
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {user.status || 'pending'}
                    </span>
                </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleViewUser(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                    >
                        View
                    </button>
                    {isDealer && (
                        <button
                            onClick={() => handleViewDealer(user)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                        >
                            Store
                        </button>
                    )}
                    {user.status === 'suspended' ? (
                        <button
                            onClick={() => handleUnsuspendUser(user.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                            Unsuspend
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                        >
                            Suspend
                        </button>
                    )}
                    <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">admin_panel_settings</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                    </button>
                </div>
            </header>

            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-8">
                        {['overview', 'dealers', 'users', 'cars'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                    activeTab === tab
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                <p className="text-sm text-gray-500">Total Users</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <p className="text-3xl font-bold text-gray-900">{stats.totalBuyers}</p>
                                <p className="text-sm text-gray-500">Buyers</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <p className="text-3xl font-bold text-gray-900">{stats.activeSellers}</p>
                                <p className="text-sm text-gray-500">Active Dealers</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                                <p className="text-sm text-gray-500">Pending Approvals</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <p className="text-3xl font-bold text-gray-900">{stats.totalCars}</p>
                            <p className="text-sm text-gray-500">Total Car Listings</p>
                        </div>
                    </div>
                )}

                {activeTab === 'dealers' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">Dealer Approvals</h2>
                        {pendingDealers.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-300">check_circle</span>
                                <p className="mt-4 text-gray-500">No pending dealer approvals</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDealers.map((dealer) => (
                                    <div key={dealer.id} className="bg-white p-6 rounded-xl shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{dealer.storeName || dealer.businessName || 'Unnamed Dealer'}</h3>
                                                <p className="text-sm text-gray-500">ID: {dealer.uid?.slice(0, 12)}...</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleViewPendingDealerDetails(dealer)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(dealer.id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(dealer.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                        
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone, or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="border-b">
                                <nav className="flex">
                                    <button
                                        onClick={() => setUserSubTab('buyers')}
                                        className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${
                                            userSubTab === 'buyers'
                                            ? 'border-b-2 border-red-600 text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        Buyers
                                        <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                            {buyers.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setUserSubTab('dealers')}
                                        className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${
                                            userSubTab === 'dealers'
                                            ? 'border-b-2 border-red-600 text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">store</span>
                                        Dealers
                                        <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                            {dealers.length}
                                        </span>
                                    </button>
                                </nav>
                            </div>

                            {userSubTab === 'buyers' && (
                                <div className="overflow-x-auto">
                                    {filteredBuyers.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <span className="material-symbols-outlined text-5xl text-gray-300">person_off</span>
                                            <p className="mt-4 text-gray-500">
                                                {searchQuery ? 'No buyers match your search' : 'No buyers found'}
                                            </p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredBuyers.map(user => renderUserRow(user, false))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {userSubTab === 'dealers' && (
                                <div className="overflow-x-auto">
                                    {filteredDealers.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <span className="material-symbols-outlined text-5xl text-gray-300">storefront</span>
                                            <p className="mt-4 text-gray-500">
                                                {searchQuery ? 'No dealers match your search' : 'No dealers found'}
                                            </p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredDealers.map(dealer => renderUserRow(dealer, true))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cars' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">All Car Listings</h2>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allCars.map((car) => (
                                        <tr key={car.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {car.name} {car.model}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatPrice(car.price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {car.dealerName || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDeleteCar(car.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {selectedDealer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Dealer Details</h2>
                                <button onClick={closeDealerModal} className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Store Name</p>
                                        <p className="font-medium">{selectedDealer.storeName || selectedDealer.businessName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedDealer.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedDealer.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">State</p>
                                        <p className="font-medium">{selectedDealer.state || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <a href={`/dealer-store/${selectedDealer.id || selectedDealer.uid}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        View Store
                                    </a>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dealership Analysis</h3>
                                {loadingDealerCars ? (
                                    <div className="text-center py-4">
                                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">{dealerStats.totalCars}</p>
                                            <p className="text-sm text-gray-600">Total Cars</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">{dealerStats.carsInStore}</p>
                                            <p className="text-sm text-gray-600">In Store</p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600">{dealerStats.carsSold}</p>
                                            <p className="text-sm text-gray-600">Cars Sold</p>
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-600">{formatPrice(dealerStats.totalValue)}</p>
                                            <p className="text-sm text-gray-600">Total Value</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AdminChatWidget />

            {selectedPendingDealer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Dealer Application Details</h2>
                                <button onClick={closePendingDealerModal} className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-medium">{selectedPendingDealer.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedPendingDealer.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone Number</p>
                                        <p className="font-medium">{selectedPendingDealer.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">State</p>
                                        <p className="font-medium">{selectedPendingDealer.state || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Business Name</p>
                                        <p className="font-medium">{selectedPendingDealer.businessName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Store Name</p>
                                        <p className="font-medium">{selectedPendingDealer.storeName || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-2">CAC Certificate</p>
                                        {selectedPendingDealer.cacCertificate ? (
                                            <a href={selectedPendingDealer.cacCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View</a>
                                        ) : (
                                            <p className="text-red-500">Not uploaded</p>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-2">Proof of Address</p>
                                        {selectedPendingDealer.proofOfAddress ? (
                                            <a href={selectedPendingDealer.proofOfAddress} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View</a>
                                        ) : (
                                            <p className="text-red-500">Not uploaded</p>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-2">Dealer ID</p>
                                        {selectedPendingDealer.dealerId ? (
                                            <a href={selectedPendingDealer.dealerId} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View</a>
                                        ) : (
                                            <p className="text-red-500">Not uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <button onClick={() => { handleApprove(selectedPendingDealer.id); closePendingDealerModal(); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                                <button onClick={() => { handleReject(selectedPendingDealer.id); closePendingDealerModal(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">{selectedUser.role === 'dealer' ? 'Dealer' : 'Buyer'} Details</h2>
                                <button onClick={closeUserModal} className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-medium">{selectedUser.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedUser.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">User ID</p>
                                        <p className="font-medium text-xs">{selectedUser.uid || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`px-2 py-1 text-xs rounded-full ${selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : selectedUser.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {selectedUser.status || 'active'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="font-medium capitalize">{selectedUser.role || 'buyer'}</p>
                                    </div>
                                </div>
                            </div>
                            {selectedUser.role === 'dealer' && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-500">Business Name</p>
                                            <p className="font-medium">{selectedUser.businessName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Store Name</p>
                                            <p className="font-medium">{selectedUser.storeName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">State</p>
                                            <p className="font-medium">{selectedUser.state || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4 pt-4 border-t">
                                {selectedUser.status === 'suspended' ? (
                                    <button onClick={() => { handleUnsuspendUser(selectedUser.id); closeUserModal(); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Unsuspend</button>
                                ) : (
                                    <button onClick={() => { handleSuspendUser(selectedUser.id); closeUserModal(); }} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Suspend</button>
                                )}
                                <button onClick={() => { handleDeleteUser(selectedUser.id); closeUserModal(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

