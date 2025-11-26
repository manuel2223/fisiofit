// En cliente/src/pages/ReservarCitaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api';
import toast from 'react-hot-toast'; // 1. IMPORTAR TOAST
import 'react-calendar/dist/Calendar.css';
import './ReservarCitaPage.css';

const HORARIOS_BASE = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

const TIPOS_CITA = [
  'Valoración Inicial', 
  'Masaje Deportivo', 
  'Masaje Relajante', 
  'Rehabilitación', 
  'Punción Seca'
];

function ReservarCitaPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  
  const [tipoCita, setTipoCita] = useState('Masaje Deportivo');
  const [motivo, setMotivo] = useState('');

  const navigate = useNavigate();

  const deshabilitarFinesDeSemana = ({ date, view }) => {
    if (view === 'month') {
      return date.getDay() === 0 || date.getDay() === 6;
    }
    return false;
  };

  useEffect(() => {
    setHoraSeleccionada(null);
    setCargandoHoras(true);

    const anio = fechaSeleccionada.getFullYear();
    const mes = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const fechaFormatoAPI = `${anio}-${mes}-${dia}`;

    api.get(`/citas/disponibilidad/${fechaFormatoAPI}`)
      .then(respuesta => {
        setHorariosOcupados(respuesta.data);
      })
      .catch(error => {
        console.error("Error:", error);
        toast.error("No se pudieron cargar los horarios"); // Toast de error
      })
      .finally(() => setCargandoHoras(false));

  }, [fechaSeleccionada]);

  const handleConfirmarReserva = async () => {
    // Validaciones con Toast
    if (!horaSeleccionada) {
      toast.error("Por favor, selecciona una hora.");
      return;
    }
    if (!tipoCita) {
      toast.error("Por favor, selecciona un tipo de cita.");
      return;
    }

    // Toast de carga
    const toastId = toast.loading('Reservando cita...');

    try {
      const [hora, minuto] = horaSeleccionada.split(':');
      const fechaHoraInicio = new Date(fechaSeleccionada);
      fechaHoraInicio.setHours(hora, minuto, 0, 0);
      
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + 50 * 60000);

      await api.post('/citas/reservar', { 
        fechaHoraInicio: fechaHoraInicio.toISOString(),
        fechaHoraFin: fechaHoraFin.toISOString(),
        tipo: tipoCita,
        motivo: motivo
      });

      // Éxito
      toast.success('¡Cita reservada con éxito!', { id: toastId });
      navigate('/mi-cuenta'); 

    } catch (error) {
      console.error("Error al reservar:", error);
      // Error
      const msg = error.response?.data?.msg || "Error al reservar la cita.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="container-reserva">
      <h2>Reserva tu Cita</h2>
      
      <div className="reserva-layout">
        <div className="calendario-container">
          <Calendar
            onChange={setFechaSeleccionada}
            value={fechaSeleccionada}
            minDate={new Date()} 
            tileDisabled={deshabilitarFinesDeSemana}
          />
        </div>

        <div className="horas-container">
          <h3>Detalles de la Cita</h3>
          <p className="fecha-texto">
            {fechaSeleccionada.toLocaleDateString('es-ES', { dateStyle: 'long' })}
          </p>
          
          <div className="form-reserva-extra">
            <div className="form-grupo">
              <label>Tipo de Sesión:</label>
              <select value={tipoCita} onChange={e => setTipoCita(e.target.value)}>
                {TIPOS_CITA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-grupo">
              <label>Motivo / Notas (Opcional):</label>
              <textarea 
                rows="3"
                value={motivo} 
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: Me duele la espalda baja..."
              ></textarea>
            </div>
          </div>

          <h3>Horas Disponibles</h3>
          {cargandoHoras ? (
            <div className="skeleton skeleton-box" style={{height: '100px'}}></div>
          ) : (
            <div className="horas-grid">
              {HORARIOS_BASE.map(hora => {
                const [h, m] = hora.split(':');
                const fechaSlot = new Date(fechaSeleccionada);
                fechaSlot.setHours(h, m, 0, 0);
                const ahora = new Date();
                const yaPaso = fechaSlot < ahora;
                const estaOcupada = horariosOcupados.includes(hora);
                const diaSemana = fechaSeleccionada.getDay();
                const esFinDeSemana = diaSemana === 0 || diaSemana === 6; // 0=Dom, 6=Sab

                // 3. Añadimos la condición al deshabilitado
                const deshabilitado = estaOcupada || yaPaso || esFinDeSemana;
                const esSeleccionada = hora === horaSeleccionada;

                let mensajeTitulo = "";
                if (esFinDeSemana) mensajeTitulo = "La clínica cierra los fines de semana";
                else if (yaPaso) mensajeTitulo = "Esta hora ya ha pasado";
                else if (estaOcupada) mensajeTitulo = "Hora ocupada";

                return (
                  <button 
                    key={hora}
                    className={`hora-boton ${esSeleccionada ? 'seleccionada' : ''}`}
                    disabled={deshabilitado}
                    onClick={() => setHoraSeleccionada(hora)}
                    title={mensajeTitulo} 
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          )}

          {horaSeleccionada && (
            <button 
              className="boton-primario" 
              style={{width: '100%', marginTop: '2rem'}}
              onClick={handleConfirmarReserva}
            >
              Confirmar Cita ({horaSeleccionada})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservarCitaPage;