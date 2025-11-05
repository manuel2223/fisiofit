// En cliente/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Importa el hook

// Estilos que definimos antes
const styles = {
  navbar: {
    backgroundColor: 'var(--color-blanco)',
    borderBottom: '1px solid var(--color-borde)',
    padding: '1rem 5%', // Usamos 5% en lugar de 'container'
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLogo: {
    color: 'var(--color-principal)',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    color: 'var(--color-texto)',
    textDecoration: 'none',
    fontWeight: 500,
  }
};

function Navbar() {
  // 2. Quitamos 'logout' y 'navigate' de aquí
  const { isLoggedIn } = useAuth();

  // 3. Borramos la función handleLogout

  return (
    <nav style={styles.navbar}>
      <Link to="/" style={styles.navLogo}>FisioApp</Link>
      
      <div style={styles.navLinks}>
        <Link to="/" style={styles.navLink}>Inicio</Link>
        <Link to="/reservar" style={styles.navLink}>Reservar Cita</Link>

        {isLoggedIn && (
          <Link to="/rutinas" style={styles.navLink}>Mis Rutinas</Link>
        )}
      </div>

      <div style={styles.navLinks}>
        {/* 4. MODIFICAMOS EL BLOQUE FINAL */}
        {isLoggedIn ? (
          <>
            {/* El enlace a "Mi Cuenta" ya estaba */}
            <Link to="/mi-cuenta" style={styles.navLink}>Mi Cuenta</Link>
            
            {/* El botón de logout SE QUITA DE AQUÍ */}
          </>
        ) : (
          <Link to="/login" style={styles.navLink}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;