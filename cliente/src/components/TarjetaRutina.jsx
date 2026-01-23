import React from 'react';
import { Link } from 'react-router-dom';
import './TarjetaRutina.css';

function TarjetaRutina({ rutina }) {

  // Recuperamos la lista (ya sea minúscula o mayúscula)
  const listaEjercicios = rutina.ejercicios || rutina.Ejercicios || [];

  return (
    <div className="tarjeta-rutina tarjeta">
      <div className="rutina-header">
        <h3>{rutina.nombre}</h3>
        {/* Usamos el color de acento o principal para el badge de frecuencia */}
        <span className="badge-frecuencia" style={{
            background: 'var(--color-acento)', 
            color: '#004d40', // Un verde oscuro para contraste
            borderRadius: '4px',
            padding: '4px 8px'
        }}>
            {rutina.frecuenciaSemanal || 'Rutina'}
        </span>
      </div>
      
      <p className="creador" style={{color: 'var(--color-texto)', opacity: 0.8}}>
        <small>Asignada por: <strong>{rutina.fisioterapeutaCreador?.nombre || 'Tu Fisio'}</strong></small>
      </p>

      <div className="lista-ejercicios-paciente">
        {listaEjercicios.map((ejInstancia, index) => {
          
          const datos = {
            idParaIA: ejInstancia.EjercicioBibliotecaId || ejInstancia.ejercicioBibliotecaId || ejInstancia.id, 
            nombre: ejInstancia.nombreEjercicio || "Ejercicio",
            videoUrl: ejInstancia.videoUrl,
            series: ejInstancia.series,
            reps: ejInstancia.repeticiones,
            reglas: ejInstancia.reglasPostura 
          };

          return (
            <div key={index} className="ejercicio-row">
              {/* 1. IMAGEN GRANDE */}
              <div className="ejercicio-media">
                <img 
                  src={datos.videoUrl} 
                  alt={datos.nombre}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Sin+Img'}
                />
              </div>

              {/* 2. INFO */}
              <div className="ejercicio-info">
                <h4>{datos.nombre}</h4>
                <div className="metadata-series">
                   <span className="pill">🔁 {datos.series} Series</span>
                   <span className="pill">⚡ {datos.reps} Reps</span>
                </div>
              </div>

              {/* 3. BOTÓN IA RECTANGULAR */}
              <div className="ejercicio-action">
                 {datos.reglas && datos.reglas.length > 0 && (
                   <Link 
                     to={`/entrenar/${datos.idParaIA}`} 
                     className="btn-ia-action"
                   >
                     📷 Comprobar con IA
                   </Link>
                 )}
              </div>
            </div>
          );
        })}
        
        {listaEjercicios.length === 0 && (
            <div className="empty-msg">
              No hay ejercicios asignados a esta rutina.
            </div>
        )}
      </div>
    </div>
  );
}

export default TarjetaRutina;