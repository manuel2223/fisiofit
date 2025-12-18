import React from 'react';
import { Link } from 'react-router-dom';
import './TarjetaRutina.css';

// Función para transformar URl
const getEmbedUrl = (url) => {
  if (!url) return null;
  
  // Esta expresión regular extrae el ID del video de cualquier enlace de YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

function TarjetaRutina({ rutina }) {

  return (
    <div className="tarjeta-rutina tarjeta">
      <h3>{rutina.nombre}</h3>
      <p className="creador">
        Asignada por: <strong>{rutina.fisioterapeutaCreador ? rutina.fisioterapeutaCreador.nombre : 'Doctor'}</strong>
      </p>

      <h4>Ejercicios:</h4>
      <ul className="lista-ejercicios">
        {rutina.ejercicios.map((ejercicio, index) => {
          const embedUrl = getEmbedUrl(ejercicio.videoUrl);

          return (
            <li key={index} className="ejercicio-item">
              <span className="nombre">{ejercicio.nombreEjercicio}</span>
              <span className="series">{ejercicio.series} x {ejercicio.repeticiones} reps</span>
              
              {embedUrl && (
                <div className="video-container">
                  <iframe
                    src={embedUrl} 
                    title={`Video de ${ejercicio.nombreEjercicio}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

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
          );
        })}
      </ul>
    </div>
  );
}

export default TarjetaRutina;