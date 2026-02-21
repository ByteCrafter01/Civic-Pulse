import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import StatsCard from '../../components/shared/StatsCard';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const STATUS_CONFIG = {
    SUBMITTED: { label: 'Submitted', color: 'text-slate-600 bg-slate-100' },
    TRIAGED: { label: 'Triaged', color: 'text-blue-700 bg-blue-50' },
    ASSIGNED: { label: 'Assigned', color: 'text-indigo-700 bg-indigo-50' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-700 bg-yellow-50' },
    VERIFICATION: { label: 'Verification', color: 'text-purple-700 bg-purple-50' },
    RESOLVED: { label: 'Resolved', color: 'text-green-700 bg-green-50' },
    CLOSED: { label: 'Closed', color: 'text-slate-500 bg-slate-100' },
    REOPENED: { label: 'Reopened', color: 'text-red-700 bg-red-50' },
    ESCALATED: { label: 'Escalated', color: 'text-red-700 bg-red-50' },
    MERGED: { label: 'Merged', color: 'text-slate-500 bg-slate-100' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-slate-500 bg-slate-100' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
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
            <main className="max-w-7xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome back, {user?.name}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage your municipal complaints</p>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatsCard title="Total Complaints" value={stats.total} />
                        <StatsCard title="Pending" value={stats.pending} color="yellow" />
                        <StatsCard title="In Progress" value={stats.inProgress} color="orange" />
                        <StatsCard title="Resolved" value={stats.resolved} color="green" />
                    </div>
                )}

                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">My Complaints</h2>
                        <Link to="/citizen/submit" className="btn-primary text-sm">
                            + New Complaint
                        </Link>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-4">
                        {['', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {s || 'All'}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-lg font-medium text-slate-500 mb-1">No complaints found</p>
                            <Link to="/citizen/submit" className="text-primary-600 text-sm hover:underline">
                                Submit your first complaint
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/citizen/complaints/${c.id}`}
                                    className="block p-4 rounded-md border border-slate-200 hover:border-primary-300 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{c.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{c.category?.name} · {c.category?.department?.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                <span className="font-mono">{c.id.slice(0, 12)}...</span> · {new Date(c.createdAt).toLocaleDateString()}
                                            </p>
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
