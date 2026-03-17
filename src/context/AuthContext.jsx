import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, googleProvider } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
} from "firebase/auth";
import {
    doc, getDoc, setDoc, serverTimestamp,
    collection, getDocs, updateDoc, deleteDoc, query, where
} from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign Up Function (Handles both Buyer and Dealer creation in Firestore)
    async function signup(email, password, role, additionalData) {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        // Create User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            role: role,
            createdAt: serverTimestamp(),
            status: 'active',
            ...additionalData, // e.g., fullName, phone, state
        });

        // Create Specific Role Document if needed (e.g., dealers collection)
        if (role === 'dealer') {
            await setDoc(doc(db, "dealers", user.uid), {
                uid: user.uid,
                businessName: additionalData.businessName || "",
                status: "pending", // Default status for dealers
                createdAt: serverTimestamp(),
                ...additionalData,
            });
        }

        return user;
    }

    // Login Function
    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Forgot Password Function
    async function forgotPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    // Google Sign-In Function
    async function signInWithGoogle(role) {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user already exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User already exists, return the user
            return user;
        }

        // New user - create their Firestore document
        // Extract name from Google profile
        const displayName = user.displayName || '';
        const fullName = displayName.split(' ').slice(0, -1).join(' ') || displayName;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            role: role,
            fullName: fullName,
            phone: user.phoneNumber || '',
            createdAt: serverTimestamp(),
            status: 'active',
            photoURL: user.photoURL || '',
        });

        // Create Specific Role Document if dealer
        if (role === 'dealer') {
            await setDoc(doc(db, "dealers", user.uid), {
                uid: user.uid,
                businessName: "",
                status: "pending", // Default status for dealers
                createdAt: serverTimestamp(),
            });
        }

        return user;
    }

    // Logout Function
    function logout() {
        return signOut(auth);
    }

    // Get All Users (Admin function)
    async function getAllUsers() {
        const usersCollection = collection(db, "users");
        const userDocs = await getDocs(usersCollection);
        return userDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Get All Dealers with pending status (Admin function)
    async function getPendingDealers() {
        const dealersCollection = collection(db, "dealers");
        const q = query(dealersCollection, where("status", "==", "pending"));
        const dealerDocs = await getDocs(q);
        return dealerDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Get All Dealers (Admin function)
    async function getAllDealers() {
        const dealersCollection = collection(db, "dealers");
        const dealerDocs = await getDocs(dealersCollection);
        return dealerDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Approve Dealer (Admin function)
    async function approveDealer(dealerId) {
        // Update dealer status
        await updateDoc(doc(db, "dealers", dealerId), {
            status: "approved"
        });
        // Update user status
        await updateDoc(doc(db, "users", dealerId), {
            status: "active"
        });
    }

    // Reject Dealer (Admin function)
    async function rejectDealer(dealerId) {
        await updateDoc(doc(db, "dealers", dealerId), {
            status: "rejected"
        });
        await updateDoc(doc(db, "users", dealerId), {
            status: "rejected"
        });
    }

    // Suspend User (Admin function)
    async function suspendUser(userId) {
        await updateDoc(doc(db, "users", userId), {
            status: "suspended"
        });
    }

    // Activate User (Admin function)
    async function activateUser(userId) {
        await updateDoc(doc(db, "users", userId), {
            status: "active"
        });
    }

    // Delete User (Admin function)
    async function deleteUser(userId) {
        await deleteDoc(doc(db, "users", userId));
        const dealerDoc = await getDoc(doc(db, "dealers", userId));
        if (dealerDoc.exists()) {
            await deleteDoc(doc(db, "dealers", userId));
        }
    }

    // Get Stats (Admin function)
    async function getStats() {
        const usersCollection = collection(db, "users");
        const dealersCollection = collection(db, "dealers");
        const carsCollection = collection(db, "cars");

        const allUsers = await getDocs(usersCollection);
        const allDealers = await getDocs(dealersCollection);
        const allCars = await getDocs(carsCollection);

        const buyers = allUsers.docs.filter(doc => doc.data().role === 'buyer').length;
        const sellers = allDealers.docs.length;
        const pendingSellers = allDealers.docs.filter(doc => doc.data().status === 'pending').length;
        const activeSellers = allDealers.docs.filter(doc => doc.data().status === 'approved').length;

        // Cars analytics
        const carsByCondition = {
            brand_new: allCars.docs.filter(doc => doc.data().condition === 'brand_new').length,
            foreign_used: allCars.docs.filter(doc => doc.data().condition === 'foreign_used').length,
            nigerian_used: allCars.docs.filter(doc => doc.data().condition?.startsWith('nigerian_used')).length,
        };

        const carsByLocation = {};
        allCars.docs.forEach(doc => {
            const location = doc.data().location || 'Unknown';
            carsByLocation[location] = (carsByLocation[location] || 0) + 1;
        });

        return {
            totalUsers: allUsers.docs.length,
            totalBuyers: buyers,
            totalSellers: sellers,
            pendingApprovals: pendingSellers,
            activeSellers: activeSellers,
            totalCars: allCars.docs.length,
            carsByCondition,
            carsByLocation,
        };
    }

    // Get All Cars (Admin function)
    async function getAllCars() {
        const carsCollection = collection(db, "cars");
        const carDocs = await getDocs(carsCollection);
        const cars = carDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Enrich with dealer info
        const enrichedCars = await Promise.all(cars.map(async (car) => {
            try {
                const dealerDoc = await getDoc(doc(db, "dealers", car.dealerId));
                if (dealerDoc.exists()) {
                    return {
                        ...car,
                        dealerName: dealerDoc.data().storeName || dealerDoc.data().businessName || 'Unknown',
                        dealerStatus: dealerDoc.data().status || 'unknown'
                    };
                }
                return {
                    ...car,
                    dealerName: 'Unknown',
                    dealerStatus: 'unknown'
                };
            } catch (e) {
                return {
                    ...car,
                    dealerName: 'Unknown',
                    dealerStatus: 'unknown'
                };
            }
        }));

        return enrichedCars;
    }

    // Get Cars by Dealer (Admin function)
    async function getDealerCars(dealerId) {
        const carsCollection = collection(db, "cars");
        const q = query(carsCollection, where("dealerId", "==", dealerId));
        const carDocs = await getDocs(q);
        return carDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Delete Car (Admin function)
    async function deleteCar(carId) {
        await deleteDoc(doc(db, "cars", carId));
    }

    // Check if user is admin
    async function checkIsAdmin(userId) {
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                return userDoc.data().role === 'admin';
            }
            return false;
        } catch (e) {
            console.error("Error checking admin:", e);
            return false;
        }
    }

    // Get admin data
    async function getAdminData() {
        try {
            const users = await getAllUsers();
            const dealers = await getAllDealers();
            const cars = await getAllCars();
            const stats = await getStats();
            return {
                users,
                dealers,
                cars,
                stats
            };
        } catch (e) {
            console.error("Error getting admin data:", e);
            throw e;
        }
    }

    // Get activity logs (placeholder - can be expanded)
    async function getActivityLogs(limit = 50) {
        try {
            const logsCollection = collection(db, "activityLogs");
            const q = query(logsCollection, where("timestamp", ">", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))); // Last 7 days
            const logDocs = await getDocs(q);
            return logDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
        } catch (e) {
            console.error("Error getting activity logs:", e);
            return [];
        }
    }

    // Create new admin account (only existing admins can do this)
    async function createAdmin(email, password, fullName) {
        // First check if current user is admin
        if (!currentUser) {
            throw new Error("Must be logged in to create admin");
        }

        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
            throw new Error("Only admins can create new admin accounts");
        }

        // Create the new admin user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create admin user document
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            fullName: fullName,
            role: 'admin',
            createdAt: serverTimestamp(),
            status: 'active',
            isSuperAdmin: false, // Not a super admin (only first admin is super admin)
            createdBy: currentUser.uid,
        });

        return user;
    }

    // Change Password Function
    async function changePassword(newPassword) {
        if (!currentUser) {
            throw new Error("No user logged in");
        }
        await updatePassword(currentUser, newPassword);
    }

    // Monitor Auth State & Fetch User Role
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch user data from Firestore to get role
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUser({ ...user, ...userData });
                        setUserRole(userData.role || null);
                    } else {
                        // Fallback if firestore doc doesn't exist yet (edge case)
                        setCurrentUser(user);
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setCurrentUser(user);
                    setUserRole(null);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        signup,
        login,
        logout,
        forgotPassword,
        signInWithGoogle,
        getAllUsers,
        getPendingDealers,
        getAllDealers,
        approveDealer,
        rejectDealer,
        suspendUser,
        activateUser,
        deleteUser,
        getStats,
        getAllCars,
        getDealerCars,
        deleteCar,
        changePassword,
        checkIsAdmin,
        getAdminData,
        getActivityLogs,
        createAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div style={{ padding: '50px', fontSize: '24px', textAlign: 'center' }}>Loading Authentication...</div>}
        </AuthContext.Provider>
    );
}
