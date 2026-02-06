// =============================================================================
// App Component - Root Router
// =============================================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from './components/Toast';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { SupplierLayout } from './layouts/SupplierLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Landing } from './pages/public/Landing';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';

// Supplier Pages
import {
  Dashboard as SupplierDashboard,
  SubmitBatch,
  Submissions,
  Payments as SupplierPayments,
  Profile,
  PayoutSettings,
} from './pages/supplier';

// Admin Pages
import {
  Dashboard as AdminDashboard,
  ReviewQueue,
  Verified,
  Rejected,
  Suppliers,
  SupplierDetail,
  Payments as AdminPayments,
  PayoutRequests,
  Settings as AdminSettings,
  Registrations,
} from './pages/admin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Supplier Routes */}
        <Route path="/supplier" element={<SupplierLayout />}>
          <Route index element={<SupplierDashboard />} />
          <Route path="submit" element={<SubmitBatch />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="payments" element={<SupplierPayments />} />
          <Route path="payout-settings" element={<PayoutSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="queue" element={<ReviewQueue />} />
          <Route path="verified" element={<Verified />} />
          <Route path="rejected" element={<Rejected />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id" element={<SupplierDetail />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="payouts" element={<PayoutRequests />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer />
    </Router>
  );
}

export default App;

