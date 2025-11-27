// En cliente/src/pages/FisioDashboardPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './FisioDashboardPage.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardStats from '../components/DashboardStats'; // 1. Importar

// IMPORTA TU HOOK (Si usaste el refactor de hooks, úsalo. Si no, aquí tienes la versión completa sin hook para asegurar que funcione con lo que tenías)
import api from '../api'; // Asegúrate de importar api si no usas el hook
// Si usabas el hook useFisioDashboard, mantenlo.
// Para este ejemplo, usaré la lógica directa para que sea copiar y pegar sobre lo último que funcionaba.

moment.locale('es');
const localizer = momentLocalizer(moment);

function FisioDashboardPage() {
  // --- Estados ---
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [stats, setStats] = useState(null); // 2. Nuevo estado
  
  // 1. NUEVO ESTADO: La cita seleccionada para el Modal
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const navigate = useNavigate();

  // --- Carga de Datos ---
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resPacientes, resCitas, resStats] = await Promise.all([
          api.get('/fisio/pacientes'),
          api.get('/fisio/citas'),
          api.get('/fisio/stats')
        ]);

        setPacientes(resPacientes.data);

        // 2. MODIFICACIÓN: Guardamos TODOS los datos en el evento
        const eventos = resCitas.data.map(cita => ({
          title: `${cita.paciente ? cita.paciente.nombre : '...'} `, // Título más descriptivo
          start: new Date(cita.fechaHoraInicio),
          end: new Date(cita.fechaHoraFin),
          // Guardamos el objeto cita completo en una propiedad 'datos'
          datos: cita 
        }));
        setCitas(eventos);

        setStats(resStats.data); // 4. Guardar stats

      } catch (error) {
        console.error('Error al cargar datos', error);
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const handleAsignarClick = (pacienteId) => {
    navigate(`/fisio/asignar/${pacienteId}`);
  };

  // 3. NUEVO HANDLER: Al hacer clic en un evento del calendario
  const handleSelectEvent = (evento) => {
    setCitaSeleccionada(evento.datos); // Guardamos los datos de la cita clicada
  };

  // 4. NUEVO HANDLER: Cerrar el modal
  const cerrarModal = () => {
    setCitaSeleccionada(null);
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard del Fisioterapeuta</h2>

      
      <DashboardStats stats={stats} cargando={cargando} />
      
      
      <div className="tarjeta" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <Link to="/fisio/biblioteca" className="boton-primario" style={{width: '100%', textAlign: 'center'}}>
          Gestionar mi Biblioteca de Ejercicios
        </Link>
      </div>

      <div className="dashboard-layout">
        {/* Columna 1: Calendario */}
        <div className="columna-calendario">
          <div className="dashboard-widget tarjeta" style={{ height: '600px' }}>
            <h3>Calendario de Citas</h3>
            {cargando ? <p>Cargando...</p> : (
              <Calendar
                localizer={localizer}
                events={citas}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                messages={{
                  next: "Siguiente", previous: "Anterior", today: "Hoy",
                  month: "Mes", week: "Semana", day: "Día"
                }}
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                // 5. CONECTAMOS EL EVENTO DE CLIC
                onSelectEvent={handleSelectEvent}
                // Opcional: cambiar el cursor para indicar que es clickable
                eventPropGetter={() => ({ style: { cursor: 'pointer' } })}
              />
            )}
          </div>
        </div>

        {/* Columna 2: Pacientes */}
        <div className="columna-pacientes">
          <div className="dashboard-widget tarjeta">
            <h3>Mis Pacientes</h3>
            {/* ... (Tu lista de pacientes se queda igual) ... */}
             <ul className="lista-pacientes">
              {pacientes.map(paciente => (
                <li key={paciente.id}>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    {/* ENLACE A LA FICHA */}
                    <Link 
                      to={`/fisio/paciente/${paciente.id}`} 
                      className="nombre" 
                      style={{textDecoration:'none', color:'inherit', cursor:'pointer'}}
                    >
                      {paciente.nombre}
                    </Link>
                    <span className="email">{paciente.email}</span>
                  </div>
                  
                  <button onClick={() => handleAsignarClick(paciente.id)} className="boton-asignar">
                    Asignar Rutina
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* --- 6. EL MODAL (VENTANA EMERGENTE) --- */}
      {citaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la Cita</h3>
              <button className="modal-cerrar" onClick={cerrarModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <p><strong>Paciente:</strong> {citaSeleccionada.paciente ? citaSeleccionada.paciente.nombre : 'Desconocido'}</p>
              <p><strong>Tipo de Sesión:</strong> <span className="tag-tipo">{citaSeleccionada.tipo}</span></p>
              
              <hr />
              
              <p><strong>Fecha:</strong> {new Date(citaSeleccionada.fechaHoraInicio).toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date(citaSeleccionada.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(citaSeleccionada.fechaHoraFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              
              <hr />
              
              <p><strong>Motivo / Notas:</strong></p>
              <div className="caja-motivo">
                {citaSeleccionada.motivo || "No se especificó ningún motivo."}
              </div>
            </div>

            <div className="modal-footer">
              <button className="boton-secundario" onClick={cerrarModal}>Cerrar</button>
              {/* Aquí podrías poner un botón para ir a la ficha del paciente si quisieras */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FisioDashboardPage;