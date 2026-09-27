import axios from 'axios';
import { resolveApiBaseURL } from './baseURL';

const fallbackURL = import.meta.env.PROD
  ? 'https://system-task-managment.onrender.com/api'
  : 'http://localhost:5000/api';
export const api = axios.create({ baseURL: resolveApiBaseURL(import.meta.env.VITE_API_URL, fallbackURL), timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && localStorage.getItem('taskflow_token')) {
    localStorage.removeItem('taskflow_token');
    window.dispatchEvent(new Event('taskflow:unauthorized'));
  }
  return Promise.reject(error);
});
export const apiError = (error) => error.response?.data?.details?.[0]?.message || error.response?.data?.message || error.message || 'Request failed';
