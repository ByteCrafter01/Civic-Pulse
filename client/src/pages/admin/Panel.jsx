import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import StatsCard from '../../components/shared/StatsCard';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [depts, setDepts] = useState([]);
    const [cats, setCats] = useState([]);
    const [trends, setTrends] = useState([]);
    const [sla, setSla] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/dashboard/stats'),
            api.get('/dashboard/by-department'),
            api.get('/dashboard/by-category'),
            api.get('/dashboard/trends'),
            api.get('/dashboard/sla'),
            api.get('/admin/officers'),
            api.get('/complaints?limit=30'),
        ]).then(([s, d, c, t, slaRes, o, cm]) => {
            setStats(s.data.data);
            setDepts(d.data.data);
            setCats(c.data.data);
            setTrends(t.data.data);
            setSla(slaRes.data.data);
            setOfficers(o.data.data);
            setComplaints(cm.data.data.data || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleAssign = async (complaintId, officerId) => {
        setAssigning(complaintId);
        try {
            await api.patch(`/complaints/${complaintId}/assign`, { officerId });
            const { data } = await api.get('/complaints?limit=30');
            setComplaints(data.data.data || []);
        } finally { setAssigning(null); }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const tabs = ['overview', 'assignments', 'sla', 'categories'];

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-100">Admin <span className="gradient-text">Control Panel</span></h1>
                    <p className="text-slate-400 text-sm mt-1">System overview, assignments, and SLA management</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'bg-civic-card text-slate-400 border border-civic-border hover:text-slate-200'
                                }`}
                        >
                            {t === 'overview' && '📊 '}
                            {t === 'assignments' && '👷 '}
                            {t === 'sla' && '⏱️ '}
                            {t === 'categories' && '📂 '}
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW ── */}
                {tab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <StatsCard title="Total" value={stats.total} icon="📋" />
                                <StatsCard title="Pending" value={stats.pending} icon="⏳" color="yellow" />
                                <StatsCard title="In Progress" value={stats.inProgress} icon="🔧" color="orange" />
                                <StatsCard title="Resolved" value={stats.resolved} icon="✅" color="green" />
                                <StatsCard title="SLA Breach" value={stats.breached} icon="🚨" color="red" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-base font-semibold text-slate-200 mb-4">Weekly Volume</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                                        <Line type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="card">
                                <h3 className="text-base font-semibold text-slate-200 mb-4">By Department</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={depts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={130} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                                        <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-base font-semibold text-slate-200 mb-4">Category Distribution</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={cats.slice(0, 8)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569' }}>
                                        {cats.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ── ASSIGNMENTS ── */}
                {tab === 'assignments' && (
                    <div className="card animate-fade-in">
                        <h2 className="text-base font-semibold text-slate-200 mb-4">Assign Officers ({complaints.filter(c => !c.officerId).length} unassigned)</h2>
                        <div className="space-y-3">
                            {complaints
                                .filter((c) => ['SUBMITTED', 'TRIAGED'].includes(c.status))
                                .map((c) => (
                                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-200 text-sm truncate">{c.title}</p>
                                            <p className="text-xs text-slate-500">{c.category?.name} · {c.citizen?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {c.priorityLevel && <PriorityBadge level={c.priorityLevel} />}
                                            <select
                                                onChange={(e) => e.target.value && handleAssign(c.id, e.target.value)}
                                                defaultValue=""
                                                className="input py-1.5 text-xs w-44"
                                                disabled={assigning === c.id}
                                            >
                                                <option value="">Assign officer…</option>
                                                {officers.map((o) => (
                                                    <option key={o.id} value={o.id}>
                                                        {o.name} ({o._count?.assigned || 0} active)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            {complaints.filter(c => ['SUBMITTED', 'TRIAGED'].includes(c.status)).length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-8">All complaints are assigned ✅</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SLA ── */}
                {tab === 'sla' && sla && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatsCard title="With SLA" value={sla.total} icon="📋" />
                            <StatsCard title="Breached" value={sla.breached} icon="🚨" color="red" />
                            <StatsCard title="At Risk" value={sla.atRisk} icon="⚠️" color="yellow" />
                            <StatsCard title="Breach Rate" value={`${sla.breachRate}%`} icon="📉" color={parseFloat(sla.breachRate) > 20 ? 'red' : 'green'} />
                        </div>
                        <div className="card">
                            <h3 className="text-base font-semibold text-slate-200 mb-3">Breached / At-Risk Complaints</h3>
                            <div className="space-y-2">
                                {complaints.filter(c => c.slaBreached || c.status === 'ESCALATED').map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{c.title}</p>
                                            <p className="text-xs text-slate-500">{c.category?.department?.name} · {c.status}</p>
                                        </div>
                                        {c.priorityLevel && <PriorityBadge level={c.priorityLevel} />}
                                    </div>
                                ))}
                                {complaints.filter(c => c.slaBreached || c.status === 'ESCALATED').length === 0 && (
                                    <p className="text-slate-500 text-sm text-center py-6">No SLA breaches 🎉</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CATEGORIES ── */}
                {tab === 'categories' && (
                    <div className="card animate-fade-in">
                        <h2 className="text-base font-semibold text-slate-200 mb-4">Categories & Complaint Volume</h2>
                        <div className="space-y-2">
                            {cats.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{c.name}</p>
                                        <p className="text-xs text-slate-500">{c.department}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full"
                                                style={{ width: `${Math.min((c.count / Math.max(...cats.map(x => x.count), 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-slate-400 w-8 text-right">{c.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
