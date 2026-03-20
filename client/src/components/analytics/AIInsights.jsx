import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AIInsights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/insights')
            .then(({ data: res }) => setInsights(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="card">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">AI-Generated Insights</h3>
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    ))}
                </div>
            ) : insights.length > 0 ? (
                <ul className="space-y-3">
                    {insights.map((insight, i) => (
                        <li key={i} className="flex gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <span className="text-primary-500 text-lg shrink-0">&#x2022;</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{insight}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-400 text-center py-6">No insights available yet. Submit more complaints to generate trends.</p>
            )}
        </div>
    );
}
