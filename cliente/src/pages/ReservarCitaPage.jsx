// En cliente/src/pages/ReservarCitaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api';
import toast from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';
import './ReservarCitaPage.css';

const TIPOS_CITA = [
  'Valoración Inicial', 
  'Masaje Deportivo', 
  'Masaje Relajante', 
  'Rehabilitación', 
  'Punción Seca'
];

function ReservarCitaPage() {
  // --- ESTADOS ---
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  
  // 1. NUEVO: Estados para gestionar los fisios
  const [listaFisios, setListaFisios] = useState([]);
  const [fisioSeleccionado, setFisioSeleccionado] = useState(''); 

  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [tipoCita, setTipoCita] = useState('Masaje Deportivo');
  const [motivo, setMotivo] = useState('');

  const [cargandoHoras, setCargandoHoras] = useState(false);
  const navigate = useNavigate();

  // --- HELPERS ---
  const deshabilitarFinesDeSemana = ({ date, view }) => {
    if (view === 'month') {
      return date.getDay() === 0 || date.getDay() === 6;
    }
    return false;
  };

  // --- EFECTO 1: Cargar la lista de Fisios al entrar ---
  useEffect(() => {
    api.get('/auth/fisioterapeutas')
      .then(res => {
        setListaFisios(res.data);
        // Selecciona el primero por defecto para que cargue el calendario
        if (res.data.length > 0) {
          setFisioSeleccionado(res.data[0].id);
        }
      })
      .catch(err => console.error("Error cargando fisios", err));
  }, []);

  // --- EFECTO 2: Cargar Disponibilidad (Depende de Fecha Y Fisio) ---
  useEffect(() => {
    // Si no hay fisio seleccionado (aún cargando), no llamamos a la API
    if (!fisioSeleccionado) return;

    setHoraSeleccionada(null);
    setSlotsDisponibles([]); 
    setHorariosOcupados([]);
    setCargandoHoras(true);

    const anio = fechaSeleccionada.getFullYear();
    const mes = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const fechaFormatoAPI = `${anio}-${mes}-${dia}`;

    // 2. ¡AQUÍ ESTABA EL ERROR! Ahora enviamos el fisioId
    api.get(`/citas/disponibilidad/${fechaFormatoAPI}?fisioId=${fisioSeleccionado}`)
      .then(respuesta => {
        setSlotsDisponibles(respuesta.data.slots || []);
        setHorariosOcupados(respuesta.data.ocupadas || []);
      })
      .catch(error => {
        console.error("Error:", error);
        toast.error("No se pudo cargar el horario");
      })
      .finally(() => setCargandoHoras(false));

  }, [fechaSeleccionada, fisioSeleccionado]); // Se ejecuta si cambia la fecha O el fisio

  // --- HANDLERS ---
  const handleConfirmarReserva = async () => {
    if (!horaSeleccionada) {
      toast.error("Por favor, selecciona una hora.");
      return;
    }

    const toastId = toast.loading('Reservando cita...');

    try {
      const [hora, minuto] = horaSeleccionada.split(':');
      const fechaHoraInicio = new Date(fechaSeleccionada);
      fechaHoraInicio.setHours(hora, minuto, 0, 0);
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + 30 * 60000);

      // 3. Enviamos el fisioId también al reservar
      await api.post('/citas/reservar', { 
        fechaHoraInicio: fechaHoraInicio.toISOString(),
        fechaHoraFin: fechaHoraFin.toISOString(),
        tipo: tipoCita,
        motivo: motivo,
        fisioId: fisioSeleccionado 
      });

      toast.success('¡Cita reservada con éxito!', { id: toastId });
      navigate('/mi-cuenta'); 

    } catch (error) {
      console.error("Error reserva:", error);
      const msg = error.response?.data?.msg || "Error al reservar la cita.";
      toast.error(msg, { id: toastId });
    }
  };

  // --- RENDER ---
  return (
    <div className="container-reserva">
      <h2>Reserva tu Cita</h2>
      
      <div className="reserva-layout">
        {/* COLUMNA 1: CALENDARIO */}
        <div className="calendario-container">
          
          {/* 4. NUEVO: Selector de Profesional */}
          <div className="form-grupo" style={{marginBottom: '1.5rem'}}>
            <label style={{fontWeight:'bold', marginBottom:'0.5rem', display:'block'}}>Elige Profesional:</label>
            <select 
              value={fisioSeleccionado} 
              onChange={(e) => setFisioSeleccionado(e.target.value)}
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}}
            >
              {listaFisios.map(fisio => (
                <option key={fisio.id} value={fisio.id}>{fisio.nombre}</option>
              ))}
            </select>
          </div>

          <Calendar
            onChange={setFechaSeleccionada}
            value={fechaSeleccionada}
            minDate={new Date()} 
            tileDisabled={deshabilitarFinesDeSemana}
          />
        </div>

        {/* COLUMNA 2: DETALLES Y HORAS */}
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
          ) : slotsDisponibles.length === 0 ? (
            <div className="estado-vacio">
              <p>😴 No hay horas disponibles para este día.</p>
            </div>
          ) : (
            <div className="horas-grid">
              {slotsDisponibles.map(hora => {
                const [h, m] = hora.split(':');
                const fechaSlot = new Date(fechaSeleccionada);
                fechaSlot.setHours(h, m, 0, 0);
                
                const ahora = new Date();
                const yaPaso = fechaSlot < ahora;
                const estaOcupada = horariosOcupados.includes(hora);
                const deshabilitado = estaOcupada || yaPaso;
                const esSeleccionada = hora === horaSeleccionada;

                let titulo = "";
                if (yaPaso) titulo = "Esta hora ya ha pasado";
                else if (estaOcupada) titulo = "Hora ya reservada";

                return (
                  <button 
                    key={hora}
                    className={`hora-boton ${esSeleccionada ? 'seleccionada' : ''}`}
                    disabled={deshabilitado}
                    onClick={() => setHoraSeleccionada(hora)}
                    title={titulo}
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