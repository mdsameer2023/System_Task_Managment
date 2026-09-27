import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Archive, CalendarDays, Edit3, FolderPlus, Plus, Trash2, UserMinus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { addMember, archiveProject, createProject, deleteProject, fetchProject, fetchProjects, removeMember, updateProject } from '../store';
import { Badge, Button, EmptyState, ErrorState, Field, Loading, Modal, PageHeader, Select, Textarea } from '../components/ui';

const projectSchema = z.object({ name: z.string().min(2, 'Enter at least 2 characters'), description: z.string().max(2000), status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']), startDate: z.string().min(1, 'Start date is required'), dueDate: z.string().min(1, 'Due date is required') }).refine((v) => new Date(v.dueDate) >= new Date(v.startDate), { path: ['dueDate'], message: 'Due date cannot precede start date' });
const dateInput = (date) => date ? new Date(date).toISOString().slice(0, 10) : '';

function ProjectForm({ open, onClose, project }) {
  const dispatch = useDispatch(); const [saving, setSaving] = useState(false); const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(projectSchema), defaultValues: { name: '', description: '', status: 'PLANNING', priority: 'MEDIUM', startDate: dateInput(new Date()), dueDate: '' } });
  useEffect(() => { reset(project ? { name: project.name, description: project.description || '', status: project.status, priority: project.priority, startDate: dateInput(project.startDate), dueDate: dateInput(project.dueDate) } : { name: '', description: '', status: 'PLANNING', priority: 'MEDIUM', startDate: dateInput(new Date()), dueDate: '' }); }, [project, reset, open]);
  const submit = async (values) => { setSaving(true); const action = await dispatch(project ? updateProject({ id: project._id, values }) : createProject(values)); setSaving(false); if (action.meta.requestStatus === 'fulfilled') { toast.success(project ? 'Project updated' : 'Project created'); onClose(); } else toast.error(action.payload); };
  return <Modal open={open} onClose={onClose} title={project ? 'Edit project' : 'Create project'}><form onSubmit={handleSubmit(submit)} className="space-y-4"><Field label="Project name" error={errors.name?.message} {...register('name')}/><Textarea label="Description" error={errors.description?.message} {...register('description')}/><div className="grid gap-4 sm:grid-cols-2"><Select label="Status" {...register('status')}><option value="PLANNING">Planning</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></Select><Select label="Priority" {...register('priority')}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></Select><Field label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')}/><Field label="Due date" type="date" error={errors.dueDate?.message} {...register('dueDate')}/></div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>{project ? 'Save changes' : 'Create project'}</Button></div></form></Modal>;
}

export function ProjectsPage() {
  const dispatch = useDispatch(); const { items, loading, error } = useSelector((s) => s.projects); const [formOpen, setFormOpen] = useState(false);
  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);
  return <>
    <PageHeader title="Projects" description="Plan initiatives, organize members, and track delivery." action={<Button onClick={() => setFormOpen(true)}><FolderPlus className="h-4 w-4"/>New project</Button>}/>
    {loading && !items.length ? <Loading label="Loading projects…"/> : error && !items.length ? <ErrorState message={error} onRetry={() => dispatch(fetchProjects())}/> : !items.length ? <EmptyState title="No projects yet" body="Create your first project to start organizing work." action={<Button onClick={() => setFormOpen(true)}>Create project</Button>}/> : (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p, index) => {
          const total = p.taskStats?.total || 0; const completed = p.taskStats?.completed || 0; const percent = total ? Math.round(completed / total * 100) : 0;
          return <Link key={p._id} to={`/projects/${p._id}`} data-priority={p.priority} data-status={p.status} style={{ '--project-delay': `${Math.min(index, 8) * 45}ms` }} className="project-card group rounded-xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="project-card-heading flex items-start justify-between gap-3"><h2 className="min-w-0 flex-1 text-base font-bold group-hover:text-brand-600" title={p.name}>{p.name}</h2><span className="project-status"><Badge value={p.status}/></span></div>
            <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-500">{p.description || 'No description provided.'}</p>
            <span className="project-priority mt-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-current"/>{p.priority} priority</span>
            <div className="mt-6"><div className="mb-2 flex justify-between text-xs text-slate-500"><span>{completed} of {total} tasks</span><span>{percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }}/></div></div>
            <div className="project-card-footer mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span className="flex items-center gap-1.5"><Users className="h-4 w-4"/>{(p.members?.length || 0) + 1} people</span><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/>{new Date(p.dueDate).toLocaleDateString()}</span></div>
          </Link>;
        })}
      </div>
    )}
    <ProjectForm open={formOpen} onClose={() => setFormOpen(false)}/>
  </>;
}

