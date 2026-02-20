import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import StatsCard from '../../components/shared/StatsCard';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const STATUS_CONFIG = {
    SUBMITTED: { label: 'Submitted', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
    TRIAGED: { label: 'Triaged', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    ASSIGNED: { label: 'Assigned', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    VERIFICATION: { label: 'Verification', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    RESOLVED: { label: 'Resolved', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
    CLOSED: { label: 'Closed', color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' },
    REOPENED: { label: 'Reopened', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    ESCALATED: { label: 'Escalated', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    MERGED: { label: 'Merged', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-slate-400' };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

export default function CitizenDashboard() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, sRes] = await Promise.all([
                    api.get('/complaints'),
                    api.get('/dashboard/stats'),
                ]);
                setComplaints(cRes.data.data.data || []);
                setStats(sRes.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = filter
        ? complaints.filter((c) => c.status === filter)
        : complaints;

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
                {/* Welcome */}
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-100">
                        Welcome back, <span className="gradient-text">{user?.name}</span> 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Track and manage your municipal complaints</p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatsCard title="Total Complaints" value={stats.total} icon="📋" />
                        <StatsCard title="Pending" value={stats.pending} icon="⏳" color="yellow" />
                        <StatsCard title="In Progress" value={stats.inProgress} icon="🔧" color="orange" />
                        <StatsCard title="Resolved" value={stats.resolved} icon="✅" color="green" />
                    </div>
                )}

                {/* Complaints list */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">My Complaints</h2>
                        <Link to="/citizen/submit" className="btn-primary text-sm">
                            + New Complaint
                        </Link>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 flex-wrap mb-4">
                        {['', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {s || 'All'}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-4xl mb-3">📭</div>
                            <p>No complaints found</p>
                            <Link to="/citizen/submit" className="text-primary-400 text-sm hover:underline mt-2 inline-block">
                                Submit your first complaint
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/citizen/complaints/${c.id}`}
                                    className="block p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-primary-500/40 hover:bg-slate-800 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-200 truncate">{c.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{c.category?.name} · {c.category?.department?.name}</p>
                                            <p className="text-xs text-slate-600 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <StatusBadge status={c.status} />
                                            {c.priorityLevel && <PriorityBadge level={c.priorityLevel} score={c.priorityScore} />}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
