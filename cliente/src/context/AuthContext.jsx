import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [rol, setRol] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenAlmacenado = localStorage.getItem('token');
    const rolAlmacenado = localStorage.getItem('rol');
    
    if (tokenAlmacenado && rolAlmacenado) {
      setToken(tokenAlmacenado);
      setRol(rolAlmacenado); 
      setIsLoggedIn(true);
    }
    setCargando(false);
  }, []);

  const login = (newToken, newRol) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('rol', newRol); 
    setToken(newToken);
    setRol(newRol); // ESTABLECE EL ROL
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol'); // LIMPIA EL ROL
    setToken(null);
    setRol(null); 
    setIsLoggedIn(false);
  };

  const value = {
    token,
    rol, 
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