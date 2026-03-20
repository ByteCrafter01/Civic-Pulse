import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import StatsCard from '../../components/shared/StatsCard';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import SentimentTrends from '../../components/analytics/SentimentTrends';
import SentimentHeatmap from '../../components/analytics/SentimentHeatmap';
import AIInsights from '../../components/analytics/AIInsights';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669'];

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

    const tabs = ['overview', 'assignments', 'sla', 'categories', 'sentiment'];

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
                    <p className="text-slate-500 text-sm mt-1">System overview, assignments, and SLA management</p>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={async () => {
                                    const { data } = await api.get('/reports/monthly', { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = 'civicpulse-monthly-report.pdf';
                                    link.click();
                                    window.URL.revokeObjectURL(url);
                                }}
                                className="btn-secondary text-sm"
                            >
                                Download Monthly Report
                            </button>
                            <button
                                onClick={async () => {
                                    const { data } = await api.get('/reports/ai-evaluation', { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = 'ai-evaluation-report.pdf';
                                    link.click();
                                    window.URL.revokeObjectURL(url);
                                }}
                                className="btn-secondary text-sm"
                            >
                                Download AI Report
                            </button>
                        </div>
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <StatsCard title="Total" value={stats.total} />
                                <StatsCard title="Pending" value={stats.pending} color="yellow" />
                                <StatsCard title="In Progress" value={stats.inProgress} color="orange" />
                                <StatsCard title="Resolved" value={stats.resolved} color="green" />
                                <StatsCard title="SLA Breach" value={stats.breached} color="red" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-base font-semibold text-slate-800 mb-4">Weekly Volume</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                        <Line type="monotone" dataKey="submitted" stroke="#2563eb" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="card">
                                <h3 className="text-base font-semibold text-slate-800 mb-4">By Department</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={depts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={130} />
                                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                        <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-base font-semibold text-slate-800 mb-4">Category Distribution</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={cats.slice(0, 8)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8' }}>
                                        {cats.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === 'assignments' && (
                    <div className="card animate-fade-in">
                        <h2 className="text-base font-semibold text-slate-800 mb-4">Assign Officers ({complaints.filter(c => !c.officerId).length} unassigned)</h2>
                        <div className="space-y-2">
                            {complaints
                                .filter((c) => ['SUBMITTED', 'TRIAGED'].includes(c.status))
                                .map((c) => (
                                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-md border border-slate-200">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 text-sm truncate">{c.title}</p>
                                            <p className="text-xs text-slate-500">{c.category?.name} | {c.citizen?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {c.priorityLevel && <PriorityBadge level={c.priorityLevel} />}
                                            <select
                                                onChange={(e) => e.target.value && handleAssign(c.id, e.target.value)}
                                                defaultValue=""
                                                className="input py-1.5 text-xs w-44"
                                                disabled={assigning === c.id}
                                            >
                                                <option value="">Assign officer...</option>
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
                                <p className="text-slate-400 text-sm text-center py-8">All complaints are assigned.</p>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'sla' && sla && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatsCard title="With SLA" value={sla.total} />
                            <StatsCard title="Breached" value={sla.breached} color="red" />
                            <StatsCard title="At Risk" value={sla.atRisk} color="yellow" />
                            <StatsCard title="Breach Rate" value={`${sla.breachRate}%`} color={parseFloat(sla.breachRate) > 20 ? 'red' : 'green'} />
                        </div>
                        <div className="card">
                            <h3 className="text-base font-semibold text-slate-800 mb-3">Breached / At-Risk Complaints</h3>
                            <div className="space-y-2">
                                {complaints.filter(c => c.slaBreached || c.status === 'ESCALATED').map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-3 rounded-md bg-red-50 border border-red-200">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{c.title}</p>
                                            <p className="text-xs text-slate-500">{c.category?.department?.name} | {c.status}</p>
                                        </div>
                                        {c.priorityLevel && <PriorityBadge level={c.priorityLevel} />}
                                    </div>
                                ))}
                                {complaints.filter(c => c.slaBreached || c.status === 'ESCALATED').length === 0 && (
                                    <p className="text-slate-400 text-sm text-center py-6">No SLA breaches.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'categories' && (
                    <div className="card animate-fade-in">
                        <h2 className="text-base font-semibold text-slate-800 mb-4">Categories & Complaint Volume</h2>
                        <div className="space-y-2">
                            {cats.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-md border border-slate-200">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                                        <p className="text-xs text-slate-500">{c.department}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full"
                                                style={{ width: `${Math.min((c.count / Math.max(...cats.map(x => x.count), 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-slate-600 w-8 text-right">{c.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {tab === 'sentiment' && (
                    <div className="space-y-6 animate-fade-in">
                        <AIInsights />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SentimentTrends />
                            <SentimentHeatmap />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
