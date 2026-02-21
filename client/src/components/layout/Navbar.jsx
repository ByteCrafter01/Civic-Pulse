import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const roleNavs = {
    CITIZEN: [
        { path: '/citizen/dashboard', label: 'My Complaints' },
        { path: '/citizen/submit', label: 'Submit Complaint' },
    ],
    OFFICER: [
        { path: '/officer/dashboard', label: 'Queue' },
    ],
    ADMIN: [
        { path: '/admin/panel', label: 'Dashboard' },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { connected, notifications } = useSocket();
    const location = useLocation();
    const [showNotifs, setShowNotifs] = useState(false);

    const navItems = roleNavs[user?.role] || [];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary-600 text-white flex items-center justify-center text-sm font-bold">CP</div>
                    <span className="font-semibold text-slate-900">CivicPulse</span>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${location.pathname === item.path
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link to="/public" className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        Public Portal
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`} title={connected ? 'Connected' : 'Disconnected'} />

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 rounded-md hover:bg-slate-100 transition-colors text-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                        {showNotifs && notifications.length > 0 && (
                            <div className="absolute right-0 top-12 w-80 card z-50 max-h-80 overflow-y-auto animate-fade-in shadow-lg">
                                <p className="text-sm font-semibold text-slate-700 mb-3">Notifications</p>
                                {notifications.map((n) => (
                                    <div key={n.id} className="p-3 rounded-md bg-slate-50 mb-2 text-sm">
                                        <p className="text-slate-700">{n.message}</p>
                                        <p className="text-slate-400 text-xs mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                            <p className="text-xs text-slate-400">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
