import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../axioma_pr';
import './styles.css';
import { BackendProvider } from './prototype-backend';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BackendProvider><App /></BackendProvider>
  </React.StrictMode>,
);
