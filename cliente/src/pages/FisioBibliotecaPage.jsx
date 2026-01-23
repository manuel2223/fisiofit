import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import './FisioBibliotecaPage.css';
import EjercicioCard from '../components/EjercicioCard'; 

// --- 1. TU DICCIONARIO ORIGINAL DE ARTICULACIONES ---
const ARTICULACIONES_DISPONIBLES = {
  rodilla_derecha: {
    label: "Pierna Derecha",
    puntos: ["right_hip", "right_knee", "right_ankle"]
  },
  rodilla_izquierda: {
    label: "Pierna Izquierda",
    puntos: ["left_hip", "left_knee", "left_ankle"]
  },
  codo_derecho: {
    label: "Brazo Derecho",
    puntos: ["right_shoulder", "right_elbow", "right_wrist"]
  },
  codo_izquierdo: {
    label: "Brazo Izquierdo",
    puntos: ["left_shoulder", "left_elbow", "left_wrist"]
  },
  hombro_derecho: {
    label: "Hombro Derecho (Axila)",
    puntos: ["right_hip", "right_shoulder", "right_elbow"]
  },
  hombro_izquierdo: {
    label: "Hombro Izquierdo (Axila)",
    puntos: ["left_hip", "left_shoulder", "left_elbow"]
  },
  espalda_derecha: { 
    label: "Espalda (Lateral Der)",
    puntos: ["right_shoulder", "right_hip", "right_knee"]
  },
   espalda_izquierda: { 
    label: "Espalda (Lateral Izq)",
    puntos: ["left_shoulder", "left_hip", "left_knee"]
  }
};

