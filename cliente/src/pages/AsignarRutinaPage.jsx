import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import './AsignarRutinaPage.css';

function AsignarRutinaPage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  // Estados de Carga 
  const [paciente, setPaciente] = useState(null);
  const [biblioteca, setBiblioteca] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Constructor 
  const [nombreRutina, setNombreRutina] = useState('');
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]); 
  
  // Estado para validación visual 
  const [erroresCampos, setErroresCampos] = useState({}); 

  // Estados de los Filtros 
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Carga todos los datos al iniciar
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
        toast.error('Error al cargar los datos iniciales.');
      }
      setCargando(false);
    };
    cargarDatos();
  }, [pacienteId]);

  // Lógica de Filtro
  const bibliotecaFiltrada = useMemo(() => {
    if (!Array.isArray(biblioteca)) return []; 
    
    return biblioteca
      .filter(ej => {
        if (selectedCategory === 'all') return true;
        return ej.categoriaId === selectedCategory;
      })
      .filter(ej => 
        ej.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ej.descripcion && ej.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [biblioteca, selectedCategory, searchQuery]);

  // Lógica del Constructor
  const addEjercicioToRutina = (ejercicioDeBiblioteca) => {
    setEjerciciosRutina([
      ...ejerciciosRutina,
      {
        nombreEjercicio: ejercicioDeBiblioteca.nombre,
        videoUrl: ejercicioDeBiblioteca.videoUrl || '',
        reglasPostura: ejercicioDeBiblioteca.reglasPostura || null,
        series: 3, 
        repeticiones: 10
      }
    ]);
    toast.success('Ejercicio añadido', { duration: 1000 });
  };

  const removeEjercicioFromRutina = (index) => {
    const nuevosEjercicios = [...ejerciciosRutina];
    nuevosEjercicios.splice(index, 1);
    setEjerciciosRutina(nuevosEjercicios);
  };

  const handleRutinaEjercicioChange = (index, e) => {
    const { name, value } = e.target;
    const nuevosEjercicios = [...ejerciciosRutina];
    nuevosEjercicios[index][name] = value;
    setEjerciciosRutina(nuevosEjercicios);
  };

  // Envío del Formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroresCampos({}); // Reiniciar errores visuales
    
    // VALIDACIÓN 
    let hayError = false;
    const nuevosErrores = {};

    if (!nombreRutina.trim()) {
      nuevosErrores.nombreRutina = true;
      hayError = true;
    }

    if (hayError) {
      setErroresCampos(nuevosErrores);
      toast.error('Por favor, ponle un nombre a la rutina.');
      return;
    }

    if (ejerciciosRutina.length === 0) {
      toast.error('La rutina debe tener al menos un ejercicio.');
      return;
    }
  

    const toastId = toast.loading('Asignando rutina...');

    try {
      await api.post('/fisio/rutinas', {
        pacienteId: paciente.id,
        nombreRutina,
        ejercicios: ejerciciosRutina
      });
      
      toast.success('¡Rutina asignada exitosamente!', { id: toastId });
      navigate('/fisio/dashboard');

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || 'Error al asignar la rutina.';
      toast.error(msg, { id: toastId });
    }
  };

  if (cargando) return <div className="zona-carga"><h3>Cargando...</h3></div>;
  if (!paciente) return <div className="zona-carga"><h3>No se encontró al paciente.</h3></div>;

  return (
    <div className="constructor-container">
      <form onSubmit={handleSubmit} className="tarjeta">
        <h2>Asignar Rutina a: {paciente?.nombre}</h2>
        
        <div className="form-grupo">
          <label htmlFor="nombreRutina">Nombre de la Rutina</label>
          <input
            type="text"
            id="nombreRutina"
            value={nombreRutina}
            // CLASE CONDICIONAL
            className={erroresCampos.nombreRutina ? 'input-error' : ''}
            onChange={(e) => {
              setNombreRutina(e.target.value);
              // Limpiar error al escribir
              if(erroresCampos.nombreRutina) setErroresCampos({...erroresCampos, nombreRutina: false});
            }}
            placeholder="Ej: Rutina de Recuperación Semana 1"
          />
        </div>

        <hr />

        {/* CONSTRUCTOR DE DOS COLUMNAS */}
        <div className="constructor-layout">
          
          {/* Biblioteca */}
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
            {/* Lista Filtrada (MODIFICADA) */}
            <ul className="lista-biblioteca-picker">
              {bibliotecaFiltrada.map(ej => (
                <li key={ej.id}>
                  
                  {/* 1. IMAGEN MINIATURA (NUEVO) */}
                  <img 
                    src={ej.videoUrl} 
                    alt="ejercicio" 
                    className="picker-img"
                    loading="lazy"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                  />

                  {/* 2. NOMBRE */}
                  <span className="picker-info">{ej.nombre}</span>
                  
                  {/* 3. BOTÓN MÁS CHULO */}
                  <button 
                    type="button" 
                    className="btn-add-picker"
                    onClick={() => addEjercicioToRutina(ej)}
                    title="Añadir a rutina"
                  >
                    +
                  </button>

                </li>
              ))}
              
              {bibliotecaFiltrada.length === 0 && (
                <li style={{textAlign: 'center', padding: '20px', color: '#888', display:'block', border:'none', background:'transparent'}}>
                   🔍 No se encontraron ejercicios.
                </li>
              )}
            </ul>
          </div>

          {/* Rutina */}
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
                <div style={{textAlign: 'center', opacity: 0.7, padding: '2rem'}}>
                  <p>La rutina está vacía.</p>
                  <p style={{fontSize: '0.9rem'}}>Añade ejercicios pulsando el <strong>+</strong> en la biblioteca.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
        
        {/* Enviar */}
        <button type="submit" className="boton-primario" style={{width: '100%', marginTop: '2rem'}}>
          Asignar Rutina Completa
        </button>
      </form>
    </div>
  );
}

export default AsignarRutinaPage;