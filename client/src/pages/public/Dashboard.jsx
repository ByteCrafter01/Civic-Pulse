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
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary-600 text-white flex items-center justify-center text-sm font-bold">CP</div>
                        <span className="font-semibold text-slate-900">CivicPulse</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-1">Public Portal</span>
                    </div>
                    <Link to="/login" className="btn-primary text-sm py-2">Sign In</Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 pt-20 pb-12">
                <div className="text-center mb-10 animate-slide-up">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Civic Transparency Dashboard</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Track municipal complaints in your city. No login required.
                    </p>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatsCard title="Total Complaints" value={stats.total} />
                        <StatsCard title="Resolved" value={stats.resolved} color="green" />
                        <StatsCard title="Resolution Rate" value={`${stats.resolutionRate}%`} />
                        <StatsCard title="Critical Issues" value={stats.critical} color="red" />
                    </div>
                )}

                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Track Your Complaint</h2>
                    <form onSubmit={handleTrack} className="flex gap-3">
                        <input
                            value={trackId}
                            onChange={(e) => setTrackId(e.target.value)}
                            className="input flex-1"
                            placeholder="Enter complaint ID (e.g. sample-complaint-1)"
                        />
                        <button type="submit" disabled={tracking} className="btn-primary shrink-0">
                            {tracking ? '...' : 'Track'}
                        </button>
                    </form>

                    {trackError && <p className="text-red-600 text-sm mt-3">{trackError}</p>}

                    {trackResult && (
                        <div className="mt-4 p-4 rounded-md bg-slate-50 border border-slate-200 animate-fade-in">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                    <p className="font-medium text-slate-800">{trackResult.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Category: {trackResult.category?.name}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary-600">{trackResult.status.replace('_', ' ')}</span>
                            </div>

                            {trackResult.logs?.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-medium text-slate-500">History</p>
                                    {trackResult.logs.map((l, i) => (
                                        <div key={i} className="text-xs text-slate-500 flex gap-2">
                                            <span className="text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                                            <span>{l.fromStatus} &rarr; <span className="text-slate-700">{l.toStatus}</span></span>
                                            {l.note && <span className="text-slate-400">— {l.note}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="card animate-slide-up">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Complaints by Department</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={depts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total" />
                            <Bar dataKey="resolved" fill="#059669" radius={[4, 4, 0, 0]} name="Resolved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
}
