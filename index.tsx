
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppSupabase from './AppSupabase';
import 'lucide-react'; // Ensures lucide icons are available

console.log('🚀 Iniciando aplicação com sistema Supabase corrigido')

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppSupabase />
  </React.StrictMode>
);
