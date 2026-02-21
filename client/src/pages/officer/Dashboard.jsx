import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import StatsCard from '../../components/shared/StatsCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';

const OFFICER_ACTIONS = {
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['VERIFICATION'],
    VERIFICATION: ['RESOLVED'],
};

const ACTION_LABELS = {
    IN_PROGRESS: 'Start Work',
    VERIFICATION: 'Submit for Verification',
    RESOLVED: 'Mark Resolved',
};

export default function OfficerDashboard() {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    const fetchData = async () => {
        const [cRes, sRes] = await Promise.all([
            api.get('/complaints?limit=50'),
            api.get('/dashboard/stats'),
        ]);
        setComplaints(cRes.data.data.data || []);
        setStats(sRes.data.data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (id, currentStatus) => {
        const next = OFFICER_ACTIONS[currentStatus]?.[0];
        if (!next) return;
        setActionId(id);
        try {
            await api.patch(`/complaints/${id}/status`, { status: next, note: `Officer action: ${next}` });
            fetchData();
        } finally { setActionId(null); }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const queue = [...complaints].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-900">Officer Queue</h1>
                    <p className="text-slate-500 text-sm mt-1">Assigned complaints sorted by priority score</p>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatsCard title="Total Assigned" value={stats.total} />
                        <StatsCard title="Pending" value={stats.pending} color="yellow" />
                        <StatsCard title="In Progress" value={stats.inProgress} color="orange" />
                        <StatsCard title="Resolved" value={stats.resolved} color="green" />
                    </div>
                )}

                <div className="card">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Priority Queue ({queue.length})</h2>

                    {queue.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="font-medium text-slate-500">No assigned complaints</p>
                            <p className="text-sm mt-1">Your queue is clear.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {queue.map((c) => {
                                const actions = OFFICER_ACTIONS[c.status] || [];
                                return (
                                    <div key={c.id} className="p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link to={`/officer/complaints/${c.id}`} className="font-medium text-slate-800 hover:text-primary-600 transition-colors truncate">
                                                        {c.title}
                                                    </Link>
                                                    {c.priorityLevel && <PriorityBadge level={c.priorityLevel} score={c.priorityScore} />}
                                                    {c.slaBreached && (
                                                        <span className="badge-critical text-xs">SLA Breach</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {c.category?.name} | {c.citizen?.name} | {new Date(c.createdAt).toLocaleDateString()}
                                                </p>
                                                {c.urgencyKeywords?.length > 0 && (
                                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                                        {c.urgencyKeywords.map((kw) => (
                                                            <span key={kw} className="px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200">{kw}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-slate-400 font-medium">{c.status.replace('_', ' ')}</span>
                                                {actions.length > 0 && (
                                                    <button
                                                        onClick={() => handleAction(c.id, c.status)}
                                                        disabled={actionId === c.id}
                                                        className="btn-primary text-xs py-1.5 px-3"
                                                    >
                                                        {actionId === c.id ? '...' : ACTION_LABELS[actions[0]] || actions[0]}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
