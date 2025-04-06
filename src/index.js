import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const supabase = createClient(
  "https://gckjglzhldumgqqvhnao.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja2pnbHpobGR1bWdxcXZobmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Njk0NjUsImV4cCI6MjA1OTM0NTQ2NX0.IobEm3-aX3t1ZBBIqvCbP7uJph3-WlcqNTYXSg9XjRo"
)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <App />
    </SessionContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
