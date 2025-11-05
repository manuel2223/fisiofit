// En cliente/src/components/TarjetaRutina.jsx
import React from 'react';
import './TarjetaRutina.css'; // Crearemos este CSS ahora

// Este componente recibe la 'rutina' como un "prop"
function TarjetaRutina({ rutina }) {

  return (
    <div className="tarjeta-rutina tarjeta"> {/* Usamos la clase 'tarjeta' que ya definimos */}
      <h3>{rutina.nombre}</h3>
      <p className="creador">Asignada por: 
        <strong>
          {rutina.fisioterapeutaCreador ? rutina.fisioterapeutaCreador.nombre : 'Doctor'}
        </strong>
      </p>

      <h4>Ejercicios:</h4>
      <ul className="lista-ejercicios">
        {rutina.ejercicios.map((ejercicio, index) => (
          <li key={index} className="ejercicio-item">
            <span className="nombre">{ejercicio.nombreEjercicio}</span>
            <span className="series">{ejercicio.series} x {ejercicio.repeticiones} reps</span>
            
            {/* Si hay video, mostramos un enlace/reproductor */}
            {ejercicio.videoUrl && (
              <div className="video-container">
                <iframe
                  src={ejercicio.videoUrl}
                  title={`Video de ${ejercicio.nombreEjercicio}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TarjetaRutina;