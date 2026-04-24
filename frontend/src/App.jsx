import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Landing from './pages/Landing/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import HealthInput from './pages/HealthInput/HealthInput';
import Prediction from './pages/Prediction/Prediction';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import HealthTipsDashboard from './pages/Tips/HealthTipsDashboard';
import GoogleFitSync from './pages/GoogleFitSync/GoogleFitSync';
import Schedule from './pages/Schedule/Schedule';
import Profile from './pages/Profile/Profile';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminTipsManagement from './pages/Admin/AdminTipsManagement';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminBroadcasts from './pages/Admin/AdminBroadcasts';
import AdminReports from './pages/Admin/AdminReports';
import AdminPayments from './pages/Admin/AdminPayments';
import Subscription from './pages/Subscription/Subscription';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
    const { isAdmin } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Dashboard Routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
                <Route path="health-input" element={<HealthInput />} />
                <Route path="prediction" element={<Prediction />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="tips" element={<HealthTipsDashboard />} />
                <Route path="watch-sync" element={<GoogleFitSync />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<Subscription />} />

                {/* Admin Only */}
                <Route path="admin/users" element={
                    <ProtectedRoute adminOnly>
                        <AdminUsers />
                    </ProtectedRoute>
                } />
                <Route path="admin/tips" element={
                    <ProtectedRoute adminOnly>
                        <AdminTipsManagement />
                    </ProtectedRoute>
                } />
                <Route path="admin/broadcasts" element={
                    <ProtectedRoute adminOnly>
                        <AdminBroadcasts />
                    </ProtectedRoute>
                } />
                <Route path="admin/reports" element={
                    <ProtectedRoute adminOnly>
                        <AdminReports />
                    </ProtectedRoute>
                } />
                <Route path="admin/payments" element={
                    <ProtectedRoute adminOnly>
                        <AdminPayments />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
