import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SentimentTrends() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/sentiment-trends')
            .then(({ data: res }) => setData(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="card animate-pulse"><div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" /></div>;

    return (
        <div className="card">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Sentiment Trends (12 Weeks)</h3>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}
                            formatter={(value) => [parseFloat(value).toFixed(3), 'Avg Sentiment']}
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="avgSentiment" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Avg Sentiment" />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-slate-400 text-center py-10">No sentiment data yet.</p>
            )}
        </div>
    );
}
