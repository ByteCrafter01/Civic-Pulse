import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const STATUS_CFG = {
    SUBMITTED: 'text-slate-600', TRIAGED: 'text-blue-600',
    ASSIGNED: 'text-indigo-600', IN_PROGRESS: 'text-yellow-600',
    VERIFICATION: 'text-purple-600', RESOLVED: 'text-green-600',
    CLOSED: 'text-slate-500', REOPENED: 'text-red-600',
    ESCALATED: 'text-red-600', MERGED: 'text-slate-500',
};

export default function ComplaintDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/complaints/${id}`)
            .then(({ data }) => setComplaint(data.data))
            .catch(() => navigate('/citizen/dashboard'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleReopen = async () => {
        setSubmitting(true);
        try {
            await api.patch(`/complaints/${id}/status`, { status: 'REOPENED', note: 'Citizen requested reopening' });
            const { data } = await api.get(`/complaints/${id}`);
            setComplaint(data.data);
        } finally { setSubmitting(false); }
    };

    if (loading) return <LoadingSpinner fullScreen />;
    if (!complaint) return null;

    const canReopen = complaint.status === 'VERIFICATION' || complaint.status === 'RESOLVED';

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 pt-20 pb-12">
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-primary-600 text-sm mb-5 flex items-center gap-1">
                    &larr; Back
                </button>

                <div className="card mb-4 animate-slide-up">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                ID: {complaint.id.slice(0, 8)} |{' '}
                                {complaint.category?.name} &rarr; {complaint.category?.department?.name} |{' '}
                                {new Date(complaint.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <span className={`font-semibold text-sm ${STATUS_CFG[complaint.status] || 'text-slate-500'}`}>
                                {complaint.status.replace('_', ' ')}
                            </span>
                            {complaint.priorityLevel && <PriorityBadge level={complaint.priorityLevel} score={complaint.priorityScore} />}
                        </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">{complaint.description}</p>

                    {complaint.imageUrl && (
                        <img src={complaint.imageUrl} alt="Complaint" className="mt-4 rounded-md w-full max-h-64 object-cover border border-slate-200" />
                    )}

                    {complaint.slaDeadline && (
                        <div className={`mt-4 p-3 rounded-md text-xs border ${complaint.slaBreached ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {complaint.slaBreached
                                ? 'SLA breached — this complaint has been escalated'
                                : `SLA deadline: ${new Date(complaint.slaDeadline).toLocaleString()}`}
                        </div>
                    )}

                    {complaint.aiExplanation && Object.keys(complaint.aiExplanation).length > 0 && (
                        <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-800 mb-2">AI Score Breakdown</p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                {Object.entries(complaint.aiExplanation).map(([k, v]) => (
                                    <div key={k} className="flex justify-between">
                                        <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                        <span className="text-slate-700 font-mono">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {canReopen && (
                        <button onClick={handleReopen} disabled={submitting} className="btn-danger mt-4 text-sm">
                            {submitting ? 'Processing...' : 'Reopen Complaint'}
                        </button>
                    )}
                </div>

                <div className="card animate-slide-up">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Status Timeline</h2>
                    {complaint.logs?.length === 0 ? (
                        <p className="text-slate-400 text-sm">No status changes yet</p>
                    ) : (
                        <div className="space-y-3">
                            {complaint.logs?.map((log, i) => (
                                <div key={log.id || i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-primary-500 mt-1 shrink-0" />
                                        {i < complaint.logs.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1" />}
                                    </div>
                                    <div className="pb-3">
                                        <p className="text-sm text-slate-600">
                                            <span className="text-slate-400">{log.fromStatus}</span>
                                            {' → '}
                                            <span className="font-medium text-slate-900">{log.toStatus}</span>
                                        </p>
                                        {log.note && <p className="text-xs text-slate-400 mt-0.5">{log.note}</p>}
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
