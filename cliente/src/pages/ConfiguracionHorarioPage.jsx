import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import './ConfiguracionHorarioPage.css';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function ConfiguracionHorarioPage() {
  // Estado inicial actualizado
  const [horario, setHorario] = useState(
    DIAS.map((nombre, index) => ({
      diaSemana: index,
      nombreDia: nombre,
      horaInicio: '09:00',
      horaFin: '21:00', // Por defecto hasta las 21
      activo: index !== 0 && index !== 6,
      
      // Nuevos campos por defecto
      tieneDescanso: true,
      horaInicioDescanso: '14:00',
      horaFinDescanso: '17:00'
    }))
  );
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/fisio/horario');
        if (res.data.length > 0) {
          const nuevoHorario = horario.map(d => {
            const guardado = res.data.find(g => g.diaSemana === d.diaSemana);
            // Fusionamos datos, asegurando que los campos nuevos existan
            return guardado ? { 
              ...d, 
              ...guardado, 
              tieneDescanso: guardado.tieneDescanso ?? false 
            } : d;
          });
          setHorario(nuevoHorario);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar el horario.');
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const handleChange = (index, campo, valor) => {
    const nuevo = [...horario];
    nuevo[index][campo] = valor;
    setHorario(nuevo);
  };

  const guardar = async () => {
    const toastId = toast.loading('Guardando horario...');
    try {
      await api.post('/fisio/horario', { dias: horario });
      toast.success('Horario actualizado', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar', { id: toastId });
    }
  };

  if (cargando) return <div className="container-horario"><h3>Cargando...</h3></div>;

  return (
    <div className="container-horario">
      <h2>Configuración de Horario</h2>
      <p className="subtitulo">Define tu jornada laboral y tus descansos.</p>

      <div className="tarjeta horario-card">
        {horario.map((dia, index) => (
          <div key={dia.diaSemana} className={`fila-dia-compleja ${dia.activo ? 'activo' : 'inactivo'}`}>
            
            {/* 1. Cabecera del Día */}
            <div className="dia-header">
              <div className="nombre-dia">{dia.nombreDia}</div>
              <label className="switch-label">
                <input 
                  type="checkbox" 
                  checked={dia.activo} 
                  onChange={e => handleChange(index, 'activo', e.target.checked)}
                />
                <span className="estado-texto">{dia.activo ? 'Abierto' : 'Cerrado'}</span>
              </label>
            </div>

            {/* 2. Controles de Hora (Solo si está abierto) */}
            {dia.activo && (
              <div className="controles-hora">
                <div className="bloque-hora">
                  <span className="label-mini">Jornada:</span>
                  <input type="time" value={dia.horaInicio} onChange={e => handleChange(index, 'horaInicio', e.target.value)} />
                  <span> a </span>
                  <input type="time" value={dia.horaFin} onChange={e => handleChange(index, 'horaFin', e.target.value)} />
                </div>

                <div className="bloque-descanso">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={dia.tieneDescanso} 
                      onChange={e => handleChange(index, 'tieneDescanso', e.target.checked)}
                    />
                    Hacer Descanso
                  </label>
                  
                  {dia.tieneDescanso && (
                    <div className="inputs-descanso">
                      <input type="time" value={dia.horaInicioDescanso} onChange={e => handleChange(index, 'horaInicioDescanso', e.target.value)} />
                      <span> a </span>
                      <input type="time" value={dia.horaFinDescanso} onChange={e => handleChange(index, 'horaFinDescanso', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="footer-horario">
           <button className="boton-primario" onClick={guardar}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionHorarioPage;