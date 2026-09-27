import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, CheckCheck, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiError } from '../api/client';
import { fetchNotifications, markAllRead, markNotificationRead } from '../store';
import { Button, EmptyState, ErrorState, Loading, PageHeader } from '../components/ui';

export function NotificationsPage() {
  const dispatch = useDispatch(); const { items, unreadCount, loading, error } = useSelector((s) => s.notifications);
  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);
  const all = async () => { const action = await dispatch(markAllRead()); action.meta.requestStatus === 'fulfilled' ? toast.success('All notifications marked as read') : toast.error(action.payload); };
  if (loading && !items.length) return <Loading label="Loading notifications…"/>;
  if (error && !items.length) return <ErrorState message={error} onRetry={() => dispatch(fetchNotifications())}/>;
  return <><PageHeader title="Notifications" description={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`} action={unreadCount > 0 && <Button variant="secondary" onClick={all}><CheckCheck className="h-4 w-4"/>Mark all read</Button>}/>{!items.length ? <EmptyState title="You are all caught up" body="Project and task updates will appear here."/> : <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">{items.map((item) => <button key={item._id} onClick={() => !item.isRead && dispatch(markNotificationRead(item._id))} className={`flex w-full items-start gap-4 border-b border-slate-100 p-5 text-left last:border-0 dark:border-slate-800 ${item.isRead ? '' : 'bg-brand-50/60 dark:bg-brand-950/30'}`}><span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.isRead ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-brand-100 text-brand-700'}`}><Bell className="h-5 w-5"/></span><span className="flex-1"><span className="block font-semibold">{item.message}</span><span className="mt-1 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></span>{!item.isRead && <span className="mt-4 h-2.5 w-2.5 rounded-full bg-brand-600"/>}</button>)}</div>}</>;
}

export function AdminUsersPage() {
  const [state, setState] = useState({ users: [], loading: true, error: null });
  const load = () => { setState((s) => ({ ...s, loading: true, error: null })); api.get('/users').then(({ data }) => setState({ users: data.users, loading: false, error: null })).catch((e) => setState({ users: [], loading: false, error: apiError(e) })); };
  useEffect(load, []);
  if (state.loading) return <Loading label="Loading users…"/>;
  if (state.error) return <ErrorState message={state.error} onRetry={load}/>;
  return <><PageHeader title="Users" description="Administrative directory of all registered accounts."/><div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{state.users.map((user) => <tr key={user._id}><td className="px-5 py-4 font-semibold">{user.name}</td><td className="px-5 py-4 text-slate-500">{user.email}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800"><ShieldCheck className="h-3.5 w-3.5"/>{user.role}</span></td><td className="px-5 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div></>;
}
export function NotFoundPage() { return <div className="grid min-h-[60vh] place-items-center text-center"><div><p className="text-7xl font-black text-brand-200">404</p><h1 className="mt-4 text-2xl font-bold">Page not found</h1><p className="mt-2 text-slate-500">The page you requested does not exist.</p><Link className="mt-5 inline-block font-bold text-brand-600" to="/dashboard">Return to dashboard</Link></div></div>; }
