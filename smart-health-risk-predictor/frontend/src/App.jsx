import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import HealthInput from './pages/HealthInput/HealthInput';
import Prediction from './pages/Prediction/Prediction';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import Tips from './pages/Tips/Tips';
import Schedule from './pages/Schedule/Schedule';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="health-input" element={<HealthInput />} />
                <Route path="prediction" element={<Prediction />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="tips" element={<Tips />} />
                <Route path="schedule" element={<Schedule />} />
            </Route>
        </Routes>
    );
}

export default App;
