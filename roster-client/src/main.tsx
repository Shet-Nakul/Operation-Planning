import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStoreProvider } from './context/AppStoreContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppStoreProvider><App /></AppStoreProvider></StrictMode>,
);
