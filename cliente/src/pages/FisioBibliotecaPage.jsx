// En cliente/src/pages/FisioBibliotecaPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import './FisioBibliotecaPage.css';

function FisioBibliotecaPage() {
  const [biblioteca, setBiblioteca] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // 1. Estado para saber qué ID estamos editando
  const [idEditando, setIdEditando] = useState(null); // null = creando, (un ID) = editando
  
  // 2. Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [categoria, setCategoria] = useState(''); // El ID de la categoría seleccionada
  const [error, setError] = useState('');

  // 3. Estados para el formulario de Categoría
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [errorCategoria, setErrorCategoria] = useState('');

  // 4. Cargar AMBAS (biblioteca y categorías)
  const fetchDatos = async () => {
    // No ponemos 'cargando' a true aquí para evitar parpadeos al crear/borrar
    try {
      const [resBib, resCat] = await Promise.all([
        api.get('/fisio/biblioteca'),
        api.get('/fisio/categorias') 
      ]);
      setBiblioteca(resBib.data);
      setCategorias(resCat.data);
      // Poner la primera categoría como seleccionada por defecto si no estamos editando
      if (resCat.data.length > 0 && !idEditando) {
        setCategoria(resCat.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la biblioteca.');
    }
    setCargando(false);
  };

  useEffect(() => {
    fetchDatos();
  }, []); // Carga solo una vez

  // 5. Función para limpiar el formulario y salir del modo edición
  const limpiarFormulario = () => {
    setIdEditando(null);
    setNombre('');
    setDescripcion('');
    setVideoUrl('');
    // Resetea a la primera categoría de la lista o a vacío
    setCategoria(categorias.length > 0 ? categorias[0].id : '');
    setError('');
  };

  // 6. Función para cargar los datos de un ejercicio en el formulario
  const handleEditClick = (ejercicio) => {
    setIdEditando(ejercicio.id);
    setNombre(ejercicio.nombre);
    setDescripcion(ejercicio.descripcion || '');
    setVideoUrl(ejercicio.videoUrl || '');
    setCategoria(ejercicio.categoriaId); // <-- ¡CORREGIDO! Usa el ID
  };

  // 7. Función para borrar un ejercicio
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres borrar este ejercicio?')) {
      return;
    }
    try {
      await api.delete(`/fisio/biblioteca/${id}`);
      fetchDatos(); // Recarga la lista
    } catch (err) {
      console.error(err);
      setError('Error al borrar el ejercicio.');
    }
  };

  // 8. UN ÚNICO handleSubmit (Crear o Actualizar Ejercicio)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (categoria === '') {
      setError('Debes seleccionar una categoría.');
      return;
    }

    const datosEjercicio = { 
      nombre, 
      descripcion, 
      videoUrl, 
      categoriaId: categoria // Envía el ID
    };

    try {
      if (idEditando) {
        // --- Modo ACTUALIZAR (PUT) ---
        await api.put(`/fisio/biblioteca/${idEditando}`, datosEjercicio);
      } else {
        // --- Modo CREAR (POST) ---
        await api.post('/fisio/biblioteca', datosEjercicio);
      }
      
      fetchDatos(); // Recarga la lista
      limpiarFormulario(); // Limpia el formulario

    } catch (err) {
      console.error(err);
      if(err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg); // Muestra error de validación del backend
      } else {
        setError('Error al guardar el ejercicio.');
      }
    }
  };

  // 9. Manejar la creación de categoría
  const handleCategoriaSubmit = async (e) => {
    e.preventDefault();
    setErrorCategoria('');
    if (!nuevaCategoriaNombre) return;

    try {
      await api.post('/fisio/categorias', { nombre: nuevaCategoriaNombre });
      setNuevaCategoriaNombre(''); // Limpia el input
      fetchDatos(); // Recarga todo (incluyendo la nueva lista de categorías)
    } catch (err) {
      console.error(err);
      setErrorCategoria('Error al crear. ¿La categoría ya existe?');
    }
  };

  // 10. Manejar el borrado de categoría
  const handleCategoriaDelete = async (id) => {
    if (!window.confirm('¿Borrar esta categoría? No podrás borrarla si algún ejercicio la está usando.')) {
      return;
    }
    try {
      await api.delete(`/fisio/categorias/${id}`);
      fetchDatos(); // Recarga todo
    } catch (err) {
      console.error(err);
      setErrorCategoria('Error al borrar. Asegúrate de que no esté en uso.');
    }
  };

  return (
    <div className="biblioteca-container">
      <h2>Biblioteca de Ejercicios</h2>
      
      <div className="biblioteca-layout">
        {/* --- Columna 1: Formulario de Ejercicio --- */}
        <div className="tarjeta form-biblioteca">
          <h3>{idEditando ? 'Editar Ejercicio' : 'Añadir Nuevo Ejercicio'}</h3>
          
          <form onSubmit={handleSubmit}>
            {error && <p className="error-mensaje">{error}</p>}
            <div className="form-grupo">
              <label>Nombre del Ejercicio</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div className="form-grupo">
              <label>Categoría</label>
              {/* SELECT DINÁMICO */}
              <select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                <option value="" disabled>-- Selecciona una --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
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
            
            {/* Botón de envío dinámico */}
            <button type="submit" className="boton-primario">
              {idEditando ? 'Actualizar Ejercicio' : 'Guardar Ejercicio'}
            </button>
            
            {/* Botón para cancelar la edición */}
            {idEditando && (
              <button type="button" className="boton-secundario" onClick={limpiarFormulario} style={{marginTop: '1rem'}}>
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        {/* --- Columna 2: Listas --- */}
        <div className="lista-biblioteca">
          
          {/* --- Widget: Gestionar Categorías --- */}
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
              {errorCategoria && <p className="error-mensaje-inline">{errorCategoria}</p>}
              <button type="submit" className="boton-primario">Añadir Categoría</button>
            </form>
            <hr style={{ margin: '1.5rem 0' }} />
            <ul className="lista-categorias">
              {categorias.map(cat => (
                <li key={cat.id}>
                  <span>{cat.nombre}</span>
                  <button onClick={() => handleCategoriaDelete(cat.id)} className="boton-borrar-cat">X</button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* --- Widget: Ejercicios Guardados --- */}
          <div className="tarjeta">
            <h3>Ejercicios Guardados</h3>
            {cargando ? <p>Cargando...</p> : (
              biblioteca.map(ej => (
                <div key={ej.id} className="ejercicio-bib-item">
                  <div className="info">
                    {/* Lee el objeto 'categoria' que viene del 'include' */}
                    <span className="categoria-tag">
                      {ej.categoria ? ej.categoria.nombre : 'Sin Cat.'}
                    </span>
                    <strong>{ej.nombre}</strong>
                  </div>
                  {/* BOTONES DE ACCIÓN */}
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