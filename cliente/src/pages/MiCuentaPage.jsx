// En cliente/src/pages/MiCuentaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './MiCuentaPage.css'; // Mantenemos el mismo CSS (y añadiremos más)

function MiCuentaPage() {

  
  const { logout } = useAuth();
  const navigate = useNavigate();

  // --- Estados para el Formulario de Edición ---
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  
  // --- Estados para los Datos ---
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(''); // Mensaje de éxito

  // 1. Al cargar, busca AMBOS datos (usuario y citas)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resUsuario, resCitas] = await Promise.all([
          api.get('/auth/me'), // Datos del usuario
          api.get('/citas/mis-citas') // Lista de citas
        ]);

        // Rellena el formulario
        setNombre(resUsuario.data.nombre);
        setEmail(resUsuario.data.email);
        
        // Carga la lista de citas
        setCitas(resCitas.data);

      } catch (err) {
        console.error('Error al cargar datos de la cuenta', err);
        setError('No se pudieron cargar los datos.');
      }
      setCargando(false);
    };
    cargarDatos();
  }, []); // [] = ejecutar solo una vez

  // 2. Función para manejar la actualización de datos
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (password && password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const datosActualizados = { nombre, email };
      if (password) {
        datosActualizados.password = password; // Solo envía la pass si se ha escrito
      }

      const respuesta = await api.put('/auth/me', datosActualizados);
      
      setExito(respuesta.data.msg);
      setPassword(''); // Limpia los campos de contraseña
      setPassword2('');
      
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al actualizar los datos.');
    }
  };

  // 3. Función para manejar el logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 4. NUEVA FUNCIÓN: Manejar la cancelación de cita
  const handleCancelarCita = async (citaId) => {
    // Pedir confirmación
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return;
    }

    setError('');
    setExito('');

    try {
      // Llama a la nueva ruta DELETE
      await api.delete(`/citas/${citaId}`);
      
      // ¡ÉXITO! Actualiza la UI al instante (mejor que recargar la página)
      // Filtra la cita cancelada fuera del estado 'citas'
      setCitas(citasActuales => 
        citasActuales.filter(cita => cita.id !== citaId)
      );
      
      setExito('Cita cancelada correctamente.'); // Muestra feedback

    } catch (err) {
      console.error('Error al cancelar cita:', err);
      setError(err.response?.data?.msg || 'No se pudo cancelar la cita.');
    }
  };

  if (cargando) {
    return <div className="mi-cuenta-container"><h2>Cargando...</h2></div>;
  }

  return (
    <div className="mi-cuenta-container">
      {/* --- COLUMNA 1: EDITAR DATOS --- */}
      <div className="mi-cuenta-tarjeta tarjeta">
        <h2>Editar Mis Datos</h2>
        
        <form onSubmit={handleUpdate}>
          {error && <p className="error-mensaje">{error}</p>}
          {exito && <p className="exito-mensaje">{exito}</p>}

          <div className="form-grupo">
            <label htmlFor="nombre">Nombre</label>
            <input type="text" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div className="form-grupo">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <hr />
          <p>Cambiar contraseña (dejar en blanco para no cambiar)</p>
          <div className="form-grupo">
            <label htmlFor="password">Nueva Contraseña</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-grupo">
            <label htmlFor="password2">Confirmar Nueva Contraseña</label>
            <input type="password" id="password2" value={password2} onChange={e => setPassword2(e.target.value)} />
          </div>
          
          <button type="submit" className="boton-primario" style={{width: '100%'}}>Guardar Cambios</button>
        </form>

        <button onClick={handleLogout} className="boton-logout">
          Cerrar Sesión
        </button>
      </div>

      {/* --- COLUMNA 2: MIS CITAS --- */}
      <div className="mis-citas-tarjeta tarjeta">
        <h2>Mis Citas</h2>
        {error && <p className="error-mensaje">{error}</p>}
        {exito && <p className="exito-mensaje">{exito}</p>}

        {/* --- CÓDIGO CORREGIDO --- */}
        {cargando ? (
          <p>Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p>Aún no tienes ninguna cita reservada.</p>
        ) : (
          <ul className="lista-citas">
            {citas.map(cita => (
              <li key={cita.id} className="cita-item">
                <span className="cita-fecha">
                  {new Date(cita.fechaHoraInicio).toLocaleDateString('es-ES', { 
                    weekday: 'long', day: 'numeric', month: 'long' 
                  })}
                </span>
                <span className="cita-hora">
                  {new Date(cita.fechaHoraInicio).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
                <span className="cita-fisio">
                  Con: {cita.fisioterapeuta ? cita.fisioterapeuta.nombre : 'Fisio'}
                </span>
                <span className={`cita-estado ${cita.estado}`}>{cita.estado}</span>

                {/* --- ¡EL BOTÓN VA AQUÍ DENTRO! --- */}
                <button 
                  onClick={() => handleCancelarCita(cita.id)} 
                  className="boton-cancelar-cita"
                >
                  Cancelar Cita
                </button>
              </li> // <-- El <li> se cierra DESPUÉS del botón
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MiCuentaPage;