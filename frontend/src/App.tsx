import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Customer pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { FindParkingPage } from './pages/customer/FindParkingPage';
import { FacilityDetailPage } from './pages/customer/FacilityDetailPage';
import { ReservationWizardPage } from './pages/customer/ReservationWizardPage';
import { VehicleManagementPage } from './pages/customer/VehicleManagementPage';
import { ReservationHistoryPage } from './pages/customer/ReservationHistoryPage';
import { ParkingSessionsPage } from './pages/customer/ParkingSessionsPage';
import { PaymentHistoryPage } from './pages/customer/PaymentHistoryPage';
import { ComplaintsPage } from './pages/customer/ComplaintsPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Staff pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { EntryVerificationPage } from './pages/staff/EntryVerificationPage';
import { ExitProcessingPage } from './pages/staff/ExitProcessingPage';
import { StaffActiveSessionsPage } from './pages/staff/StaffActiveSessionsPage';
import { StaffComplaintsPage } from './pages/staff/StaffComplaintsPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFacilitiesPage } from './pages/admin/AdminFacilitiesPage';
import { AdminSlotsPage } from './pages/admin/AdminSlotsPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Route Guard Component
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized for this specific role, redirect to their role home
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PARKING_STAFF') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <AppLayout title="Customer Portal" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="find-parking" element={<FindParkingPage />} />
              <Route path="facility/:id" element={<FacilityDetailPage />} />
              <Route path="reserve" element={<ReservationWizardPage />} />
              <Route path="vehicles" element={<VehicleManagementPage />} />
              <Route path="reservations" element={<ReservationHistoryPage />} />
              <Route path="sessions" element={<ParkingSessionsPage />} />
              <Route path="payments" element={<PaymentHistoryPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Staff Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['PARKING_STAFF', 'ADMIN']}>
                  <AppLayout title="Staff Portal" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="check-in" element={<EntryVerificationPage />} />
              <Route path="check-out" element={<ExitProcessingPage />} />
              <Route path="active-sessions" element={<StaffActiveSessionsPage />} />
              <Route path="complaints" element={<StaffComplaintsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout title="Administrator Workspace" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="facilities" element={<AdminFacilitiesPage />} />
              <Route path="slots" element={<AdminSlotsPage />} />
              <Route path="pricing" element={<AdminPricingPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="reservations" element={<AdminReservationsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="complaints" element={<AdminComplaintsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
