// En cliente/src/pages/ReservarCitaPage.jsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilos base del calendario
import './ReservarCitaPage.css'; // Nuestros estilos para el calendario

function ReservarCitaPage() {
  // 1. Estado para guardar la fecha que el usuario selecciona
  // Por defecto, es la fecha de hoy (new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // 2. Función que se ejecuta cuando el usuario hace clic en un día
  const handleFechaChange = (fecha) => {
    setFechaSeleccionada(fecha);
    // Aquí, en el futuro, llamarías a la API para
    // buscar las horas disponibles de ESE día
    console.log("Fecha seleccionada:", fecha);
  };

  return (
    <div className="container-reserva">
      <h2>Reserva tu Cita</h2>
      <p>Selecciona un día en el calendario para ver las horas disponibles.</p>
      
      <div className="reserva-layout">
        {/* Columna 1: El Calendario */}
        <div className="calendario-container">
          <Calendar
            onChange={handleFechaChange}
            value={fechaSeleccionada}
            // (Opcional) No permitir seleccionar días anteriores a hoy
            minDate={new Date()} 
          />
        </div>

        {/* Columna 2: Las Horas Disponibles */}
        <div className="horas-container">
          <h3>Horas disponibles para:</h3>
          <p>{fechaSeleccionada.toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          
          {/* Esto es estático por ahora, luego vendrá de la API */}
          <div className="horas-grid">
            <button className="hora-boton">09:00</button>
            <button className="hora-boton">09:30</button>
            <button className="hora-boton" disabled>10:00 (No disponible)</button>
            <button className="hora-boton">10:30</button>
            <button className="hora-boton">11:00</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReservarCitaPage;