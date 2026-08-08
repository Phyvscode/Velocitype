import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import './index.css';
import { initializeActiveFont } from '@/lib/fonts';
import { initializeActiveColor, initializeActiveBgColor } from '@/lib/colors';

// Synchronously apply saved themes before React mounts to prevent FOUC (Flash of Unstyled Content)
initializeActiveFont();
initializeActiveColor();
initializeActiveBgColor();

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_PLACEHOLDER';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
