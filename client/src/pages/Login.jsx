import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');
            const user = await login(data);
            if (user.role === 'ADMIN') navigate('/admin/panel');
            else if (user.role === 'OFFICER') navigate('/officer/dashboard');
            else navigate('/citizen/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-civic-dark">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-up">
                    <div className="text-5xl mb-4">🏙️</div>
                    <h1 className="text-3xl font-bold gradient-text">CivicPulse</h1>
                    <p className="text-slate-400 mt-2 text-sm">Intelligent Municipal Complaint Management</p>
                </div>

                <div className="card animate-slide-up">
                    <h2 className="text-xl font-semibold text-slate-100 mb-6">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                {...register('email', { required: 'Email is required' })}
                                type="email"
                                className="input"
                                placeholder="your@email.com"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                {...register('password', { required: 'Password is required' })}
                                type="password"
                                className="input"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                            Register
                        </Link>
                    </p>

                    {/* Test credentials hint */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-500">
                        <p className="font-medium text-slate-400 mb-1">Demo credentials:</p>
                        <p>Admin:   admin@civicpulse.com / Admin@123</p>
                        <p>Officer: officer@civicpulse.com / Officer@123</p>
                        <p>Citizen: citizen@civicpulse.com / Citizen@123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
