import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import StatsCard from '../../components/shared/StatsCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const PRIORITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_COLORS = { CRITICAL: '#dc2626', HIGH: '#f59e0b', MEDIUM: '#2563eb', LOW: '#059669' };
const MATRIX_COLORS = ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'];

function ConfusionMatrix({ matrix }) {
    if (!matrix || Object.keys(matrix).length === 0) {
        return <p className="text-sm text-slate-400 text-center py-6">No feedback data yet.</p>;
    }

    const maxVal = Math.max(1, ...PRIORITY_LEVELS.flatMap((p) => PRIORITY_LEVELS.map((a) => matrix[p]?.[a] || 0)));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th className="p-2 text-left text-slate-500 text-xs">Predicted \ Actual</th>
                        {PRIORITY_LEVELS.map((l) => (
                            <th key={l} className="p-2 text-center text-xs font-semibold" style={{ color: PRIORITY_COLORS[l] }}>{l}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {PRIORITY_LEVELS.map((predicted) => (
                        <tr key={predicted}>
                            <td className="p-2 text-xs font-semibold" style={{ color: PRIORITY_COLORS[predicted] }}>{predicted}</td>
                            {PRIORITY_LEVELS.map((actual) => {
                                const val = matrix[predicted]?.[actual] || 0;
                                const intensity = Math.floor((val / maxVal) * (MATRIX_COLORS.length - 1));
                                const isDiag = predicted === actual;
                                return (
                                    <td
                                        key={actual}
                                        className="p-2 text-center text-sm font-medium"
                                        style={{
                                            backgroundColor: MATRIX_COLORS[intensity],
                                            color: intensity >= 3 ? '#fff' : '#1e293b',
                                            border: isDiag ? '2px solid #1e40af' : '1px solid #e2e8f0',
                                        }}
                                    >
                                        {val}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function AIEvaluation() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        api.get('/ai-evaluation/metrics')
            .then(({ data }) => setMetrics(data.data))
            .finally(() => setLoading(false));
    }, []);

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const { data } = await api.get('/ai-evaluation/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ai-evaluation-metrics.csv';
            link.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const { accuracy, routing, distribution, sentiment, features, timeline, duplicates } = metrics || {};

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 animate-slide-up flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">AI Model Evaluation</h1>
                        <p className="text-slate-500 text-sm mt-1">Performance metrics, accuracy analysis, and explainability</p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting}
                        className="btn-primary text-sm"
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>

                {/* Stats Cards */}
                {accuracy && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fade-in">
                        <StatsCard title="MAE" value={accuracy.mae} />
                        <StatsCard title="Priority Accuracy" value={`${accuracy.priorityAccuracy}%`} color="green" />
                        <StatsCard title="Override Rate" value={`${accuracy.overrideRate}%`} color="yellow" />
                        <StatsCard title="Routing Accuracy" value={`${routing?.accuracy || 0}%`} color="green" />
                        <StatsCard title="Duplicate Rate" value={`${duplicates?.duplicateRate || 0}%`} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Confusion Matrix */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Confusion Matrix</h3>
                        <p className="text-xs text-slate-400 mb-3">Predicted vs officer-corrected priority levels</p>
                        <ConfusionMatrix matrix={accuracy?.confusionMatrix} />
                    </div>

                    {/* Score Distribution */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Priority Score Distribution</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={distribution || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* MAE Over Time */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">MAE Trend Over Time</h3>
                        {timeline && timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={timeline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                    <Line type="monotone" dataKey="mae" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-10">No feedback data over time yet.</p>
                        )}
                    </div>

                    {/* Feature Importance */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Feature Importance (SHAP)</h3>
                        {features && features.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={features} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis type="category" dataKey="feature" tick={{ fill: '#64748b', fontSize: 10 }} width={120} />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                    <Bar dataKey="importance" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-10">No AI explanations available yet.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentiment Distribution */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Sentiment Distribution</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={sentiment || []}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#94a3b8' }}
                                >
                                    {(sentiment || []).map((_, i) => (
                                        <Cell key={i} fill={['#dc2626', '#059669', '#64748b', '#f59e0b'][i % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Routing & Duplicate Stats */}
                    <div className="card animate-fade-in">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Model Performance Summary</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
                                <p className="text-sm font-medium text-slate-700 mb-1">Department Routing</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all"
                                            style={{ width: `${routing?.accuracy || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">{routing?.accuracy || 0}%</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{routing?.correct || 0} / {routing?.total || 0} correctly routed</p>
                            </div>
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
                                <p className="text-sm font-medium text-slate-700 mb-1">Duplicate Detection</p>
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-lg font-bold text-slate-800">{duplicates?.totalDuplicates || 0}</p>
                                        <p className="text-xs text-slate-400">Detected</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-800">{duplicates?.mergedCount || 0}</p>
                                        <p className="text-xs text-slate-400">Merged</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-800">{duplicates?.duplicateRate || 0}%</p>
                                        <p className="text-xs text-slate-400">Rate</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
                                <p className="text-sm font-medium text-slate-700 mb-1">Officer Overrides</p>
                                <p className="text-xs text-slate-400">
                                    {accuracy?.totalFeedbacks || 0} corrections out of {accuracy?.totalScored || 0} scored complaints
                                    ({accuracy?.overrideRate || 0}% override rate)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
