import { useState } from 'react';
import api from '../../api/axios';

function StarRating({ value, onChange, label }) {
    const [hover, setHover] = useState(0);

    return (
        <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">{label}</label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="text-2xl transition-colors focus:outline-none"
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                        <span style={{ color: star <= (hover || value) ? '#f59e0b' : '#cbd5e1' }}>
                            {star <= (hover || value) ? '\u2605' : '\u2606'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function SurveyModal({ complaintId, onClose, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [responseTime, setResponseTime] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [resolution, setResolution] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please provide an overall rating');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post(`/surveys/${complaintId}`, {
                rating,
                responseTime: responseTime || undefined,
                communication: communication || undefined,
                resolution: resolution || undefined,
                comment: comment.trim() || undefined,
            });
            onSubmitted?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit survey');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rate Your Experience</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    Help us improve by sharing your experience with this complaint resolution.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <StarRating value={rating} onChange={setRating} label="Overall Satisfaction *" />
                    <StarRating value={responseTime} onChange={setResponseTime} label="Response Time" />
                    <StarRating value={communication} onChange={setCommunication} label="Communication" />
                    <StarRating value={resolution} onChange={setResolution} label="Resolution Quality" />

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                            Comments (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="input resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Any additional feedback..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Skip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
