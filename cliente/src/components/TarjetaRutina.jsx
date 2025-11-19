// En cliente/src/components/TarjetaRutina.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
import './TarjetaRutina.css';

function TarjetaRutina({ rutina }) {

  return (
    <div className="tarjeta-rutina tarjeta">
      <h3>{rutina.nombre}</h3>
      <p className="creador">
        Asignada por: <strong>{rutina.fisioterapeutaCreador ? rutina.fisioterapeutaCreador.nombre : 'Doctor'}</strong>
      </p>

      <h4>Ejercicios:</h4>
      <ul className="lista-ejercicios">
        {rutina.ejercicios.map((ejercicio, index) => (
          <li key={index} className="ejercicio-item">
            <span className="nombre">{ejercicio.nombreEjercicio}</span>
            <span className="series">{ejercicio.series} x {ejercicio.repeticiones} reps</span>
            
            {/* Contenedor del Video (si existe) */}
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

            {/* ¡EL NUEVO BOTÓN QUE AÑADIMOS! */}
            {/* Solo se muestra si el ejercicio tiene reglas de postura */}
            {ejercicio.reglasPostura && (
              <Link 
                to={`/entrenar/${ejercicio.id}`} 
                className="boton-primario"
                style={{textDecoration: 'none', marginTop: '1rem', display: 'block', textAlign: 'center'}}
              >
                Comprobar Postura con IA
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TarjetaRutina;