function FisioBibliotecaPage() {
  const [biblioteca, setBiblioteca] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [idEditando, setIdEditando] = useState(null);
  
  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [categoria, setCategoria] = useState(''); 
  const [reglas, setReglas] = useState([]); 
  const [erroresCampos, setErroresCampos] = useState({}); 
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');

  // --- ESTADOS ESPECÍFICOS DEL CONSTRUCTOR DE REGLAS (RESTAURADOS) ---
  const [nuevaReglaArticulacion, setNuevaReglaArticulacion] = useState('rodilla_derecha');
  const [nuevaReglaMin, setNuevaReglaMin] = useState(70);
  const [nuevaReglaMax, setNuevaReglaMax] = useState(110);
  const [nuevaReglaMensaje, setNuevaReglaMensaje] = useState('Corrige la postura');

  // --- ESTADOS DEL BUSCADOR ---
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // --- CARGA DE DATOS ---
  const fetchCategorias = async () => {
    try {
      const resCat = await api.get('/fisio/categorias');
      setCategorias(resCat.data);
      return resCat.data;
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar categorías');
      return [];
    }
  };

  const fetchBiblioteca = async () => {
    try {
      const resBib = await api.get('/fisio/biblioteca');
      setBiblioteca(resBib.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la biblioteca');
    }
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargando(true);
      await fetchBiblioteca();
      const cats = await fetchCategorias();
      if (cats && cats.length > 0 && !idEditando) {
        setCategoria(cats[0].id); 
      }
      setCargando(false);
    };
    cargarDatosIniciales();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const ejerciciosFiltrados = useMemo(() => {
    return biblioteca.filter(ej => {
      const coincideTexto = ej.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = filtroCategoria === 'todas' 
        ? true 
        : ej.categoriaId === parseInt(filtroCategoria);
      return coincideTexto && coincideCategoria;
    });
  }, [biblioteca, busqueda, filtroCategoria]);


  // --- HANDLERS ---
  const limpiarFormulario = () => {
    setIdEditando(null);
    setNombre('');
    setDescripcion('');
    setVideoUrl('');
    setCategoria(categorias.length > 0 ? categorias[0].id : '');
    setReglas([]); 
    setErroresCampos({}); 
    // Restaurar valores por defecto del constructor de reglas
    setNuevaReglaArticulacion('rodilla_derecha');
    setNuevaReglaMin(70);
    setNuevaReglaMax(110);
    setNuevaReglaMensaje('Corrige la postura');
  };

  const handleEditClick = (ejercicio) => {
    console.log("Editando ejercicio:", ejercicio); // Debug
    setIdEditando(ejercicio.id); // Guardamos el ID clave para el PUT
    setNombre(ejercicio.nombre);
    setDescripcion(ejercicio.descripcion || '');
    setVideoUrl(ejercicio.videoUrl || '');
    setCategoria(ejercicio.categoriaId);
    
    // Recuperamos las reglas si existen
    if (ejercicio.reglasPostura) {
      // Si viene de la BD a veces es JSON string, a veces objeto. Aseguramos array.
      setReglas(Array.isArray(ejercicio.reglasPostura) ? ejercicio.reglasPostura : []);
    } else {
      setReglas([]);
    }

    setErroresCampos({}); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Seguro que quieres eliminarlo?")) return;
    
    const toastId = toast.loading('Borrando...');
    try {
      await api.delete(`/fisio/biblioteca/${id}`);
      toast.success('Ejercicio eliminado', { id: toastId });
      fetchBiblioteca();
    } catch (err) {
      console.error(err);
      toast.error('Error al borrar (¿está en uso?)', { id: toastId });
    }
  };

  // --- LÓGICA CONSTRUCTOR DE REGLAS (ORIGINAL) ---
  const addRegla = () => {
    // busca la config en el diccionario
    const config = ARTICULACIONES_DISPONIBLES[nuevaReglaArticulacion];
    
    const nuevaRegla = {
      articulacion: nuevaReglaArticulacion,
      nombreLegible: config.label,
      puntos: config.puntos,
      rangoCorrecto: [parseInt(nuevaReglaMin), parseInt(nuevaReglaMax)],
      mensajeError: nuevaReglaMensaje
    };

    setReglas([...reglas, nuevaRegla]);
    toast.success('Regla añadida');
  };

  const removeRegla = (index) => {
    const nuevas = [...reglas];
    nuevas.splice(index, 1);
    setReglas(nuevas);
  };

  // --- SUBMIT DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroresCampos({}); 
    const nuevosErrores = {};
    let hayError = false;

    if (!nombre.trim()) { nuevosErrores.nombre = true; hayError = true; }
    if (categoria === '') { nuevosErrores.categoria = true; hayError = true; }

    if (hayError) {
      setErroresCampos(nuevosErrores);
      toast.error('Revisa los campos marcados.');
      return;
    }

    const toastId = toast.loading('Guardando...');
    
    const datosEjercicio = { 
      nombre, 
      descripcion, 
      videoUrl, 
      categoriaId: categoria,
      reglasPostura: reglas.length > 0 ? reglas : null 
    };

    try {
      if (idEditando) {
        // PUT para actualizar
        await api.put(`/fisio/biblioteca/${idEditando}`, datosEjercicio);
        toast.success('Ejercicio actualizado', { id: toastId });
      } else {
        // POST para crear
        await api.post('/fisio/biblioteca', datosEjercicio);
        toast.success('Ejercicio creado', { id: toastId });
      }
      
      fetchBiblioteca();
      limpiarFormulario();

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || 'Error al guardar.';
      toast.error(msg, { id: toastId });
    }
  };

  // --- GESTIÓN CATEGORÍAS ---
  const handleCategoriaSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaCategoriaNombre.trim()) return;
    const toastId = toast.loading('Creando categoría...');
    try {
      await api.post('/fisio/categorias', { nombre: nuevaCategoriaNombre });
      setNuevaCategoriaNombre('');
      fetchCategorias(); 
      toast.success('Categoría creada', { id: toastId });
    } catch (err) {
      toast.error('Error al crear categoría', { id: toastId });
    }
  };

  const handleCategoriaDelete = async (id) => {
    if (!window.confirm('¿Borrar categoría?')) return;
    const toastId = toast.loading('Borrando...');
    try {
      await api.delete(`/fisio/categorias/${id}`);
      fetchCategorias();
      toast.success('Categoría eliminada', { id: toastId });
    } catch (err) {
      toast.error('No se pudo borrar', { id: toastId });
    }
  };

  return (
    <div className="biblioteca-container">
      <h2>Biblioteca de Ejercicios</h2>
      
      <div className="biblioteca-layout">
        
        {/* === COLUMNA 1: FORMULARIO (RESTAURADO COMPLETO) === */}
        <div className="tarjeta form-biblioteca">
          <h3>{idEditando ? 'Editar Ejercicio' : 'Añadir Nuevo Ejercicio'}</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grupo">
              <label>Nombre del Ejercicio</label>
              <input 
                type="text" value={nombre} 
                className={erroresCampos.nombre ? 'input-error' : ''}
                onChange={e => {
                  setNombre(e.target.value);
                  if(erroresCampos.nombre) setErroresCampos({...erroresCampos, nombre: false});
                }} 
              />
            </div>

            <div className="form-grupo">
              <label>Categoría</label>
              <select 
                value={categoria} 
                className={erroresCampos.categoria ? 'input-error' : ''}
                onChange={e => {
                  setCategoria(e.target.value);
                  if(erroresCampos.categoria) setErroresCampos({...erroresCampos, categoria: false});
                }}
              >
                <option value="" disabled>-- Selecciona una --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-grupo">
              <label>Descripción (Opcional)</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}></textarea>
            </div>

            <div className="form-grupo">
              <label>URL Video (Opcional)</label>
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
            </div>

            <hr style={{margin: '1.5rem 0', borderTop: '1px solid #eee'}} />
            
            {/* === AQUÍ ESTÁ TU LÓGICA DE REGLAS ORIGINAL === */}
            <h4>Reglas de Corrección IA (Opcional)</h4>
            
            <div className="constructor-reglas-box">
              <div className="form-grupo">
                <label>Articulación a vigilar</label>
                <select 
                  value={nuevaReglaArticulacion} 
                  onChange={e => setNuevaReglaArticulacion(e.target.value)}
                >
                  {Object.keys(ARTICULACIONES_DISPONIBLES).map(key => (
                    <option key={key} value={key}>
                      {ARTICULACIONES_DISPONIBLES[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-horizontal">
                <div className="form-grupo">
                  <label>Mínimo (º)</label>
                  <input type="number" value={nuevaReglaMin} onChange={e => setNuevaReglaMin(e.target.value)} />
                </div>
                <div className="form-grupo">
                  <label>Máximo (º)</label>
                  <input type="number" value={nuevaReglaMax} onChange={e => setNuevaReglaMax(e.target.value)} />
                </div>
              </div>

              <div className="form-grupo">
                <label>Mensaje de corrección</label>
                <input 
                  type="text" 
                  value={nuevaReglaMensaje} 
                  onChange={e => setNuevaReglaMensaje(e.target.value)} 
                  placeholder="Ej: ¡No dobles tanto la rodilla!"
                />
              </div>

              <button type="button" onClick={addRegla} className="boton-add-regla" style={{width:'100%'}}>
                + Añadir Regla
              </button>
            </div>

            {/* Lista de reglas añadidas */}
            {reglas.length > 0 && (
              <ul className="lista-reglas-agregadas">
                {reglas.map((regla, index) => (
                  <li key={index}>
                    <div className="info-regla">
                      <strong>{regla.nombreLegible || regla.articulacion}</strong>
                      <span>{regla.rangoCorrecto[0]}º - {regla.rangoCorrecto[1]}º</span>
                      <small>"{regla.mensajeError}"</small>
                    </div>
                    <button type="button" onClick={() => removeRegla(index)} className="boton-borrar-mini">X</button>
                  </li>
                ))}
              </ul>
            )}
            
            <hr style={{margin: '1.5rem 0', borderTop: '1px solid #eee'}} />
            
            <button type="submit" className="boton-primario">
              {idEditando ? 'Actualizar Ejercicio' : 'Guardar Ejercicio'}
            </button>
            
            {idEditando && (
              <button type="button" className="boton-secundario" onClick={limpiarFormulario} style={{marginTop: '1rem'}}>
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        {/* === COLUMNA 2: BUSCADOR Y LISTA (NUEVO DISEÑO) === */}
        <div className="lista-biblioteca">
          
          <div className="tarjeta" style={{ marginBottom: '1rem' }}>
            <h3 style={{fontSize:'1rem'}}>Categorías</h3>
            <form onSubmit={handleCategoriaSubmit} className="form-inline-categoria">
              <input 
                type="text" 
                value={nuevaCategoriaNombre}
                onChange={e => setNuevaCategoriaNombre(e.target.value)}
                placeholder="Nueva categoría..."
              />
              <button type="submit" className="boton-primario">+</button>
            </form>
            <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'10px'}}>
                 {categorias.map(cat => (
                    <span key={cat.id} style={{background:'#eee', padding:'2px 8px', borderRadius:'12px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}>
                        {cat.nombre}
                        <button onClick={() => handleCategoriaDelete(cat.id)} style={{border:'none', background:'transparent', color:'red', cursor:'pointer', fontWeight:'bold'}}>×</button>
                    </span>
                 ))}
            </div>
          </div>
          
          <div className="tarjeta">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h3 style={{margin:0}}>Catálogo ({ejerciciosFiltrados.length})</h3>
                <small style={{color:'#666'}}>Total: {biblioteca.length}</small>
            </div>

            {/* Buscador y Filtros */}
            <div className="barra-busqueda" style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#f1f2f6', padding: '10px', borderRadius: '8px' }}>
                <div style={{flex: 1}}>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar por nombre..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px'}}
                    />
                </div>
                <div style={{flex: '0 0 150px'}}>
                    <select 
                        value={filtroCategoria} 
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px'}}
                    >
                        <option value="todas">Todas</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {cargando ? (
              <div className="skeleton skeleton-box"></div>
            ) : (
                <div className="contenedor-catalogo" style={{ 
                    height: '600px', 
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                        gap: '15px' 
                    }}>
                        {ejerciciosFiltrados.map(ej => (
                            <EjercicioCard key={ej.id} ejercicio={ej}>
                                <div style={{display: 'flex', gap: '5px', marginTop: 'auto', paddingTop: '5px'}}>
                                    <button onClick={() => handleEditClick(ej)} className="boton-editar" style={{flex:1, fontSize:'0.7rem', padding:'4px'}}>✏️</button>
                                    <button onClick={() => handleDelete(ej.id)} className="boton-borrar" style={{flex:1, fontSize:'0.7rem', padding:'4px'}}>🗑️</button>
                                </div>
                            </EjercicioCard>
                        ))}
                        {ejerciciosFiltrados.length === 0 && (
                            <p style={{gridColumn: '1 / -1', textAlign: 'center', color: '#999'}}>No hay resultados.</p>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FisioBibliotecaPage;