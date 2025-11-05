// En cliente/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el "Proveedor" (el componente que envuelve la app)
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cargando, setCargando] = useState(true); // Para saber si ya comprobamos el token

  // 3. Comprueba el localStorage CUANDO la app se carga por primera vez
  useEffect(() => {
    const tokenAlmacenado = localStorage.getItem('token');
    if (tokenAlmacenado) {
      setToken(tokenAlmacenado);
      setIsLoggedIn(true);
    }
    setCargando(false); // Terminamos de cargar
  }, []); // El [] significa que solo se ejecuta 1 vez

  // 4. Función para Iniciar Sesión (la usará LoginPage)
  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoggedIn(true);
  };

  // 5. Función para Cerrar Sesión (la usará el Navbar)
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
  };

  // 6. Valor que compartiremos con toda la app
  const value = {
    token,
    isLoggedIn,
    cargando, // Importante para que no "parpadee" el login
    login,
    logout
  };

  // 7. Si aún está cargando, no mostramos nada para evitar parpadeos
  if (cargando) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 8. Hook personalizado para usar el contexto más fácil
export function useAuth() {
  return useContext(AuthContext);
}