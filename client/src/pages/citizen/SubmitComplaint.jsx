import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [locationPicked, setLocationPicked] = useState({ lat: 19.0760, lng: 72.8777 });

    const [submittedId, setSubmittedId] = useState('');
    const [suggesting, setSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', categoryId: '', image: null,
        latitude: 19.0760, longitude: 72.8777,
    });

    useEffect(() => {
        api.get('/admin/categories').then(({ data }) => setCategories(data.data || []));
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
    };

    const handleAISuggest = async () => {
        if (!form.title.trim() || !form.description.trim()) return;
        setSuggesting(true);
        setSuggestion(null);
        try {
            const { data } = await api.post('/ai/suggest-category', {
                title: form.title,
                description: form.description,
            });
            setSuggestion(data.data);
            if (data.data.category_id) {
                setForm((f) => ({ ...f, categoryId: data.data.category_id }));
            }
        } catch {
            setSuggestion({ error: true });
        } finally {
            setSuggesting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            const payload = {
                title: form.title,
                description: form.description,
                categoryId: form.categoryId,
                latitude: locationPicked.lat,
                longitude: locationPicked.lng,
            };
            formData.append('data', JSON.stringify(payload));
            if (form.image) formData.append('image', form.image);

            const { data } = await api.post('/complaints', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSubmittedId(data.data.id);
            setSuccess(`Complaint submitted successfully!`);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-900">Submit a Complaint</h1>
                    <p className="text-slate-500 text-sm mt-1">Report a municipal issue in your area</p>
                </div>

                <div className="card animate-slide-up">
                    {success && (
                        <div className="mb-5 p-4 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
                            <p className="font-medium mb-2">{success}</p>
                            {submittedId && (
                                <div className="flex items-center gap-2 bg-white border border-green-200 rounded px-3 py-2">
                                    <span className="text-xs text-slate-500">Complaint ID:</span>
                                    <code className="font-mono text-sm text-slate-800 flex-1">{submittedId}</code>
                                    <button
                                        type="button"
                                        onClick={() => { navigator.clipboard.writeText(submittedId); }}
                                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-green-600 mt-2">Save this ID to track your complaint on the public portal.</p>
                            <button
                                type="button"
                                onClick={() => navigate('/citizen/dashboard')}
                                className="btn-primary text-xs mt-3"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}
                    {error && (
                        <div className="mb-5 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Title *</label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                                className="input"
                                placeholder="Brief description of the issue"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="label mb-0">Category *</label>
                                {form.title.trim() && form.description.trim().length > 10 && (
                                    <button
                                        type="button"
                                        onClick={handleAISuggest}
                                        disabled={suggesting}
                                        className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors disabled:opacity-50"
                                    >
                                        {suggesting ? 'AI analyzing...' : 'AI Suggest'}
                                    </button>
                                )}
                            </div>
                            <select
                                name="categoryId"
                                value={form.categoryId}
                                onChange={handleChange}
                                required
                                className="input"
                            >
                                <option value="">Select a category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} — {c.department?.name}
                                    </option>
                                ))}
                            </select>
                            {suggestion && !suggestion.error && (
                                <div className="mt-2 p-2.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 animate-fade-in">
                                    <span className="font-semibold">AI Suggestion:</span> {suggestion.reason || 'Category selected based on your description.'}
                                    <span className="text-blue-500 ml-1">({Math.round((suggestion.confidence || 0) * 100)}% confidence)</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">Description *</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="input resize-none"
                                placeholder="Please describe the issue in detail. Include location landmarks, severity, and any safety concerns."
                            />
                            <p className="text-xs text-slate-400 mt-1">{form.description.length} / 2000 chars</p>
                        </div>

                        <div>
                            <label className="label">Location *</label>
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-600">
                                <p>Lat: {locationPicked.lat.toFixed(4)} | Lng: {locationPicked.lng.toFixed(4)}</p>
                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={locationPicked.lat}
                                        onChange={(e) => setLocationPicked((l) => ({ ...l, lat: parseFloat(e.target.value) }))}
                                        className="input text-xs py-2"
                                        placeholder="Latitude"
                                    />
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={locationPicked.lng}
                                        onChange={(e) => setLocationPicked((l) => ({ ...l, lng: parseFloat(e.target.value) }))}
                                        className="input text-xs py-2"
                                        placeholder="Longitude"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label">Photo (optional, max 5MB)</label>
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-slate-300 file:text-sm file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 transition-colors"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/citizen/dashboard')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                <div className="card mt-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-700 mb-2">What happens next?</p>
                    <ol className="space-y-1 list-decimal list-inside text-slate-500">
                        <li>Your complaint is received and assigned a unique tracking ID</li>
                        <li>AI analyzes priority, sentiment, and urgency in real-time</li>
                        <li>An officer is assigned based on category and workload</li>
                        <li>You receive real-time status updates via your dashboard</li>
                        <li>Verify resolution before the complaint is closed</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}
