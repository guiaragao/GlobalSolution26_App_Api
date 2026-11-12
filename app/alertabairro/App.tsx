// Ponto de entrada do app AlertaBairro.

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexto/AuthContext';
import Navegacao from './src/navegacao';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navegacao />
    </AuthProvider>
  );
}
