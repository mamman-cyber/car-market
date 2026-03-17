import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BuyerSignup from './pages/BuyerSignup';
import DealerSignup from './pages/DealerSignup';
import DealerReviewPending from './pages/DealerReviewPending';
import DealerSetup from './pages/DealerSetup';
import BuyerHome from './pages/BuyerHome';
import BuyerSaved from './pages/BuyerSaved';
import BuyerProfile from './pages/BuyerProfile';
import BuyerEditProfile from './pages/BuyerEditProfile';
import BuyerNotifications from './pages/BuyerNotifications';
import BuyerSettings from './pages/BuyerSettings';
import BuyerPrivacy from './pages/BuyerPrivacy';
import BuyerHelp from './pages/BuyerHelp';
import BuyerAbout from './pages/BuyerAbout';
import BuyerChats from './pages/BuyerChats';
import DealerHome from './pages/DealerHome';
import DealerListings from './pages/DealerListings';
import DealerProfile from './pages/DealerProfile';
import DealerStore from './pages/DealerStore';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminReset from './pages/AdminReset';
import CreateAdmin from './pages/CreateAdmin';
import AddCar from './pages/AddCar';
import CarDetails from './pages/CarDetails';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/buyer-signup" element={<BuyerSignup />} />
        <Route path="/dealer-signup" element={<DealerSignup />} />
        <Route path="/dealer-review-pending" element={<DealerReviewPending />} />
        <Route path="/dealer-setup" element={<DealerSetup />} />
        
        {/* Buyer Routes */}
        <Route path="/home" element={<BuyerHome />} />
        <Route path="/buyer-saved" element={<BuyerSaved />} />
        <Route path="/buyer-profile" element={<BuyerProfile />} />
        <Route path="/buyer-edit-profile" element={<BuyerEditProfile />} />
        <Route path="/buyer-notifications" element={<BuyerNotifications />} />
        <Route path="/buyer-settings" element={<BuyerSettings />} />
        <Route path="/buyer-privacy" element={<BuyerPrivacy />} />
        <Route path="/buyer-help" element={<BuyerHelp />} />
        <Route path="/buyer-about" element={<BuyerAbout />} />
        <Route path="/buyer-chats" element={<BuyerChats />} />
        <Route path="/car/:carId" element={<CarDetails />} />
        
        {/* Dealer Routes */}
        <Route path="/dealer-home" element={<DealerHome />} />
        <Route path="/dealer-listings" element={<DealerListings />} />
        <Route path="/dealer-profile" element={<DealerProfile />} />
        <Route path="/dealer-store/:dealerId" element={<DealerStore />} />
        <Route path="/add-car" element={<AddCar />} />
        <Route path="/edit-car/:carId" element={<AddCar />} />
        
        {/* Admin Route - shows setup form if no admin exists */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create-admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
