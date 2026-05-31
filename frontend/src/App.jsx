import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './pages/Login';
import BranchSelect from './pages/BranchSelect';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import DashboardLayout from './components/layout/DashboardLayout';
import ReceiptVoucherForm from './components/ui/vouchers/ReceiptVoucherForm';
import PaymentVoucherForm from './components/ui/vouchers/PaymentVoucherForm';
import ContraVoucherForm from './components/ui/vouchers/ContraVoucherForm';
import SalesVoucherForm from './components/ui/vouchers/SalesVoucherForm';
import SalesReturnVoucherForm from './components/ui/vouchers/SalesReturnVoucherForm';
import PurchaseVoucherForm from './components/ui/vouchers/PurchaseVoucherForm';
import PurchaseReturnVoucherForm from './components/ui/vouchers/PurchaseReturnVoucherForm';
import StockDataVoucherForm from './components/ui/vouchers/StockDataVoucherForm';
import StockTransferVoucherForm from './components/ui/vouchers/StockTransferVoucherForm';
import WarehouseMaster from './components/ui/WarehouseMaster';
import MasterForm from './components/ui/MasterForm';
import { useAuth } from './context/AuthContext';

const MasterRouteWrapper = ({ userRole }) => {
  const { type } = useParams();
  const capitalizedType = type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return <MasterForm type={capitalizedType} userRole={userRole} />;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/select-branch" element={<ProtectedRoute><BranchSelect /></ProtectedRoute>} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout userRole={userRole} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard userRole={userRole} />} />
          <Route path="registration" element={<Registration />} />

          <Route path="receipt" element={<ReceiptVoucherForm />} />
          <Route path="payment" element={<PaymentVoucherForm />} />
          <Route path="sales" element={<SalesVoucherForm />} />
          <Route path="sales-return" element={<SalesReturnVoucherForm />} />
          <Route path="purchase" element={<PurchaseVoucherForm />} />
          <Route path="purchase-return" element={<PurchaseReturnVoucherForm />} />
          <Route path="contra" element={<ContraVoucherForm />} />
          <Route path="stock-data" element={<StockDataVoucherForm />} />
          <Route path="stock-transfer" element={<StockTransferVoucherForm />} />

          <Route path="master/warehouse" element={<WarehouseMaster userRole={userRole} />} />
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
