export function resolveApiBaseURL(value, fallback = 'http://localhost:5000/api') {
  const base = (value?.trim() || fallback).replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}
