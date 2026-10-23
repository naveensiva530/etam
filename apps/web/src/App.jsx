import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { InstitutionProvider } from '@/context/InstitutionContext';
import HomePage from '@/pages/HomePage';
import { AuthGate } from '@/features/auth/AuthGate';
import { useAuth } from '@/context/AuthContext';

function AppContent() {
  const { user } = useAuth();

  return (
    <InstitutionProvider>
      {user ? <HomePage key={user.id} /> : <AuthGate />}
    </InstitutionProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
