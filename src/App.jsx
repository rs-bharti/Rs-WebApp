import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import DashboardLayout from './components/layout/DashboardLayout';
import VoucherForm from './components/ui/VoucherForm';
import MasterForm from './components/ui/MasterForm';

// Helper component to handle Master Routing with capitalization
const MasterRouteWrapper = ({ userRole }) => {
  const { type } = useParams();
  const capitalizedType = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return <MasterForm type={capitalizedType} userRole={userRole} />;
};

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin');

  useEffect(() => {
    const handleStorage = () => {
      setUserRole(localStorage.getItem('userRole') || 'admin');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={(role) => setUserRole(role)} />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout userRole={userRole} />}>
          <Route index element={<Dashboard userRole={userRole} />} />
          <Route path="registration" element={<Registration />} />
          
          {/* Functional Voucher Routes for User */}
          <Route path="receipt" element={<VoucherForm type="Receipt" />} />
          <Route path="payment" element={<VoucherForm type="Payment" />} />
          <Route path="sales" element={<VoucherForm type="Sales" />} />
          <Route path="sales-return" element={<VoucherForm type="Sales Return" />} />
          <Route path="purchase" element={<VoucherForm type="Purchase" />} />
          <Route path="purchase-return" element={<VoucherForm type="Purchase Return" />} />
          <Route path="contra" element={<VoucherForm type="Contra" />} />
          
          {/* Functional Master Routes */}
          <Route path="master/:type" element={<MasterRouteWrapper userRole={userRole} />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
