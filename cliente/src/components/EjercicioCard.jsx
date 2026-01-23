import React from 'react';
import './EjercicioCard.css';

const EjercicioCard = ({ ejercicio, children }) => {
  return (
    <div className="card-ejercicio">
      {/* 1. La Imagen (GIF) */}
      <div className="card-imagen-container">
        <img 
          src={ejercicio.videoUrl} 
          alt={ejercicio.nombre}
          loading="lazy" 
          className="card-imagen"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Img';
          }}
        />
        {/* Badge de Categoría */}
        <span className="card-badge">
          {ejercicio.categoria ? ejercicio.categoria.nombre : (ejercicio.Categoria ? ejercicio.Categoria.nombre : 'General')}
        </span>
      </div>

      {/* 2. El Contenido (Nombre y Botones) */}
      <div className="card-contenido">
        
        {/* AQUI VA EL NOMBRE QUE FALTABA */}
        <h4 className="card-titulo" title={ejercicio.nombre}>
            {ejercicio.nombre}
        </h4>

        {/* AQUÍ VAN LOS BOTONES (Editar/Borrar) */}
        <div className="card-actions">
           {children}
        </div>
      </div>
    </div>
  );
};

export default EjercicioCard;