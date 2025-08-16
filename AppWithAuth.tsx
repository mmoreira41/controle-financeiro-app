import React from 'react'
import { AuthProvider } from './src/contexts/AuthContext'
import { ProtectedRoute } from './src/components/ProtectedRoute'
import AppSupabase from './AppSupabase'

const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppSupabase />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default AppWithAuth