// En cliente/src/pages/HomePage.jsx
import React from 'react';

// Estilos que estaban en App.jsx, ahora son locales de esta página
const styles = {
  container: {
    width: '90%',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  hero: {
    textAlign: 'center',
    padding: '4rem 0',
  },
  heroTitle: {
    fontSize: '2.8rem',
    color: 'var(--color-principal)',
    marginBottom: '1rem',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.8,
  },
  servicios: {
    padding: '4rem 0',
    textAlign: 'center',
  },
  serviciosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    marginTop: '2rem',
    textAlign: 'left',
  },
};

function HomePage() {
  return (
    <div style={styles.container}>
      {/* Sección Hero */}
      <header style={styles.hero}>
        <h1 style={styles.heroTitle}>Tu bienestar, nuestra prioridad.</h1>
        <p style={styles.heroSubtitle}>
          Reserva tu cita de fisioterapia online y accede a tus rutinas personalizadas.
        </p>
        <a href="/reservar" className="boton-primario">
          Reservar Cita Ahora
        </a>
      </header>

      {/* Sección Servicios */}
      <section style={styles.servicios}>
        <h2>Cómo podemos ayudarte</h2>
        <div style={styles.serviciosGrid}>
          <div className="tarjeta">
            <h3>Reserva de Citas</h3>
            <p>Gestiona tus citas 24/7 de forma rápida y sencilla.</p>
          </div>
          <div className="tarjeta">
            <h3>Rutinas Personalizadas</h3>
            <p>Accede a los ejercicios que tu fisio ha preparado para ti.</p>
          </div>
          <div className="tarjeta">
            <h3>Seguimiento Profesional</h3>
            <p>Estamos contigo en cada paso de tu recuperación.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;