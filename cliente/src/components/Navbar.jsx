// En cliente/src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // Importamos Link
import { useAuth } from '../context/AuthContext'; // Importamos el hook de Auth
import logoFisioFit from '../assets/logofisiofit.png';

// Tus estilos (no los toques, están bien)
const styles = {
  navbar: {
    backgroundColor: 'var(--color-blanco)',
    borderBottom: '1px solid var(--color-borde)',
    padding: '1rem 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  logoImage: {
    height: '40px', // Ajusta esta altura como veas
    width: 'auto',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center', // Alinea los botones con los enlaces
  },
  navLink: {
    color: 'var(--color-texto)',
    textDecoration: 'none',
    fontWeight: 500,
  }
};


function Navbar() {
  // 1. Traemos el estado (isLoggedIn) y el (rol) del contexto
  const { isLoggedIn, rol } = useAuth();

  return (
    <nav style={styles.navbar}>
      {/* --- SECCIÓN IZQUIERDA (Logo) --- */}
      <Link to="/" style={styles.navLogo}><img src={logoFisioFit} alt="Logo FisioFit" style={styles.logoImage} /></Link>
      
      {/* --- SECCIÓN CENTRAL (Navegación principal) --- */}
      <div style={styles.navLinks}>
        <Link to="/" style={styles.navLink}>Inicio</Link>
        
        {/* 1. MUEVE ESTE ENLACE AFUERA DE LA CONDICIÓN */}
        <Link to="/reservar" style={styles.navLink}>Reservar Cita</Link>
        

        {/* Enlace para Pacientes */}
        {isLoggedIn && rol === 'paciente' && (
          <Link to="/rutinas" style={styles.navLink}>Mis Rutinas</Link>
        )}
        
        {/* Enlace para Fisioterapeutas */}
        {isLoggedIn && rol === 'fisioterapeuta' && (
          <Link to="/fisio/dashboard" style={styles.navLink}>Dashboard</Link>
        )}
      </div>

      {/* --- SECCIÓN DERECHA (Login/Mi Cuenta) --- */}
      <div style={styles.navLinks}>
        {isLoggedIn ? (
          // Si está logueado, muestra "Mi Cuenta"
          <>
            <Link to="/mi-cuenta" style={styles.navLink}>Mi Cuenta</Link>
          </>
        ) : (
          // Si no, muestra "Login"
          <Link to="/login" style={styles.navLink}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;