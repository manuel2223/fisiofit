// En cliente/src/pages/ReservarCitaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api';
import 'react-calendar/dist/Calendar.css';
import './ReservarCitaPage.css';

// --- HORARIOS DE LA CLÍNICA (Personalízalo) ---
// Define todos los horarios posibles
const HORARIOS_BASE = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

function ReservarCitaPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const navigate = useNavigate();

  // 1. Efecto que se dispara cada vez que el usuario cambia la fecha
  useEffect(() => {
    // Resetea la hora seleccionada
    setHoraSeleccionada(null);
    setCargandoHoras(true);

    // Formatea la fecha a YYYY-MM-DD
    const anio = fechaSeleccionada.getFullYear();
    const mes = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const fechaFormatoAPI = `${anio}-${mes}-${dia}`;

    // Llama a la API para obtener las horas ocupadas de ESE día
    api.get(`/citas/disponibilidad/${fechaFormatoAPI}`)
      .then(respuesta => {
        setHorariosOcupados(respuesta.data);
      })
      .catch(error => {
        console.error("Error al cargar horarios:", error);
        alert("No se pudieron cargar los horarios. ¿Has iniciado sesión?");
      })
      .finally(() => {
        setCargandoHoras(false);
      });

  }, [fechaSeleccionada]); // Depende de esta variable

  // 2. Función para manejar la confirmación
  const handleConfirmarReserva = async () => {
    if (!horaSeleccionada) {
      alert("Por favor, selecciona una hora.");
      return;
    }

    try {
      // Combina la fecha seleccionada con la hora seleccionada
      const [hora, minuto] = horaSeleccionada.split(':');
      
      const fechaHoraInicio = new Date(fechaSeleccionada);
      fechaHoraInicio.setHours(hora, minuto, 0, 0); // Establece la hora de inicio
      
      // Asume que las citas duran 30 minutos (ajusta si es necesario)
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + 30 * 60000);

      // Envía la nueva cita a la API
      await api.post('/citas/reservar', { 
        fechaHoraInicio: fechaHoraInicio.toISOString(),
        fechaHoraFin: fechaHoraFin.toISOString()
      });

      alert('¡Cita reservada con éxito!');
      navigate('/mi-cuenta'); // O a una página de "mis citas"

    } catch (error) {
      console.error("Error al reservar:", error);
      alert("Error al reservar la cita. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="container-reserva">
      <h2>Reserva tu Cita</h2>
      <p>Selecciona un día en el calendario para ver las horas disponibles.</p>
      
      <div className="reserva-layout">
        {/* Columna 1: El Calendario */}
        <div className="calendario-container">
          <Calendar
            onChange={setFechaSeleccionada} // Actualiza la fecha seleccionada
            value={fechaSeleccionada}
            minDate={new Date()} // No permite reservar en el pasado
          />
        </div>

        {/* Columna 2: Las Horas Disponibles */}
        <div className="horas-container">
          <h3>Horas disponibles para:</h3>
          <p>{fechaSeleccionada.toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          
          {cargandoHoras ? (
            <p>Cargando horas...</p>
          ) : (
            <div className="horas-grid">
              {HORARIOS_BASE.map(hora => {
                // Comprueba si la hora está en la lista de ocupadas
                const estaOcupada = horariosOcupados.includes(hora);
                const esSeleccionada = hora === horaSeleccionada;

                return (
                  <button 
                    key={hora}
                    className={`hora-boton ${esSeleccionada ? 'seleccionada' : ''}`}
                    disabled={estaOcupada}
                    onClick={() => setHoraSeleccionada(hora)}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          )}

          {/* Botón de Confirmar */}
          {horaSeleccionada && (
            <button 
              className="boton-primario" 
              style={{width: '100%', marginTop: '2rem'}}
              onClick={handleConfirmarReserva}
            >
              Confirmar reserva a las {horaSeleccionada}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservarCitaPage;