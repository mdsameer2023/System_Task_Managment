import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import { resolveApiBaseURL } from '../../frontend/src/api/baseURL.js';

test('API URL includes the API route prefix exactly once', () => {
  const origin = 'https://system-task-managment.onrender.com';
  for (const value of [origin, `${origin}/`, `${origin}/api`, ` ${origin}/api/ `]) {
    assert.equal(resolveApiBaseURL(value), `${origin}/api`);
  }
  assert.equal(resolveApiBaseURL('/api'), '/api');
  assert.equal(resolveApiBaseURL(''), 'http://localhost:5000/api');
  assert.equal(resolveApiBaseURL(undefined, `${origin}/api`), `${origin}/api`);
});

test('Vercel registration preflight is allowed; other origins are not', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    for (const origin of ['https://system-task-managment-frontend.vercel.app', 'http://localhost:5173', 'https://unrelated.example']) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
        method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' },
      });
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('access-control-allow-origin'), origin === 'https://unrelated.example' ? null : origin);
      assert.match(response.headers.get('access-control-allow-methods'), /POST/);
      assert.match(response.headers.get('access-control-allow-headers'), /content-type/);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
