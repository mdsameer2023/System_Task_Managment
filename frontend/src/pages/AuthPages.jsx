import { useEffect, useState } from 'react';
import { BarChart3, Bell, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound, Users, Zap } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Button, Field } from '../components/ui';
import { clearAuthError, login, register } from '../store';
import loginIllustration from '../assets/auth-login.png';
import registerIllustration from '../assets/auth-register.png';

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });
const registerSchema = z.object({ name: z.string().min(2, 'Name must contain at least 2 characters'), email: z.string().email('Enter a valid email'), password: z.string().min(8, 'Use at least 8 characters'), confirmPassword: z.string().min(1, 'Confirm your password') }).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
export default function AuthPage({ mode }) {
  const dispatch = useDispatch(); const navigate = useNavigate(); const { user, loading, error } = useSelector((s) => s.auth); const schema = mode === 'login' ? loginSchema : registerSchema;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: field, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);
  if (user) return <Navigate to="/dashboard" replace/>;
  const submit = async (values) => { const { confirmPassword, ...credentials } = values; const action = await dispatch(mode === 'login' ? login(credentials) : register(credentials)); if (action.meta.requestStatus === 'fulfilled') { toast.success(mode === 'login' ? 'Welcome back' : 'Account created'); navigate('/dashboard'); } };
  return (
    <div className={`auth-shell ${mode === 'register' ? 'auth-register' : 'auth-login'}`}>
      <div className="auth-visual">
        <div className="auth-topbar"><div className="auth-logo"><span className="auth-logo-mark"><Check size={22} strokeWidth={3}/></span><span>TaskFlow</span></div>{mode === 'login' && <p className="auth-top-link">New to TaskFlow? <Link to="/register">Create an account</Link></p>}</div>
        <div className="auth-visual-copy">
          {mode === 'login' ? <><h2>Projects move faster when everyone knows <span>what matters next.</span></h2><p>A secure workspace for project planning, task ownership, progress, and team notifications.</p></> : <><h2>Turn your ideas into <span>organized progress.</span></h2><p>Create an account and start managing your projects, tasks, and team — all in one place.</p></>}
          <div className="auth-benefits">{(mode === 'login' ? [[Users, 'Manage your projects easily'], [Check, 'Track tasks and progress'], [Bell, 'Collaborate with your team']] : [[Zap, 'Get started in minutes'], [Users, 'Invite your team'], [BarChart3, 'Stay productive']]).map(([Icon, label], index) => <div key={label} className="auth-benefit"><span className={`auth-benefit-icon auth-benefit-${index}`}><Icon size={17} strokeWidth={2.5}/></span><span>{label}</span></div>)}</div>
        </div>
        <img className="auth-illustration" src={mode === 'login' ? loginIllustration : registerIllustration} alt="" aria-hidden="true"/>
      </div>
      <div className="auth-form-side">
        {mode === 'register' && <p className="auth-top-link auth-top-link-register">Already have an account? <Link to="/login">Sign in</Link></p>}
        <div className="auth-card">
          <h1>{mode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h1>
          <p className="auth-card-subtitle">{mode === 'login' ? 'Sign in to continue to your workspace.' : 'Start organizing your projects in minutes.'}</p>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit(submit)}>
            {mode === 'register' && <div className="auth-field"><UserRound size={19} aria-hidden="true"/><Field label="Full name" placeholder="Full name" autoComplete="name" error={errors.name?.message} {...field('name')}/></div>}
            <div className="auth-field"><Mail size={19} aria-hidden="true"/><Field label="Email address" type="email" placeholder={mode === 'login' ? 'Enter your email address' : 'Email address'} autoComplete="email" error={errors.email?.message} {...field('email')}/></div>
            <div className="auth-field auth-password-field"><LockKeyhole size={19} aria-hidden="true"/>
              <Field label="Password" type={showPassword ? 'text' : 'password'} placeholder={mode === 'login' ? 'Enter your password' : 'Password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} error={errors.password?.message} {...field('password')}/>
              <button type="button" className="auth-eye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
            </div>
            {mode === 'register' && <div className="auth-field auth-password-field"><LockKeyhole size={19} aria-hidden="true"/>
              <Field label="Confirm password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...field('confirmPassword')}/>
              <button type="button" className="auth-eye" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword}>{showConfirmPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
            </div>}
            <Button className="auth-submit w-full" loading={loading} type="submit">{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
          </form>
          {mode === 'login' && <p className="auth-switch">New to TaskFlow? <Link to="/register">Create an account</Link></p>}
        </div>
      </div>
    </div>
  );
}
