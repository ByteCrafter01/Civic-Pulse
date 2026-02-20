import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [locationPicked, setLocationPicked] = useState({ lat: 19.0760, lng: 72.8777 });

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
            setSuccess(`Complaint submitted! ID: ${data.data.id}`);
            setTimeout(() => navigate('/citizen/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-civic-dark min-h-screen">
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-2xl font-bold text-slate-100">Submit a Complaint</h1>
                    <p className="text-slate-400 text-sm mt-1">Report a municipal issue in your area</p>
                </div>

                <div className="card animate-slide-up">
                    {success && (
                        <div className="mb-5 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                            ✅ {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                            ❌ {error}
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
                            <label className="label">Category *</label>
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
                            <p className="text-xs text-slate-600 mt-1">{form.description.length} / 2000 chars</p>
                        </div>

                        <div>
                            <label className="label">Location *</label>
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
                                <p>📍 Latitude: {locationPicked.lat.toFixed(4)} · Longitude: {locationPicked.lng.toFixed(4)}</p>
                                <p className="text-xs mt-1 text-slate-600">Map picker will be enabled when Google Maps API key is configured</p>
                                {/* Clicking inputs to set custom coords */}
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
                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-600/20 file:text-primary-400 hover:file:bg-primary-600/30 transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? 'Submitting…' : '🚀 Submit Complaint'}
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

                {/* Info box */}
                <div className="card mt-4 text-sm text-slate-400">
                    <p className="font-medium text-slate-300 mb-2">ℹ️ What happens next?</p>
                    <ol className="space-y-1 list-decimal list-inside">
                        <li>Your complaint is received and assigned a unique ID</li>
                        <li>AI automatically scores priority and detects duplicates</li>
                        <li>An officer is assigned based on category and workload</li>
                        <li>You receive real-time status updates</li>
                        <li>Verify resolution before the complaint is closed</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}
