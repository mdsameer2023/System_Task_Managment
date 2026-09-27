import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { logout, store } from './store';
import './index.css';

window.addEventListener('taskflow:unauthorized', () => store.dispatch(logout()));
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Provider store={store}><BrowserRouter><App/><Toaster position="top-right" toastOptions={{ duration: 3500 }}/></BrowserRouter></Provider></React.StrictMode>);
