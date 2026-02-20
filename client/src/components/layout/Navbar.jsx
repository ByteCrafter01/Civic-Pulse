import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const roleNavs = {
    CITIZEN: [
        { path: '/citizen/dashboard', label: 'My Complaints', icon: '📋' },
        { path: '/citizen/submit', label: 'Submit Complaint', icon: '➕' },
    ],
    OFFICER: [
        { path: '/officer/dashboard', label: 'Queue', icon: '📋' },
    ],
    ADMIN: [
        { path: '/admin/panel', label: 'Dashboard', icon: '🏠' },
        { path: '/admin/sla-monitor', label: 'SLA Monitor', icon: '⏱️' },
        { path: '/admin/assignments', label: 'Assignments', icon: '👷' },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { connected, notifications } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [showNotifs, setShowNotifs] = useState(false);

    const navItems = roleNavs[user?.role] || [];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-2xl">🏙️</span>
                    <span className="font-bold text-lg gradient-text">CivicPulse</span>
                    <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30 ml-1">v2</span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${location.pathname === item.path
                                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                    <Link to="/public" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-200">
                        <span>🌐</span> Public Map
                    </Link>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Connection indicator */}
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} title={connected ? 'Connected' : 'Disconnected'} />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            🔔
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                        {showNotifs && notifications.length > 0 && (
                            <div className="absolute right-0 top-12 w-80 card z-50 max-h-80 overflow-y-auto animate-fade-in">
                                <p className="text-sm font-semibold text-slate-300 mb-3">Notifications</p>
                                {notifications.map((n) => (
                                    <div key={n.id} className="p-3 rounded-lg bg-slate-800/50 mb-2 text-sm">
                                        <p className="text-slate-200">{n.message}</p>
                                        <p className="text-slate-500 text-xs mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
