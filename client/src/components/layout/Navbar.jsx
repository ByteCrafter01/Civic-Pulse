import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import {
    Bell, Sun, Moon, Menu, X, LogOut, Globe,
    LayoutDashboard, PlusCircle, Shield, Brain, Users, Globe2
} from 'lucide-react';

const roleNavs = {
    CITIZEN: [
        { path: '/citizen/dashboard', label: 'My Complaints', icon: LayoutDashboard },
        { path: '/citizen/submit', label: 'Submit Complaint', icon: PlusCircle },
    ],
    OFFICER: [
        { path: '/officer/dashboard', label: 'Queue', icon: Users },
    ],
    ADMIN: [
        { path: '/admin/panel', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/ai-evaluation', label: 'AI Evaluation', icon: Brain },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { connected, notifications } = useSocket();
    const { theme, toggleTheme } = useTheme();
    const { i18n } = useTranslation();
    const location = useLocation();
    const [showNotifs, setShowNotifs] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi');
    };

    const navItems = roleNavs[user?.role] || [];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-600/25">CP</div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">CivicPulse</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${location.pathname === item.path
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                    <Link to="/public" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                        <Globe2 className="w-4 h-4" />
                        Public Portal
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        aria-label="Toggle language"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {i18n.language === 'hi' ? 'EN' : 'HI'}
                    </button>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-slate-600 dark:text-slate-300"
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Connection status */}
                    <div className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-slate-300'}`} title={connected ? 'Connected' : 'Disconnected'} />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-slate-600 dark:text-slate-300"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/50 animate-pulse">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                        {showNotifs && notifications.length > 0 && (
                            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl z-50 max-h-80 overflow-y-auto shadow-xl p-4" style={{ animation: 'fadeIn 0.15s ease-out' }}>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Notifications</p>
                                {notifications.map((n) => (
                                    <div key={n.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 mb-2 text-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-700 dark:text-slate-200">{n.message}</p>
                                        <p className="text-slate-400 text-xs mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User info + logout (desktop) */}
                    <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                            aria-label="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ animation: 'fadeIn 0.15s ease-out' }}>
                    <div className="px-4 py-3 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    location.pathname === item.path
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            to="/public"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Globe2 className="w-4 h-4" />
                            Public Portal
                        </Link>
                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="px-3 text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name} <span className="text-xs text-slate-400">({user?.role})</span></p>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
