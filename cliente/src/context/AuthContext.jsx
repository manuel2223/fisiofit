// En cliente/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [rol, setRol] = useState(null); // <-- AÑADIR ESTADO PARA EL ROL
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenAlmacenado = localStorage.getItem('token');
    const rolAlmacenado = localStorage.getItem('rol'); // <-- BUSCA EL ROL GUARDADO
    
    if (tokenAlmacenado && rolAlmacenado) {
      setToken(tokenAlmacenado);
      setRol(rolAlmacenado); // <-- RECUPERA EL ROL
      setIsLoggedIn(true);
    }
    setCargando(false);
  }, []);

  // 4. Modifica 'login' para aceptar el rol
  const login = (newToken, newRol) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('rol', newRol); // <-- GUARDA EL ROL
    setToken(newToken);
    setRol(newRol); // <-- ESTABLECE EL ROL
    setIsLoggedIn(true);
  };

  // 5. Modifica 'logout' para limpiar el rol
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol'); // <-- LIMPIA EL ROL
    setToken(null);
    setRol(null); // <-- LIMPIA EL ROL
    setIsLoggedIn(false);
  };

  // 6. Expone el 'rol' en el valor del contexto
  const value = {
    token,
    rol, // <-- EXPONER ROL
    isLoggedIn,
    cargando,
    login,
    logout
  };
  
  // ... (el resto del archivo se queda igual)
  if (cargando) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}