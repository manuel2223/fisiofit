import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import './MiCuentaPage.css';

function MiCuentaPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para errores 
  const [erroresCampos, setErroresCampos] = useState({});

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resUsuario, resCitas] = await Promise.all([
          api.get('/auth/me'),
          api.get('/citas/mis-citas')
        ]);

        setNombre(resUsuario.data.nombre);
        setEmail(resUsuario.data.email);
        setCitas(resCitas.data);

      } catch (err) {
        console.error(err);
        toast.error('Error al cargar los datos de tu cuenta');
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErroresCampos({}); 

    // validación
    const nuevosErrores = {};
    let hayError = false;

    // Validar campos obligatorios
    if (!nombre.trim()) {
      nuevosErrores.nombre = true;
      hayError = true;
    }
    if (!email.trim()) {
      nuevosErrores.email = true;
      hayError = true;
    }

    // Validar contraseñas 
    if (password) {
      if (password !== password2) {
        nuevosErrores.password = true;
        nuevosErrores.password2 = true;
        toast.error('Las contraseñas no coinciden.'); 
        hayError = true;
      } else if (password.length < 6) {
        nuevosErrores.password = true;
        toast.error('La contraseña debe tener al menos 6 caracteres.');
        hayError = true;
      }
    }

    if (hayError) {
      setErroresCampos(nuevosErrores);
      if (!nuevosErrores.password) {
        toast.error('Por favor, revisa los campos marcados en rojo.');
      }
      return;
    }

    const toastId = toast.loading('Actualizando perfil...');

    try {
      const datosActualizados = { nombre, email };
      if (password) {
        datosActualizados.password = password;
      }

      await api.put('/auth/me', datosActualizados);
      
      toast.success('Perfil actualizado correctamente', { id: toastId });
      setPassword('');
      setPassword2('');
      
    } catch (err) {
      const msg = err.response?.data?.msg || 'Error al actualizar.';
      toast.error(msg, { id: toastId });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const confirmarCancelacion = async (citaId) => {
    const toastId = toast.loading('Cancelando cita...');
    try {
      await api.delete(`/citas/${citaId}`);
      setCitas(citasActuales => citasActuales.filter(cita => cita.id !== citaId));
      toast.success('Cita cancelada correctamente', { id: toastId });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || 'No se pudo cancelar la cita.';
      toast.error(msg, { id: toastId });
    }
  };

  const handleCancelarCita = (citaId) => {
    toast((t) => (
      <div className="toast-confirmacion">
        <p>¿Seguro que quieres cancelar esta cita?</p>
        <div className="toast-botones">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              confirmarCancelacion(citaId);
            }}
            className="btn-toast-confirmar"
          >
            Sí, cancelar
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="btn-toast-cancelar"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000, style: { border: '1px solid #E53E3E', padding: '16px' } });
  };

  if (cargando) {
    return <div className="mi-cuenta-container"><h2>Cargando...</h2></div>;
  }

  return (
    <div className="mi-cuenta-container">
      
      <div className="mi-cuenta-tarjeta tarjeta">
        <h2>Editar Mis Datos</h2>
        
        <form onSubmit={handleUpdate}>
          <div className="form-grupo">
            <label htmlFor="nombre">Nombre</label>
            <input 
              type="text" 
              id="nombre" 
              value={nombre} 
              className={erroresCampos.nombre ? 'input-error' : ''}
              onChange={e => {
                setNombre(e.target.value);
                if(erroresCampos.nombre) setErroresCampos({...erroresCampos, nombre: false});
              }} 
              
            />
          </div>
          <div className="form-grupo">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              className={erroresCampos.email ? 'input-error' : ''}
              onChange={e => {
                setEmail(e.target.value);
                if(erroresCampos.email) setErroresCampos({...erroresCampos, email: false});
              }} 
            />
          </div>

          <hr />
          <p>Cambiar contraseña (dejar en blanco para no cambiar)</p>
          <div className="form-grupo">
            <label htmlFor="password">Nueva Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              className={erroresCampos.password ? 'input-error' : ''}
              onChange={e => {
                setPassword(e.target.value);
                if(erroresCampos.password) setErroresCampos({...erroresCampos, password: false, password2: false});
              }} 
            />
          </div>
          <div className="form-grupo">
            <label htmlFor="password2">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              id="password2" 
              value={password2} 
              className={erroresCampos.password2 ? 'input-error' : ''}
              onChange={e => {
                setPassword2(e.target.value);
                if(erroresCampos.password2) setErroresCampos({...erroresCampos, password2: false});
              }} 
            />
          </div>
          
          <button type="submit" className="boton-primario" style={{width: '100%'}}>Guardar Cambios</button>
        </form>

        <button onClick={handleLogout} className="boton-logout">
          Cerrar Sesión
        </button>
      </div>

      
      <div className="mis-citas-tarjeta tarjeta">
        <h2>Mis Citas</h2>
        {citas.length === 0 ? (
          <div style={{textAlign: 'center', padding: '2rem', opacity: 0.7}}>
            <p>No tienes citas pendientes.</p>
            <button className="boton-secundario" onClick={() => navigate('/reservar')} style={{marginTop: '1rem'}}>
              Reservar una ahora
            </button>
          </div>
        ) : (
          <ul className="lista-citas">
            {citas.map(cita => (
              <li key={cita.id} className="cita-item">
                <span className="cita-fecha">
                  {new Date(cita.fechaHoraInicio).toLocaleDateString('es-ES', { 
                    weekday: 'long', day: 'numeric', month: 'long' , year: 'numeric'
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

                <button 
                  onClick={() => handleCancelarCita(cita.id)} 
                  className="boton-cancelar-cita"
                >
                  Cancelar Cita
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MiCuentaPage;