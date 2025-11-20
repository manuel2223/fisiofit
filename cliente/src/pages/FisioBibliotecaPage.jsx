// En cliente/src/pages/FisioBibliotecaPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import './FisioBibliotecaPage.css';

// --- 1. CONFIGURACIÓN: DICCIONARIO DE ARTICULACIONES ---
// Esto traduce lo que ve el fisio a lo que entiende la IA
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
  
  // Estados del Ejercicio
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [categoria, setCategoria] = useState(''); 
  
  // Estados de Validación Visual
  const [erroresCampos, setErroresCampos] = useState({}); 

  // Estados de Categoría
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');

  // --- 2. NUEVOS ESTADOS: CONSTRUCTOR DE REGLAS IA ---
  const [reglas, setReglas] = useState([]); // Lista de reglas del ejercicio actual
  
  // Estados temporales para la regla que se está creando ahora mismo
  const [nuevaReglaArticulacion, setNuevaReglaArticulacion] = useState('rodilla_derecha');
  const [nuevaReglaMin, setNuevaReglaMin] = useState(70);
  const [nuevaReglaMax, setNuevaReglaMax] = useState(110);
  const [nuevaReglaMensaje, setNuevaReglaMensaje] = useState('Corrige la postura');


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

  // --- HANDLERS PRINCIPALES ---

  const limpiarFormulario = () => {
    setIdEditando(null);
    setNombre('');
    setDescripcion('');
    setVideoUrl('');
    setCategoria(categorias.length > 0 ? categorias[0].id : '');
    setReglas([]); // Limpia las reglas
    setErroresCampos({}); 
  };

  const handleEditClick = (ejercicio) => {
    setIdEditando(ejercicio.id);
    setNombre(ejercicio.nombre);
    setDescripcion(ejercicio.descripcion || '');
    setVideoUrl(ejercicio.videoUrl || '');
    setCategoria(ejercicio.categoriaId);
    
    // Cargar reglas existentes (si las hay)
    if (ejercicio.reglasPostura) {
      setReglas(ejercicio.reglasPostura);
    } else {
      setReglas([]);
    }

    setErroresCampos({}); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="toast-confirmacion">
        <p>¿Borrar este ejercicio?</p>
        <div className="toast-botones">
          <button onClick={() => { toast.dismiss(t.id); borrarEjercicioReal(id); }} className="btn-toast-confirmar">Sí</button>
          <button onClick={() => toast.dismiss(t.id)} className="btn-toast-cancelar">No</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const borrarEjercicioReal = async (id) => {
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

  // --- 3. HANDLERS DEL CONSTRUCTOR DE REGLAS ---

  const addRegla = () => {
    // Busca la config técnica en el diccionario
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

  // --- SUBMIT DEL FORMULARIO PRINCIPAL ---
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
      // Enviamos las reglas al backend
      reglasPostura: reglas.length > 0 ? reglas : null 
    };

    try {
      if (idEditando) {
        await api.put(`/fisio/biblioteca/${idEditando}`, datosEjercicio);
        toast.success('Ejercicio actualizado', { id: toastId });
      } else {
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

  // --- GESTIÓN DE CATEGORÍAS ---
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
      toast.error('No se pudo borrar (¿está en uso?)', { id: toastId });
    }
  };

  return (
    <div className="biblioteca-container">
      <h2>Biblioteca de Ejercicios</h2>
      
      <div className="biblioteca-layout">
        {/* --- Columna 1: Formulario --- */}
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
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
            </div>

            <hr style={{margin: '1.5rem 0', borderTop: '1px solid #eee'}} />
            
            {/* --- 4. AQUÍ ESTÁ EL CONSTRUCTOR VISUAL DE REGLAS --- */}
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
            
            {/* Botones finales */}
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

        {/* --- Columna 2: Listas --- */}
        <div className="lista-biblioteca">
          <div className="tarjeta" style={{ marginBottom: '2rem' }}>
            <h3>Gestionar Categorías</h3>
            <form onSubmit={handleCategoriaSubmit} className="form-categoria">
              <div className="form-grupo">
                <label>Nueva Categoría</label>
                <input 
                  type="text" 
                  value={nuevaCategoriaNombre}
                  onChange={e => setNuevaCategoriaNombre(e.target.value)}
                  placeholder="Ej: Estiramientos"
                />
              </div>
              <button type="submit" className="boton-primario">Añadir Categoría</button>
            </form>
            {categorias.length > 0 && <hr style={{ margin: '1.5rem 0' }} />}
            <ul className="lista-categorias">
              {categorias.map(cat => (
                <li key={cat.id}>
                  <span>{cat.nombre}</span>
                  <button onClick={() => handleCategoriaDelete(cat.id)} className="boton-borrar-cat">X</button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="tarjeta">
            <h3>Ejercicios Guardados</h3>
            {cargando ? (
              <div className="skeleton skeleton-box"></div>
            ) : (
              biblioteca.map(ej => (
                <div key={ej.id} className="ejercicio-bib-item">
                  <div className="info">
                    <span className="categoria-tag">
                      {ej.categoria ? ej.categoria.nombre : 'Sin Cat.'}
                    </span>
                    <strong>{ej.nombre}</strong>
                    {/* Indicador visual si tiene reglas IA */}
                    {ej.reglasPostura && <span style={{fontSize:'0.8rem', color:'purple', marginLeft:'0.5rem'}}>✨</span>}
                  </div>
                  <div className="acciones-bib">
                    <button onClick={() => handleEditClick(ej)} className="boton-editar">Editar</button>
                    <button onClick={() => handleDelete(ej.id)} className="boton-borrar">Borrar</button>
                  </div>
                </div>
              ))
            )}
            {biblioteca.length === 0 && !cargando && <p>Aún no has guardado ejercicios.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FisioBibliotecaPage;