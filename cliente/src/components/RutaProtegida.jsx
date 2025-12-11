import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function RutaProtegida() {
  const { isLoggedIn, cargando } = useAuth();

  if (cargando) {
    return <div>Cargando...</div>; // Muestra "Cargando" mientras comprueba el token
  }

  if (!isLoggedIn) {
    // Si no está logueado, lo REDIRIGE al login
    return <Navigate to="/login" replace />;
  }

  // Si SÍ está logueado, muestra la página que intentaba ver
  return <Outlet />;
}

export default RutaProtegida;