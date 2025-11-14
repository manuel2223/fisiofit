// En cliente/src/pages/FisioDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. AÑADE Link
import api from '../api';
import './FisioDashboardPage.css';

// 1. IMPORTACIONES PARA EL CALENDARIO
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es'; // Para poner el calendario en español
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 2. CONFIGURACIÓN DEL CALENDARIO
moment.locale('es'); // Configura 'moment' en español
const localizer = momentLocalizer(moment); // Crea el localizador

function FisioDashboardPage() {
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]); // 3. Estado para las citas
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
const [view, setView] = useState('month'); // Vista inicial 'mes'
const [date, setDate] = useState(new Date()); // Estado para la FECHA

  // 4. Modifica el useEffect para cargar AMBAS cosas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Carga pacientes
        const resPacientes = await api.get('/fisio/pacientes');
        setPacientes(resPacientes.data);
        
        // Carga citas
        const resCitas = await api.get('/fisio/citas');
        
        // 5. Transforma los datos de la API al formato de react-big-calendar
        const eventos = resCitas.data.map(cita => ({
          title: `Cita: ${cita.paciente.nombre}`, // Título del evento
          start: new Date(cita.fechaHoraInicio), // Fecha de inicio
          end: new Date(cita.fechaHoraFin),       // Fecha de fin
          resource: cita.id // Guarda el ID por si acaso
        }));
        setCitas(eventos);

      } catch (error) {
        console.error('Error al cargar datos del dashboard', error);
      }
      setCargando(false);
    };

    cargarDatos();
  }, []);

  // ... (tu función handleAsignarClick se queda igual) ...
  const handleAsignarClick = (pacienteId) => {
    navigate(`/fisio/asignar/${pacienteId}`);
  };

    return (

      
    <div className="dashboard-container">
      <h2>Dashboard del Fisioterapeuta</h2>
      
      <div className="tarjeta" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <Link to="/fisio/biblioteca" className="boton-primario" style={{width: '100%', textAlign: 'center'}}>
          Gestionar mi Biblioteca de Ejercicios
        </Link>
      </div>
      <div className="dashboard-layout">
        {/* Columna 1 */}
        <div className="columna-calendario">
          <div className="dashboard-widget tarjeta" style={{ height: '600px' }}>
            <h3>Calendario de Citas</h3>
             {cargando ? (
          <p>Cargando calendario...</p>
        ) : (
          <Calendar
            localizer={localizer}
            events={citas}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            messages={{ // Opcional: traducir botones
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día"
            }}
            views={['month', 'week', 'day', 'agenda']}
            view={view} 
                
                // Le dice al calendario cómo cambiar la vista (actualiza el estado)
                onView={newView => setView(newView)}

                date={date}
                
                // Le dice al calendario cómo cambiar la FECHA (al pulsar Siguiente/Anterior/Hoy)
                onNavigate={newDate => setDate(newDate)}
          />
        )}
          </div>
        </div>

        {/* Columna 2 */}
        <div className="columna-pacientes">
          <div className="dashboard-widget tarjeta">
            <h3>Mis Pacientes</h3>
            {cargando ? (
          <p>Cargando pacientes...</p>
        ) : (
          <ul className="lista-pacientes">
            {pacientes.length > 0 ? (
              pacientes.map(paciente => (
                <li key={paciente.id}>
                  <span className="nombre">{paciente.nombre}</span>
                  <span className="email">{paciente.email}</span>
                  <button 
                    onClick={() => handleAsignarClick(paciente.id)} 
                    className="boton-asignar"
                  >
                    Asignar Rutina
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
    </div>
  );
}





// En FisioDashboardPage.jsx, dentro del return:

export default FisioDashboardPage;