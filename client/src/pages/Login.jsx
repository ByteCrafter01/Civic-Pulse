import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            {/* Background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                <div className="text-center mb-8">
                    <Link to="/landing" className="inline-flex items-center gap-2.5 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-xl shadow-blue-600/25">CP</div>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Sign in to CivicPulse</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="label">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('email', { required: 'Email is required' })}
                                    type="email"
                                    className="input pl-10"
                                    placeholder="your@email.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    type="password"
                                    className="input pl-10"
                                    placeholder="Enter your password"
                                />
                            </div>
                            {errors.password && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Signing in...
                                </span>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold">
                            Register
                        </Link>
                    </p>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm text-xs text-slate-500 dark:text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Demo credentials</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { role: 'Admin', email: 'admin@civicpulse.com', pass: 'Admin@123' },
                            { role: 'Officer', email: 'officer@civicpulse.com', pass: 'Officer@123' },
                            { role: 'Citizen', email: 'citizen@civicpulse.com', pass: 'Citizen@123' },
                        ].map((cred) => (
                            <div key={cred.role} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{cred.role}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cred.email}</p>
                                <p className="text-[10px] text-slate-400">{cred.pass}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