export function ProjectDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const dispatch = useDispatch(); const { current: project, loading, error } = useSelector((s) => s.projects); const user = useSelector((s) => s.auth.user);
  const [editOpen, setEditOpen] = useState(false); const [directory, setDirectory] = useState([]); const [memberId, setMemberId] = useState(''); const [taskSummary, setTaskSummary] = useState([]); const [busy, setBusy] = useState(false);
  const manager = user?.role === 'ADMIN' || project?.owner?._id === user?._id;
  useEffect(() => { dispatch(fetchProject(id)); api.get('/tasks', { params: { project: id, limit: 100 } }).then(({ data }) => setTaskSummary(data.tasks)).catch(() => setTaskSummary([])); }, [dispatch, id]);
  useEffect(() => { if (manager) api.get('/users/directory').then(({ data }) => setDirectory(data.users)).catch(() => {}); }, [manager]);
  const available = useMemo(() => directory.filter((u) => u._id !== project?.owner?._id && !project?.members?.some((m) => m._id === u._id)), [directory, project]);
  if (loading && (!project || project._id !== id)) return <Loading label="Loading project…"/>;
  if (error && (!project || project._id !== id)) return <ErrorState message={error} onRetry={() => dispatch(fetchProject(id))}/>;
  if (!project) return null;
  const act = async (promise, success) => { setBusy(true); const action = await promise; setBusy(false); if (action.meta.requestStatus === 'fulfilled') toast.success(success); else toast.error(action.payload); return action; };
  const remove = async () => { if (!window.confirm(`Delete ${project.name} and all of its tasks? This cannot be undone.`)) return; const action = await act(dispatch(deleteProject(id)), 'Project deleted'); if (action.meta.requestStatus === 'fulfilled') navigate('/projects'); };
  const archive = async () => { if (!window.confirm(`Archive ${project.name}?`)) return; await act(dispatch(archiveProject(id)), 'Project archived'); };
  const add = async () => { if (!memberId) return; const action = await act(dispatch(addMember({ id, userId: memberId })), 'Member added'); if (action.meta.requestStatus === 'fulfilled') setMemberId(''); };
  const removePerson = async (person) => { if (!window.confirm(`Remove ${person.name} from this project? Their assigned tasks will become unassigned.`)) return; await act(dispatch(removeMember({ id, userId: person._id })), 'Member removed'); };
  return <><PageHeader title={project.name} description={project.description || 'No description provided.'} action={manager && <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditOpen(true)}><Edit3 className="h-4 w-4"/>Edit</Button><Button variant="secondary" disabled={project.status === 'ARCHIVED' || busy} onClick={archive}><Archive className="h-4 w-4"/>Archive</Button><Button variant="danger" disabled={busy} onClick={remove}><Trash2 className="h-4 w-4"/>Delete</Button></div>}/><div className="grid gap-5 md:grid-cols-4"><Info label="Status"><Badge value={project.status}/></Info><Info label="Priority"><Badge value={project.priority}/></Info><Info label="Owner" value={project.owner?.name}/><Info label="Timeline" value={`${new Date(project.startDate).toLocaleDateString()} – ${new Date(project.dueDate).toLocaleDateString()}`}/></div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.75fr]"><section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Recent tasks</h2><Link to={`/tasks?project=${project._id}`} className="text-sm font-bold text-brand-600">View all</Link></div><div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{taskSummary.length ? taskSummary.slice(0, 8).map((task) => <div className="flex items-center justify-between gap-3 py-3" key={task._id}><div><p className="font-semibold">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.assignedTo?.name || 'Unassigned'} · due {new Date(task.dueDate).toLocaleDateString()}</p></div><Badge value={task.status}/></div>) : <p className="py-8 text-center text-sm text-slate-500">No tasks in this project.</p>}</div></section><section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">Project members</h2><div className="mt-4 space-y-3"><Person person={project.owner} owner/>{project.members?.map((person) => <Person key={person._id} person={person} onRemove={manager ? () => removePerson(person) : null}/>)}</div>{manager && <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800"><Select label="Add a member" value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">Select a user</option>{available.map((u) => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}</Select><Button className="mt-3 w-full" disabled={!memberId} loading={busy} onClick={add}><Plus className="h-4 w-4"/>Add member</Button></div>}</section></div><ProjectForm open={editOpen} onClose={() => setEditOpen(false)} project={project}/></>;
}
function Info({ label, value, children }) { return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-2 text-sm font-semibold">{children || value}</div></div>; }
function Person({ person, owner, onRemove }) { return <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{person?.name?.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{person?.name}</p><p className="truncate text-xs text-slate-500">{owner ? 'Project owner' : person?.email}</p></div>{onRemove && <button onClick={onRemove} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove member"><UserMinus className="h-4 w-4"/></button>}</div>; }
