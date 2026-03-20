import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

// Landing
import Landing from './pages/Landing';

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
import AIEvaluation from './pages/admin/AIEvaluation';

// Public
import PublicDashboard from './pages/public/Dashboard';

// Route guards
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/shared/LoadingSpinner';
import AIChatWidget from './components/shared/AIChatWidget';
import PageTransition from './components/shared/PageTransition';

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullScreen />;
    if (!user) return <Navigate to="/landing" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/panel" replace />;
    if (user.role === 'OFFICER') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
}

function AnimatedPage({ children }) {
    return <PageTransition>{children}</PageTransition>;
}

export default function App() {
    const { user } = useAuth();
    const location = useLocation();

    return (
        <>
        <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/public" element={<AnimatedPage><PublicDashboard /></AnimatedPage>} />

            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />

            <Route path="/citizen/dashboard" element={<ProtectedRoute roles={['CITIZEN']}><AnimatedPage><CitizenDashboard /></AnimatedPage></ProtectedRoute>} />
            <Route path="/citizen/submit" element={<ProtectedRoute roles={['CITIZEN']}><AnimatedPage><SubmitComplaint /></AnimatedPage></ProtectedRoute>} />
            <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={['CITIZEN']}><AnimatedPage><ComplaintDetail /></AnimatedPage></ProtectedRoute>} />

            <Route path="/officer/dashboard" element={<ProtectedRoute roles={['OFFICER']}><AnimatedPage><OfficerDashboard /></AnimatedPage></ProtectedRoute>} />
            <Route path="/officer/complaints/:id" element={<ProtectedRoute roles={['OFFICER']}><AnimatedPage><ComplaintDetail /></AnimatedPage></ProtectedRoute>} />

            <Route path="/admin/panel" element={<ProtectedRoute roles={['ADMIN']}><AnimatedPage><AdminPanel /></AnimatedPage></ProtectedRoute>} />
            <Route path="/admin/ai-evaluation" element={<ProtectedRoute roles={['ADMIN']}><AnimatedPage><AIEvaluation /></AnimatedPage></ProtectedRoute>} />

            <Route path="/unauthorized" element={
                <AnimatedPage>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-center">
                    <div>
                        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent mb-4">403</h1>
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Access Denied</h2>
                        <p className="text-slate-500 dark:text-slate-400">You don't have permission to view this page.</p>
                        <a href="/" className="btn-primary inline-block mt-6 text-sm">Go Home</a>
                    </div>
                </div>
                </AnimatedPage>
            } />
            <Route path="*" element={
                <AnimatedPage>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-center">
                    <div>
                        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent mb-4">404</h1>
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Page Not Found</h2>
                        <a href="/" className="btn-primary inline-block mt-6 text-sm">Go Home</a>
                    </div>
                </div>
                </AnimatedPage>
            } />
        </Routes>
        </AnimatePresence>
        {user && <AIChatWidget />}
        <Toaster
            position="top-right"
            toastOptions={{
                className: 'text-sm font-medium',
                style: { borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
        />
        </>
    );
}
