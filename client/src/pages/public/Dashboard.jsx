import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatsCard from '../../components/shared/StatsCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export default function PublicDashboard() {
    const [stats, setStats] = useState(null);
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trackId, setTrackId] = useState('');
    const [trackResult, setTrackResult] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [trackError, setTrackError] = useState('');

    useEffect(() => {
        Promise.all([
            api.get('/public/stats'),
            api.get('/public/by-department'),
        ]).then(([s, d]) => {
            setStats(s.data.data);
            setDepts(d.data.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!trackId.trim()) return;
        setTracking(true);
        setTrackError('');
        setTrackResult(null);
        try {
            const { data } = await api.get(`/public/track/${trackId.trim()}`);
            setTrackResult(data.data);
        } catch {
            setTrackError('Complaint not found. Please check the ID.');
        } finally { setTracking(false); }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="bg-civic-dark min-h-screen">
            {/* Simple header */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏙️</span>
                        <span className="font-bold text-lg gradient-text">CivicPulse</span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full ml-1">Public Portal</span>
                    </div>
                    <Link to="/login" className="btn-primary text-sm py-2">Sign In</Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 pt-24 pb-12">
                {/* Hero */}
                <div className="text-center mb-12 animate-slide-up">
                    <h1 className="text-4xl font-extrabold mb-3">
                        <span className="gradient-text">Civic Transparency</span> Dashboard
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        Track municipal complaints in your city. No login required.
                    </p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatsCard title="Total Complaints" value={stats.total} icon="📋" />
                        <StatsCard title="Resolved" value={stats.resolved} icon="✅" color="green" />
                        <StatsCard title="Resolution Rate" value={`${stats.resolutionRate}%`} icon="📈" color="primary" />
                        <StatsCard title="Critical Issues" value={stats.critical} icon="🚨" color="red" />
                    </div>
                )}

                {/* Complaint Tracker */}
                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">🔍 Track Your Complaint</h2>
                    <form onSubmit={handleTrack} className="flex gap-3">
                        <input
                            value={trackId}
                            onChange={(e) => setTrackId(e.target.value)}
                            className="input flex-1"
                            placeholder="Paste complaint ID (e.g. sample-complaint-1)"
                        />
                        <button type="submit" disabled={tracking} className="btn-primary shrink-0">
                            {tracking ? '…' : 'Track'}
                        </button>
                    </form>

                    {trackError && <p className="text-red-400 text-sm mt-3">{trackError}</p>}

                    {trackResult && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 animate-fade-in">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                    <p className="font-medium text-slate-200">{trackResult.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Category: {trackResult.category?.name}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary-400">{trackResult.status.replace('_', ' ')}</span>
                            </div>

                            {trackResult.logs?.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-medium text-slate-400">History</p>
                                    {trackResult.logs.map((l, i) => (
                                        <div key={i} className="text-xs text-slate-500 flex gap-2">
                                            <span className="text-slate-600">{new Date(l.createdAt).toLocaleDateString()}</span>
                                            <span>{l.fromStatus} → <span className="text-slate-300">{l.toStatus}</span></span>
                                            {l.note && <span className="text-slate-600">— {l.note}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Department chart */}
                <div className="card animate-slide-up">
                    <h2 className="text-base font-semibold text-slate-200 mb-4">Complaints by Department</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={depts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                            <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Total" />
                            <Bar dataKey="resolved" fill="#10b981" radius={[6, 6, 0, 0]} name="Resolved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
}
