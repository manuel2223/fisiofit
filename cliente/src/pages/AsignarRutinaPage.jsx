// En cliente/src/pages/AsignarRutinaPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './AsignarRutinaPage.css'; // Vamos a reescribir este CSS

function AsignarRutinaPage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  // --- Estados de Carga ---
  const [paciente, setPaciente] = useState(null);
  const [biblioteca, setBiblioteca] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // --- Estados del Constructor ---
  const [nombreRutina, setNombreRutina] = useState('');
  // Este es el array de la Columna Derecha (la rutina que estamos construyendo)
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]); 
  
  // --- Estados de los Filtros (Columna Izquierda) ---
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' o un ID de categoría
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Carga todos los datos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resPaciente, resBiblioteca, resCategorias] = await Promise.all([
          api.get(`/fisio/paciente/${pacienteId}`),
          api.get('/fisio/biblioteca'),
          api.get('/fisio/categorias')
        ]);
        setPaciente(resPaciente.data);
        setBiblioteca(resBiblioteca.data);
        setCategorias(resCategorias.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos.');
      }
      setCargando(false);
    };
    cargarDatos();
  }, [pacienteId]);
  
  // 2. Lógica de Filtro (Columna Izquierda)
  const bibliotecaFiltrada = useMemo(() => {
    return biblioteca
      // Filtro por Categoría
      .filter(ej => {
        if (selectedCategory === 'all') return true;
        return ej.categoriaId === selectedCategory;
      })
      // Filtro por Búsqueda (nombre o descripción)
      .filter(ej => 
        ej.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ej.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [biblioteca, selectedCategory, searchQuery]);

  // 3. Lógica del Constructor (Añadir/Quitar/Modificar)

  // Añade un ejercicio de la biblioteca (Col Izq) a la rutina (Col Der)
  const addEjercicioToRutina = (ejercicioDeBiblioteca) => {
    setEjerciciosRutina([
      ...ejerciciosRutina,
      {
        // Copia los datos de la biblioteca
        nombreEjercicio: ejercicioDeBiblioteca.nombre,
        videoUrl: ejercicioDeBiblioteca.videoUrl || '',
        // Y añade los campos de la rutina
        series: 3, // Valor por defecto
        repeticiones: 10 // Valor por defecto
      }
    ]);
  };

  // Quita un ejercicio de la rutina (Col Der)
  const removeEjercicioFromRutina = (index) => {
    const nuevosEjercicios = [...ejerciciosRutina];
    nuevosEjercicios.splice(index, 1);
    setEjerciciosRutina(nuevosEjercicios);
  };

  // Actualiza las series/reps de un ejercicio en la rutina (Col Der)
  const handleRutinaEjercicioChange = (index, e) => {
    const { name, value } = e.target;
    const nuevosEjercicios = [...ejerciciosRutina];
    nuevosEjercicios[index][name] = value;
    setEjerciciosRutina(nuevosEjercicios);
  };

  // 4. Envío del Formulario (sin cambios en la lógica)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombreRutina || ejerciciosRutina.length === 0) {
      setError('La rutina debe tener un nombre y al menos un ejercicio.');
      return;
    }
    try {
      await api.post('/fisio/rutinas', {
        pacienteId: paciente.id,
        nombreRutina,
        ejercicios: ejerciciosRutina // Envía el array de la Columna Derecha
      });
      alert('¡Rutina asignada exitosamente!');
      navigate('/fisio/dashboard');
    } catch (err) {
      console.error(err);
      setError('Error al asignar la rutina.');
    }
  };


  if (cargando) return <div>Cargando...</div>;
  if (error && !paciente) return <div style={{color: 'red'}}>{error}</div>;

  return (
    <div className="constructor-container">
      <form onSubmit={handleSubmit} className="tarjeta">
        <h2>Asignar Rutina a: {paciente?.nombre}</h2>
        {error && <p className="error-mensaje">{error}</p>}
        
        <div className="form-grupo">
          <label htmlFor="nombreRutina">Nombre de la Rutina</label>
          <input
            type="text"
            id="nombreRutina"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            required
          />
        </div>

        <hr />

        {/* --- 5. EL CONSTRUCTOR DE DOS COLUMNAS --- */}
        <div className="constructor-layout">
          
          {/* --- Columna Izquierda (Biblioteca) --- */}
          <div className="constructor-biblioteca">
            <h4>Biblioteca de Ejercicios</h4>
            
            {/* Filtros de Categoría */}
            <div className="filtros-categoria">
              <button 
                type="button" 
                className={selectedCategory === 'all' ? 'activo' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </button>
              {categorias.map(cat => (
                <button 
                  type="button"
                  key={cat.id}
                  className={selectedCategory === cat.id ? 'activo' : ''}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Barra de Búsqueda */}
            <div className="form-grupo">
              <input 
                type="text" 
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Lista Filtrada */}
            <ul className="lista-biblioteca-picker">
              {bibliotecaFiltrada.map(ej => (
                <li key={ej.id}>
                  <span>{ej.nombre}</span>
                  <button type="button" onClick={() => addEjercicioToRutina(ej)}>+</button>
                </li>
              ))}
            </ul>
          </div>

          {/* --- Columna Derecha (Rutina) --- */}
          <div className="constructor-rutina">
            <h4>Ejercicios de esta Rutina</h4>
            
            <ul className="lista-rutina-builder">
              {ejerciciosRutina.map((ej, index) => (
                <li key={index} className="ejercicio-bloque">
                  <strong>{ej.nombreEjercicio}</strong>
                  <div className="grupo-horizontal">
                    <div className="form-grupo">
                      <label>Series</label>
                      <input 
                        type="number" 
                        name="series" 
                        value={ej.series} 
                        onChange={e => handleRutinaEjercicioChange(index, e)} 
                      />
                    </div>
                    <div className="form-grupo">
                      <label>Reps</label>
                      <input 
                        type="number" 
                        name="repeticiones" 
                        value={ej.repeticiones} 
                        onChange={e => handleRutinaEjercicioChange(index, e)} 
                      />
                    </div>
                  </div>
                  <button type="button" className="boton-quitar-mini" onClick={() => removeEjercicioFromRutina(index)}>
                    Quitar
                  </button>
                </li>
              ))}
              {ejerciciosRutina.length === 0 && (
                <p style={{textAlign: 'center', opacity: 0.7}}>Añade ejercicios desde la biblioteca</p>
              )}
            </ul>
          </div>
        </div>
        
        {/* Botón de Enviar */}
        <button type="submit" className="boton-primario" style={{width: '100%', marginTop: '2rem'}}>
          Asignar Rutina Completa
        </button>
      </form>
    </div>
  );
}

export default AsignarRutinaPage;