import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Citizen
import CitizenDashboard from './pages/citizen/Dashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import ComplaintDetail from './pages/citizen/ComplaintDetail';

// Officer
import OfficerDashboard from './pages/officer/Dashboard';

// Admin
import AdminPanel from './pages/admin/Panel';

// Public
import PublicDashboard from './pages/public/Dashboard';

// Route guards
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/shared/LoadingSpinner';

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullScreen />;
    if (!user) return <Navigate to="/public" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/panel" replace />;
    if (user.role === 'OFFICER') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
}

export default function App() {
    return (
        <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/public" element={<PublicDashboard />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Citizen */}
            <Route path="/citizen/dashboard" element={<ProtectedRoute roles={['CITIZEN']}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/citizen/submit" element={<ProtectedRoute roles={['CITIZEN']}><SubmitComplaint /></ProtectedRoute>} />
            <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={['CITIZEN']}><ComplaintDetail /></ProtectedRoute>} />

            {/* Officer */}
            <Route path="/officer/dashboard" element={<ProtectedRoute roles={['OFFICER']}><OfficerDashboard /></ProtectedRoute>} />
            <Route path="/officer/complaints/:id" element={<ProtectedRoute roles={['OFFICER']}><ComplaintDetail /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/panel" element={<ProtectedRoute roles={['ADMIN']}><AdminPanel /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="/unauthorized" element={
                <div className="min-h-screen bg-civic-dark flex items-center justify-center text-center">
                    <div>
                        <div className="text-5xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-slate-200 mb-2">Access Denied</h1>
                        <p className="text-slate-500">You don't have permission to view this page.</p>
                        <a href="/" className="btn-primary inline-block mt-6 text-sm">Go Home</a>
                    </div>
                </div>
            } />
            <Route path="*" element={
                <div className="min-h-screen bg-civic-dark flex items-center justify-center text-center">
                    <div>
                        <div className="text-5xl mb-4">404</div>
                        <h1 className="text-2xl font-bold text-slate-200 mb-2">Page Not Found</h1>
                        <a href="/" className="btn-primary inline-block mt-6 text-sm">Go Home</a>
                    </div>
                </div>
            } />
        </Routes>
    );
}
