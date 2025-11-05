// En cliente/src/pages/MisRutinasPage.jsx

// 1. SOLUCIÓN: Importa useState y useEffect desde 'react'
import React, { useState, useEffect } from 'react';

// 2. Importaciones que sí necesitas
import TarjetaRutina from '../components/TarjetaRutina';
import api from '../api'; 
import './MisRutinasPage.css';

// 3. Ya no necesitamos mockRutinas, lo borramos

function MisRutinasPage() {
  // 4. Ahora 'useState' SÍ está definido
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 5. Ahora 'useEffect' SÍ está definido
  useEffect(() => {
    const obtenerRutinas = async () => {
      try {
        const respuesta = await api.get('/rutinas');
        setRutinas(respuesta.data);
      } catch (error) {
        console.error('Error al cargar rutinas', error);
      }
      setCargando(false);
    };

    obtenerRutinas();
  }, []); // El array vacío '[]' significa "ejecútate solo una vez"

  // 7. Muestra un mensaje de carga
  if (cargando) {
    return <div className="container-rutinas"><h2>Cargando rutinas...</h2></div>;
  }

  return (
    <div className="container-rutinas">
      <h2>Mis Rutinas Asignadas</h2>
      
      <div className="lista-rutinas">
        {rutinas.length > 0 ? (
          rutinas.map((rutina) => (
            <TarjetaRutina key={rutina.id} rutina={rutina} />
          ))
        ) : (
          <p>Aún no tienes ninguna rutina asignada.</p>
        )}
      </div>
    </div>
  );
}

export default MisRutinasPage;