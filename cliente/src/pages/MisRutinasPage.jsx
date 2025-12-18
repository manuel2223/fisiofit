import React, { useState, useEffect } from 'react';

import TarjetaRutina from '../components/TarjetaRutina';
import api from '../api'; 
import './MisRutinasPage.css';

function MisRutinasPage() {
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

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
  }, []); 

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