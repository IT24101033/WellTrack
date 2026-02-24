import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Landing from './pages/Landing/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import HealthInput from './pages/HealthInput/HealthInput';
import Prediction from './pages/Prediction/Prediction';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import Tips from './pages/Tips/Tips';
import Schedule from './pages/Schedule/Schedule';
import Profile from './pages/Profile/Profile';
import AdminUsers from './pages/Admin/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard Routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="health-input" element={<HealthInput />} />
                <Route path="prediction" element={<Prediction />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="tips" element={<Tips />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="profile" element={<Profile />} />

                {/* Admin Only */}
                <Route path="admin/users" element={
                    <ProtectedRoute adminOnly>
                        <AdminUsers />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
