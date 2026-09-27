import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, apiError } from '../api/client';

const reject = (error, thunk) => thunk.rejectWithValue(apiError(error));
export const loadMe = createAsyncThunk('auth/me', async (_, t) => { try { return (await api.get('/auth/me')).data.user; } catch (e) { return reject(e, t); } });
export const login = createAsyncThunk('auth/login', async (values, t) => { try { return (await api.post('/auth/login', values)).data; } catch (e) { return reject(e, t); } });
export const register = createAsyncThunk('auth/register', async (values, t) => { try { return (await api.post('/auth/register', values)).data; } catch (e) { return reject(e, t); } });
const authSlice = createSlice({
  name: 'auth', initialState: { user: null, ready: false, loading: false, error: null },
  reducers: { logout(state) { state.user = null; state.ready = true; localStorage.removeItem('taskflow_token'); }, clearAuthError(state) { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(loadMe.pending, (s) => { s.loading = true; }).addCase(loadMe.fulfilled, (s, a) => { s.user = a.payload; s.ready = true; s.loading = false; }).addCase(loadMe.rejected, (s) => { s.user = null; s.ready = true; s.loading = false; });
    [login, register].forEach((action) => b.addCase(action.pending, (s) => { s.loading = true; s.error = null; }).addCase(action.fulfilled, (s, a) => { localStorage.setItem('taskflow_token', a.payload.token); s.user = a.payload.user; s.loading = false; s.ready = true; }).addCase(action.rejected, (s, a) => { s.loading = false; s.error = a.payload; }));
  },
});

export const fetchProjects = createAsyncThunk('projects/list', async (_, t) => { try { return (await api.get('/projects')).data.projects; } catch (e) { return reject(e, t); } });
export const fetchProject = createAsyncThunk('projects/detail', async (id, t) => { try { return (await api.get(`/projects/${id}`)).data.project; } catch (e) { return reject(e, t); } });
export const createProject = createAsyncThunk('projects/create', async (values, t) => { try { return (await api.post('/projects', values)).data.project; } catch (e) { return reject(e, t); } });
export const updateProject = createAsyncThunk('projects/update', async ({ id, values }, t) => { try { return (await api.put(`/projects/${id}`, values)).data.project; } catch (e) { return reject(e, t); } });
export const archiveProject = createAsyncThunk('projects/archive', async (id, t) => { try { return (await api.patch(`/projects/${id}/archive`)).data.project; } catch (e) { return reject(e, t); } });
export const deleteProject = createAsyncThunk('projects/delete', async (id, t) => { try { await api.delete(`/projects/${id}`); return id; } catch (e) { return reject(e, t); } });
export const addMember = createAsyncThunk('projects/addMember', async ({ id, userId }, t) => { try { return (await api.post(`/projects/${id}/members`, { userId })).data.project; } catch (e) { return reject(e, t); } });
export const removeMember = createAsyncThunk('projects/removeMember', async ({ id, userId }, t) => { try { return (await api.delete(`/projects/${id}/members/${userId}`)).data.project; } catch (e) { return reject(e, t); } });
const projectSlice = createSlice({ name: 'projects', initialState: { items: [], current: null, loading: false, error: null }, reducers: {}, extraReducers: (b) => {
  b.addCase(fetchProjects.pending, (s) => { s.loading = true; s.error = null; }).addCase(fetchProjects.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; }).addCase(fetchProjects.rejected, (s, a) => { s.error = a.payload; s.loading = false; });
  b.addCase(fetchProject.pending, (s) => { s.loading = true; s.error = null; }).addCase(fetchProject.fulfilled, (s, a) => { s.current = a.payload; s.loading = false; }).addCase(fetchProject.rejected, (s, a) => { s.error = a.payload; s.loading = false; });
  b.addCase(createProject.fulfilled, (s, a) => { s.items.unshift(a.payload); });
  [updateProject, archiveProject, addMember, removeMember].forEach((action) => b.addCase(action.fulfilled, (s, a) => { s.current = a.payload; const i = s.items.findIndex((p) => p._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; }));
  b.addCase(deleteProject.fulfilled, (s, a) => { s.items = s.items.filter((p) => p._id !== a.payload); s.current = null; });
} });

export const fetchTasks = createAsyncThunk('tasks/list', async (params = {}, t) => { try { const { data } = await api.get('/tasks', { params }); return data; } catch (e) { return reject(e, t); } });
export const createTask = createAsyncThunk('tasks/create', async (values, t) => { try { return (await api.post('/tasks', values)).data.task; } catch (e) { return reject(e, t); } });
export const updateTask = createAsyncThunk('tasks/update', async ({ id, values }, t) => { try { return (await api.put(`/tasks/${id}`, values)).data.task; } catch (e) { return reject(e, t); } });
export const deleteTask = createAsyncThunk('tasks/delete', async (id, t) => { try { await api.delete(`/tasks/${id}`); return id; } catch (e) { return reject(e, t); } });
export const changeTaskStatus = createAsyncThunk('tasks/status', async ({ id, status }, t) => {
  const existing = t.getState().tasks.items.find((item) => item._id === id); if (!existing) return t.rejectWithValue('Task is not in the current view');
  const previous = existing.status; t.dispatch(taskSlice.actions.setStatus({ id, status }));
  try { return (await api.put(`/tasks/${id}`, { status })).data.task; }
  catch (e) { t.dispatch(taskSlice.actions.setStatus({ id, status: previous })); return reject(e, t); }
});
const taskSlice = createSlice({ name: 'tasks', initialState: { items: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0, limit: 10 }, loading: false, error: null }, reducers: { setStatus(state, action) { const task = state.items.find((i) => i._id === action.payload.id); if (task) task.status = action.payload.status; } }, extraReducers: (b) => {
  b.addCase(fetchTasks.pending, (s) => { s.loading = true; s.error = null; }).addCase(fetchTasks.fulfilled, (s, a) => { s.items = a.payload.tasks; s.pagination = a.payload.pagination; s.loading = false; }).addCase(fetchTasks.rejected, (s, a) => { s.error = a.payload; s.loading = false; });
  [createTask, updateTask, changeTaskStatus].forEach((action) => b.addCase(action.fulfilled, (s, a) => { const i = s.items.findIndex((v) => v._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; else s.items.unshift(a.payload); }));
  b.addCase(deleteTask.fulfilled, (s, a) => { s.items = s.items.filter((v) => v._id !== a.payload); s.pagination.totalRecords = Math.max(0, s.pagination.totalRecords - 1); });
} });

export const fetchNotifications = createAsyncThunk('notifications/list', async (_, t) => { try { return (await api.get('/notifications')).data; } catch (e) { return reject(e, t); } });
export const markNotificationRead = createAsyncThunk('notifications/read', async (id, t) => { try { return (await api.patch(`/notifications/${id}/read`)).data.notification; } catch (e) { return reject(e, t); } });
export const markAllRead = createAsyncThunk('notifications/readAll', async (_, t) => { try { await api.patch('/notifications/read-all'); } catch (e) { return reject(e, t); } });
const notificationSlice = createSlice({ name: 'notifications', initialState: { items: [], unreadCount: 0, loading: false, error: null }, reducers: {}, extraReducers: (b) => {
  b.addCase(fetchNotifications.pending, (s) => { s.loading = true; }).addCase(fetchNotifications.fulfilled, (s, a) => { s.items = a.payload.notifications; s.unreadCount = a.payload.unreadCount; s.loading = false; }).addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  b.addCase(markNotificationRead.fulfilled, (s, a) => { const i = s.items.findIndex((n) => n._id === a.payload._id); if (i >= 0 && !s.items[i].isRead) { s.items[i] = a.payload; s.unreadCount = Math.max(0, s.unreadCount - 1); } });
  b.addCase(markAllRead.fulfilled, (s) => { s.items.forEach((n) => { n.isRead = true; }); s.unreadCount = 0; });
} });

export const fetchDashboard = createAsyncThunk('dashboard/load', async (_, t) => { try { return (await api.get('/dashboard')).data; } catch (e) { return reject(e, t); } });
const dashboardSlice = createSlice({ name: 'dashboard', initialState: { metrics: null, projectProgress: [], overdueTasks: [], loading: false, error: null }, reducers: {}, extraReducers: (b) => b.addCase(fetchDashboard.pending, (s) => { s.loading = true; s.error = null; }).addCase(fetchDashboard.fulfilled, (s, a) => { Object.assign(s, a.payload, { loading: false }); }).addCase(fetchDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; }) });

export const { logout, clearAuthError } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer, projects: projectSlice.reducer, tasks: taskSlice.reducer, notifications: notificationSlice.reducer, dashboard: dashboardSlice.reducer } });
