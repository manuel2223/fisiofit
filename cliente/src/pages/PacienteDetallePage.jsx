// En cliente/src/pages/PacienteDetallePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import './PacienteDetallePage.css'; // Crearemos este CSS

function PacienteDetallePage() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resPaciente, resResultados] = await Promise.all([
          api.get(`/fisio/paciente/${id}`),
          api.get(`/fisio/paciente/${id}/resultados`)
        ]);
        
        setPaciente(resPaciente.data);
        setResultados(resResultados.data);
      } catch (err) {
        console.error(err);
      }
      setCargando(false);
    };
    cargarDatos();
  }, [id]);

  if (cargando) return <div className="ficha-container"><h2>Cargando ficha...</h2></div>;
  if (!paciente) return <div className="ficha-container"><h2>Paciente no encontrado</h2></div>;

  return (
    <div className="ficha-container">
      {/* Cabecera de la Ficha */}
      <div className="ficha-header tarjeta">
        <div>
          <h2>{paciente.nombre}</h2>
          <p className="email-text">{paciente.email}</p>
        </div>
        <Link to={`/fisio/asignar/${paciente.id}`} className="boton-primario">
          + Asignar Nueva Rutina
        </Link>
      </div>

      {/* Historial de Feedback */}
      <div className="seccion-historial">
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