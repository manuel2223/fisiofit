// En cliente/src/components/Footer.jsx
import React from 'react';

const styles = {
  footer: {
    backgroundColor: 'var(--color-principal)',
    color: 'var(--color-blanco)',
    textAlign: 'center',
    padding: '1.5rem 0',
    marginTop: '4rem',
  },
};

function Footer() {
  return (
    <footer style={styles.footer}>
      <p>&copy; {new Date().getFullYear()} FisioApp. Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer;