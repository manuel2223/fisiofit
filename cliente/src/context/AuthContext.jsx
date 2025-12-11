import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [rol, setRol] = useState(null); 
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

  const login = (newToken, newRol) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('rol', newRol); // <-- GUARDA EL ROL
    setToken(newToken);
    setRol(newRol); // <-- ESTABLECE EL ROL
    setIsLoggedIn(true);
  };

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
  
  if (cargando) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}