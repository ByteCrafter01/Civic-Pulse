import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { role: 'CITIZEN' } });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');
            const user = await registerUser(data);
            navigate('/citizen/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
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
                    <p className="text-slate-500 mt-1 text-sm">Create your account</p>
                </div>

                <div className="card animate-slide-up">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Register</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input {...register('name', { required: 'Name is required' })} className="input" placeholder="John Doe" />
                            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input {...register('email', { required: 'Email is required' })} type="email" className="input" placeholder="your@email.com" />
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Minimum 8 characters' },
                                })}
                                type="password"
                                className="input"
                                placeholder="Min 8 chars, 1 uppercase, 1 number"
                            />
                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="label">Phone (optional)</label>
                            <input {...register('phone')} className="input" placeholder="+91 98765 43210" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
