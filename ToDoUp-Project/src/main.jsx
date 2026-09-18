import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import './App.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const hasClerkKey = clerkKey !== undefined && clerkKey !== null && clerkKey !== '';

if (hasClerkKey === false) {
  const rootElement = document.getElementById('root');

  rootElement.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
      <h2>Configuration Error</h2>
      <p>Missing VITE_CLERK_PUBLISHABLE_KEY in .env file</p>
      <p style="color: #666; font-size: 0.9rem;">Please add your Clerk publishable key to .env</p>
    </div>
  `;
  } 
    else {
  const rootElement = document.getElementById('root');
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkKey}>
        <App />
      </ClerkProvider>
    </StrictMode>
  );
}