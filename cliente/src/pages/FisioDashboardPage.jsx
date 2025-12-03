// En cliente/src/pages/FisioDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './FisioDashboardPage.css';

// Importaciones del Calendario
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Importación de los Gráficos (¡RESTOURADA!)
import DashboardStats from '../components/DashboardStats';

moment.locale('es');
const localizer = momentLocalizer(moment);

function FisioDashboardPage() {
  // --- Estados ---
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [stats, setStats] = useState(null); // Estado para los gráficos
  const [cargando, setCargando] = useState(true);
  
  // Estados del Calendario
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState(null); // Para el modal

  const navigate = useNavigate();

  // --- Carga de Datos ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargamos Pacientes, Citas y ESTADÍSTICAS
        const [resPacientes, resCitas, resStats] = await Promise.all([
          api.get('/fisio/pacientes'),
          api.get('/fisio/citas'),
          api.get('/fisio/stats')
        ]);

        setPacientes(resPacientes.data);
        setStats(resStats.data);

        // Formateamos las citas para el calendario
        const eventos = resCitas.data.map(cita => ({
          title: `${cita.paciente ? cita.paciente.nombre : '...'} (${cita.tipo})`,
          start: new Date(cita.fechaHoraInicio),
          end: new Date(cita.fechaHoraFin),
          datos: cita 
        }));
        setCitas(eventos);

      } catch (error) {
        console.error('Error al cargar datos del dashboard', error);
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  // --- Handlers ---
  const handleAsignarClick = (pacienteId) => {
    navigate(`/fisio/asignar/${pacienteId}`);
  };

  const handleSelectEvent = (evento) => {
    setCitaSeleccionada(evento.datos);
  };

  const cerrarModal = () => {
    setCitaSeleccionada(null);
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard del Fisioterapeuta</h2>
      
      {/* 1. COMPONENTE DE ESTADÍSTICAS (Restaurado) */}
      <DashboardStats stats={stats} cargando={cargando} />

      {/* 2. BOTONES DE GESTIÓN */}
      <div className="dashboard-actions tarjeta">
        <Link to="/fisio/biblioteca" className="boton-primario">
          📚 Biblioteca de Ejercicios
        </Link>
        <Link to="/fisio/horario" className="boton-secundario">
          📅 Configurar Horario
        </Link>
      </div>

      {/* 3. LAYOUT PRINCIPAL */}
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
                onSelectEvent={handleSelectEvent}
                eventPropGetter={() => ({ style: { cursor: 'pointer' } })}
              />
            )}
          </div>
        </div>

        {/* Columna 2: Lista de Pacientes */}
        <div className="columna-pacientes">
          <div className="dashboard-widget tarjeta">
            <h3>Mis Pacientes</h3>
            {cargando ? (
              <p>Cargando...</p> 
            ) : (
              <ul className="lista-pacientes">
                {pacientes.length > 0 ? (
                  pacientes.map(paciente => (
                    <li key={paciente.id}>
                      <div style={{display:'flex', flexDirection:'column'}}>
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
                        Asignar
                      </button>
                    </li>
                  ))
                ) : (
                  <p>No hay pacientes registrados.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODAL DE DETALLES DE CITA */}
      {citaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la Cita</h3>
              <button className="modal-cerrar" onClick={cerrarModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Paciente:</strong> {citaSeleccionada.paciente ? citaSeleccionada.paciente.nombre : 'Desconocido'}</p>
              <p><strong>Tipo:</strong> <span className="tag-tipo">{citaSeleccionada.tipo}</span></p>
              <hr />
              <p><strong>Fecha:</strong> {new Date(citaSeleccionada.fechaHoraInicio).toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date(citaSeleccionada.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <hr />
              <p><strong>Notas:</strong></p>
              <div className="caja-motivo">
                {citaSeleccionada.motivo || "Sin notas."}
              </div>
            </div>
            <div className="modal-footer">
              <button className="boton-secundario" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FisioDashboardPage;