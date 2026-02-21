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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary-600 text-white text-xl font-bold mb-4">CP</div>
                    <h1 className="text-2xl font-bold text-slate-900">CivicPulse</h1>
                    <p className="text-slate-500 mt-1 text-sm">Municipal Complaint Management System</p>
                </div>

                <div className="card animate-slide-up">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in to your account</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
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
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                {...register('password', { required: 'Password is required' })}
                                type="password"
                                className="input"
                                placeholder="Enter your password"
                            />
                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Register
                        </Link>
                    </p>

                    <div className="mt-4 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500">
                        <p className="font-medium text-slate-600 mb-1">Demo credentials:</p>
                        <p>Admin: admin@civicpulse.com / Admin@123</p>
                        <p>Officer: officer@civicpulse.com / Officer@123</p>
                        <p>Citizen: citizen@civicpulse.com / Citizen@123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
