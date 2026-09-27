import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Button, Field } from '../components/ui';
import { clearAuthError, login, register } from '../store';

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });
const registerSchema = z.object({ name: z.string().min(2, 'Name must contain at least 2 characters'), email: z.string().email('Enter a valid email'), password: z.string().min(8, 'Use at least 8 characters') });
export default function AuthPage({ mode }) {
  const dispatch = useDispatch(); const navigate = useNavigate(); const { user, loading, error } = useSelector((s) => s.auth); const schema = mode === 'login' ? loginSchema : registerSchema;
  const { register: field, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);
  if (user) return <Navigate to="/dashboard" replace/>;
  const submit = async (values) => { const action = await dispatch(mode === 'login' ? login(values) : register(values)); if (action.meta.requestStatus === 'fulfilled') { toast.success(mode === 'login' ? 'Welcome back' : 'Account created'); navigate('/dashboard'); } };
  return <div className="grid min-h-screen bg-slate-950 lg:grid-cols-2"><div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-slate-950 p-12 text-white lg:flex"><div className="text-xl font-black">TaskFlow</div><div><p className="max-w-lg text-4xl font-extrabold leading-tight">Projects move faster when everyone knows what matters next.</p><p className="mt-5 max-w-md text-brand-100">A secure workspace for project planning, task ownership, progress, and team notifications.</p></div><p className="text-sm text-brand-200">Project and task management, without the clutter.</p></div><div className="flex items-center justify-center p-5"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10"><span className="text-sm font-bold text-brand-600">TASKFLOW</span><h1 className="mt-3 text-3xl font-extrabold text-slate-950">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue to your workspace.' : 'Start organizing your projects in minutes.'}</p>{error && <div className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}<form className="mt-7 space-y-4" onSubmit={handleSubmit(submit)}>{mode === 'register' && <Field label="Full name" placeholder="Alex Morgan" error={errors.name?.message} {...field('name')}/>}<Field label="Email address" type="email" placeholder="alex@example.com" error={errors.email?.message} {...field('email')}/><Field label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...field('password')}/><Button className="w-full" loading={loading} type="submit">{mode === 'login' ? 'Sign in' : 'Create account'}</Button></form><p className="mt-6 text-center text-sm text-slate-500">{mode === 'login' ? 'New to TaskFlow?' : 'Already have an account?'} <Link className="font-bold text-brand-600" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></div></div></div>;
}
