import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import { User, Project, Task } from '../models/index.js';
import { auth } from '../controllers/index.js';
import { registerSchema } from '../validators/index.js';
import { accessibleProjectFilter, requireManager } from '../services/access.js';

test('USER registration and database-driven ADMIN authorization', async () => {
  const records = [];
  const originals = { exists: User.exists, create: User.create, findOne: User.findOne, findById: User.findById, find: User.find, projectFind: Project.find, aggregate: Task.aggregate, taskFind: Task.find, count: Task.countDocuments };
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'role-verification-secret-at-least-32-characters';
  const chain = (rows) => {
    const query = { then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject) };
    for (const method of ['populate', 'sort', 'skip', 'limit']) query[method] = () => query;
    query.distinct = async () => [];
    return query;
  };
  User.exists = async ({ email }) => records.some(u => u.email === email);
  User.create = async values => {
    const doc = new User(values);
    doc.comparePassword = async value => value === values.password;
    records.push(doc);
    return doc;
  };
  User.findOne = ({ email }) => ({ select: async () => records.find(u => u.email === email) });
  User.findById = async id => records.find(u => String(u._id) === id);
  User.find = () => chain(records);
  const projectFilters = [];
  Project.find = filter => { projectFilters.push(filter); return chain([]); };
  Task.aggregate = async () => [];
  Task.find = () => chain([]);
  Task.countDocuments = async () => 0;
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const request = async (path, body, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    assert.equal(new User().role, 'USER');
    assert.deepEqual(new Set(User.schema.path('role').enumValues), new Set(['USER', 'ADMIN']));
    const normal = await request('/auth/register', { name: 'Normal User', email: 'normal@example.com', password: 'test-password-123' });
    assert.equal(normal.status, 201); assert.equal(normal.data.user.role, 'USER'); assert.ok(!('password' in normal.data.user));
    const forged = await request('/auth/register', { name: 'Forged Admin', email: 'forged@example.com', password: 'test-password-123', role: 'ADMIN' });
    assert.equal(forged.data.user.role, 'USER');
    // The controller enforces USER even without validation middleware.
    await auth.register({ body: { name: 'Direct User', email: 'direct@example.com', password: 'test-password-123', role: 'ADMIN' } }, { status() { return this; }, json(data) { assert.equal(data.user.role, 'USER'); } });
    const credentials = registerSchema.parse({ name: ' Admin Name ', email: ' ADMIN@example.com ', password: 'test-password-123' });
    assert.equal(credentials.email, 'admin@example.com');
    await User.create({ ...credentials, role: 'ADMIN' });
    for (const [email, role] of [['normal@example.com', 'USER'], ['admin@example.com', 'ADMIN']]) {
      const login = await request('/auth/login', { email, password: 'test-password-123', role: role === 'ADMIN' ? 'USER' : 'ADMIN' });
      assert.equal(login.status, 200); assert.equal(login.data.user.role, role); assert.ok(!('password' in login.data.user));
      const token = login.data.token;
      const me = await request('/auth/me', null, token);
      assert.equal(me.data.user.role, role); assert.ok(!('password' in me.data.user));
      assert.equal((await request('/users', null, token)).status, role === 'ADMIN' ? 200 : 403);
      assert.equal((await request('/projects', null, token)).status, 200);
      assert.equal((await request('/tasks', null, token)).status, 200);
      assert.equal(JSON.stringify(projectFilters.at(-1)), JSON.stringify(accessibleProjectFilter(me.data.user)));
      if (role === 'ADMIN') assert.deepEqual(projectFilters.at(-1), {});
    }
    assert.equal((await request('/users')).status, 401);
    assert.throws(() => requireManager({ owner: 'other' }, { _id: 'user', role: 'USER' }), error => error.statusCode === 403);
    assert.doesNotThrow(() => requireManager({ owner: 'other' }, { _id: 'admin', role: 'ADMIN' }));
  } finally {
    await new Promise(resolve => server.close(resolve));
    Object.assign(User, { exists: originals.exists, create: originals.create, findOne: originals.findOne, findById: originals.findById, find: originals.find });
    Project.find = originals.projectFind; Task.aggregate = originals.aggregate; Task.find = originals.taskFind; Task.countDocuments = originals.count;
    if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  }
});
