// En cliente/src/components/RutaProtegidaFisio.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function RutaProtegidaFisio() {
  const { isLoggedIn, rol, cargando } = useAuth();

  if (cargando) {
    return <div>Cargando...</div>; 
  }

  // 1. Comprueba si está logueado Y si es fisio
  if (isLoggedIn && rol === 'fisioterapeuta') {
    return <Outlet />; // Si es fisio, le dejamos pasar
  }

  if (isLoggedIn && rol !== 'fisioterapeuta') {
    return <Navigate to="/" replace />; // Si es paciente, lo echamos al inicio
  }
  
  // 3. Si no está logueado
  return <Navigate to="/login" replace />;
}

export default RutaProtegidaFisio;