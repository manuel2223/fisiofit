// En cliente/src/pages/PacienteDetallePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import './PacienteDetallePage.css';

function PacienteDetallePage() {
  const { id } = useParams();
  
  const [paciente, setPaciente] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar datos
  const cargarDatos = async () => {
    try {
      const [resPaciente, resResultados, resRutinas] = await Promise.all([
        api.get(`/fisio/paciente/${id}`),
        api.get(`/fisio/paciente/${id}/resultados`),
        api.get(`/fisio/paciente/${id}/rutinas`)
      ]);
      
      setPaciente(resPaciente.data);
      setResultados(resResultados.data);
      setRutinas(resRutinas.data);

    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la ficha del paciente');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  // --- LÓGICA DE BORRADO (TOAST) ---

  // 1. Función que ejecuta el borrado real
  const borrarRutinaReal = async (rutinaId) => {
    const toastId = toast.loading('Eliminando rutina...');
    try {
      await api.delete(`/fisio/rutinas/${rutinaId}`);
      
      // Actualizamos la lista localmente
      setRutinas(current => current.filter(r => r.id !== rutinaId));
      
      toast.success('Rutina eliminada', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar la rutina', { id: toastId });
    }
  };

  // 2. Función que muestra la confirmación
  const handleDeleteRutina = (rutinaId) => {
    toast((t) => (
      <div className="toast-confirmacion">
        <p>¿Eliminar esta rutina permanentemente?</p>
        <div className="toast-botones">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              borrarRutinaReal(rutinaId);
            }}
            className="btn-toast-confirmar"
          >
            Sí, eliminar
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="btn-toast-cancelar"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 5000, style: { border: '1px solid #E53E3E', padding: '16px' } });
  };

  // --- RENDER ---

  if (cargando) return <div className="ficha-container"><h2>Cargando ficha...</h2></div>;
  if (!paciente) return <div className="ficha-container"><h2>Paciente no encontrado</h2></div>;

  return (
    <div className="ficha-container">
      {/* Cabecera */}
      <div className="ficha-header tarjeta">
        <div>
          <h2>{paciente.nombre}</h2>
          <p className="email-text">{paciente.email}</p>
        </div>
        <Link to={`/fisio/asignar/${paciente.id}`} className="boton-primario">
          + Asignar Nueva Rutina
        </Link>
      </div>

      {/* Rutinas Activas */}
      <div className="seccion-ficha">
        <h3>📋 Rutinas Activas</h3>
        
        <div className="grid-rutinas">
          {rutinas.length === 0 ? (
            <p style={{opacity: 0.6}}>No tiene rutinas asignadas actualmente.</p>
          ) : (
            rutinas.map(rutina => (
              <div key={rutina.id} className="tarjeta tarjeta-rutina-mini">
                <div className="rutina-header">
                  <h4>{rutina.nombre}</h4>
                  <button 
                    onClick={() => handleDeleteRutina(rutina.id)} 
                    className="boton-borrar-texto"
                    title="Eliminar Rutina"
                  >
                    Eliminar
                  </button>
                </div>
                
                <ul className="lista-ejercicios-mini">
                  {rutina.ejercicios && rutina.ejercicios.map(ej => (
                    <li key={ej.id}>
                      • {ej.nombreEjercicio} <span className="detalle-rep">({ej.series}x{ej.repeticiones})</span>
                    </li>
                  ))}
                </ul>
                <small className="fecha-creacion">
                  Asignada el: {new Date(rutina.createdAt).toLocaleDateString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '2rem 0'}} />

      {/* Historial de Feedback */}
      <div className="seccion-ficha">
        <h3>📊 Historial de Entrenamiento</h3>
        
        <div className="tabla-resultados-wrapper tarjeta">
          {resultados.length === 0 ? (
            <p style={{padding: '1rem', opacity: 0.7}}>Este paciente aún no ha registrado actividad.</p>
          ) : (
            <table className="tabla-resultados">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ejercicio</th>
                  <th>Dificultad</th>
                  <th>Dolor</th>
                  <th>Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map(res => (
                  <tr key={res.id}>
                    <td>
                      {new Date(res.fecha).toLocaleDateString()} <br/>
                      <small>{new Date(res.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
                    </td>
                    <td>
                      <strong>{res.Ejercicio ? res.Ejercicio.nombreEjercicio : 'Ejercicio Borrado'}</strong>
                    </td>
                    <td>
                      <span className={`tag-dificultad ${res.dificultad.replace(' ', '-').toLowerCase()}`}>
                        {res.dificultad}
                      </span>
                    </td>
                    <td>
                      {res.dolor ? (
                        <span className="tag-dolor si">SÍ ⚠️</span>
                      ) : (
                        <span className="tag-dolor no">No</span>
                      )}
                    </td>
                    <td className="col-comentarios">
                      {res.comentarios || <span style={{opacity:0.4}}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PacienteDetallePage;