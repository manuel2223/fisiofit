// En cliente/src/pages/MiCuentaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './MiCuentaPage.css'; // Crearemos este CSS

function MiCuentaPage() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { logout } = useAuth(); // Traemos la función de logout del contexto
  const navigate = useNavigate();

  // 1. Al cargar, busca los datos del usuario en la API
  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const respuesta = await api.get('/auth/me'); // Llama a la nueva ruta
        setUsuario(respuesta.data);
      } catch (error) {
        console.error('Error al cargar datos del usuario', error);
      }
      setCargando(false);
    };

    obtenerDatosUsuario();
  }, []); // [] = ejecutar solo una vez

  // 2. Función para manejar el logout
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirige al login después de cerrar sesión
  };

  // 3. Muestra "Cargando..." mientras espera
  if (cargando) {
    return <div className="mi-cuenta-container"><h2>Cargando...</h2></div>;
  }

  // 4. Si no encontró al usuario
  if (!usuario) {
    return <div className="mi-cuenta-container"><h2>No se pudieron cargar los datos.</h2></div>;
  }

  // 5. Muestra la página
  return (
    <div className="mi-cuenta-container">
      <div className="mi-cuenta-tarjeta tarjeta">
        <h2>Mi Cuenta</h2>
        
        <div className="detalle-cuenta">
          <p><strong>Nombre:</strong> {usuario.nombre}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <p><strong>Rol:</strong> {usuario.rol}</p>
        </div>

        {/* Botón de Cerrar Sesión (Meta 2) */}
        <button onClick={handleLogout} className="boton-logout">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default MiCuentaPage;