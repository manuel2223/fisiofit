// En servidor/1_presentation/routes/fisio.js
const express = require('express');
const router = express.Router();

// --- 1. IMPORTACIONES CORRECTAS ---
const authMiddleware = require('../middleware/authMiddleware');
const fisioMiddleware = require('../middleware/fisioMiddleware');
const AsignarRutinaUseCase = require('../../2_application/use_cases/AsignarRutinaUseCase');
const { Usuario, Rutina, Ejercicio, Cita, EjercicioBiblioteca, Categoria } = require('../../3_domain/models');
const sequelize = require('../../4_infrastructure/database/db');

// --- 2. RUTAS DE PACIENTES (GET) ---
router.get('/pacientes', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const pacientes = await Usuario.findAll({
      where: { rol: 'paciente' },
      attributes: ['id', 'nombre', 'email']
    });
    res.json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

router.get('/paciente/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const paciente = await Usuario.findOne({
      where: { id: req.params.id, rol: 'paciente' },
      attributes: ['id', 'nombre', 'email']
    });
    if (!paciente) return res.status(404).json({ msg: 'Paciente no encontrado' });
    res.json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- 3. RUTA DE ASIGNAR RUTINA (POST) ---
router.post('/rutinas', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const command = {
      pacienteId: req.body.pacienteId,
      fisioterapeutaId: req.usuario.id,
      nombreRutina: req.body.nombreRutina,
      ejercicios: req.body.ejercicios
    };
    const nuevaRutina = await AsignarRutinaUseCase.execute(command);
    res.status(201).json({ msg: 'Rutina creada y asignada exitosamente.', rutina: nuevaRutina });
  } catch (error) {
    console.error('--- ERROR DETECTADO AL ASIGNAR RUTINA ---', error);
    res.status(400).json({ msg: error.message || 'Error en el caso de uso.' });
  }
});

// --- 4. RUTA DE CITAS DEL FISIO (GET) ---
router.get('/citas', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [{ model: Usuario, as: 'paciente', attributes: ['nombre'] }],
      order: [['fechaHoraInicio', 'ASC']]
    });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener todas las citas:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- 5. RUTAS CRUD DE BIBLIOTECA (GET, POST, PUT, DELETE) ---

// GET /api/fisio/biblioteca (Arregla el ORDER BY)
router.get('/biblioteca', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const ejercicios = await EjercicioBiblioteca.findAll({
      where: { fisioterapeutaId: req.usuario.id },
      include: [{ model: Categoria, as: 'categoria', attributes: ['nombre'] }],
      // --- SOLUCIÓN AL ERROR SQL ---
      // El 'order' debe hacer referencia al modelo o al alias, no a un string
      order: [
        [{ model: Categoria, as: 'categoria' }, 'nombre', 'ASC'],
        ['nombre', 'ASC']
      ]
    });
    res.json(ejercicios);
  } catch (error) {
    console.error('Error en GET /fisio/biblioteca:', error);
    res.status(500).json({ msg: 'Error al obtener la biblioteca.' });
  }
});

// POST /api/fisio/biblioteca (Arregla el CATCH)
router.post('/biblioteca', [authMiddleware, fisioMiddleware], async (req, res) => {
  let { nombre, descripcion, videoUrl, categoriaId } = req.body;
  try {
    const nuevoEjercicio = await EjercicioBiblioteca.create({
      nombre,
      descripcion,
      videoUrl: videoUrl === '' ? null : videoUrl,
      categoriaId, // Usa categoriaId
      fisioterapeutaId: req.usuario.id
    });
    res.status(201).json(nuevoEjercicio);
  } catch (error) {
    // --- SOLUCIÓN AL REFERENCEERROR ---
    console.error('--- ERROR DETECTADO AL GUARDAR EJERCICIO ---');
    console.error(error); // Muestra el error real (probablemente de validación)
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map(err => err.message).join('. ');
      return res.status(400).json({ msg: `Error de validación: ${mensajes}` });
    }
    res.status(500).json({ msg: 'Error interno del servidor al crear el ejercicio.' });
  }
});

// PUT /api/fisio/biblioteca/:id (Arregla el CATCH)
router.put('/biblioteca/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  const { nombre, descripcion, videoUrl, categoriaId } = req.body;
  try {
    const ejercicio = await EjercicioBiblioteca.findOne({
      where: { id: req.params.id, fisioterapeutaId: req.usuario.id }
    });
    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    
    ejercicio.nombre = nombre;
    ejercicio.descripcion = descripcion;
    ejercicio.videoUrl = videoUrl === '' ? null : videoUrl;
    ejercicio.categoriaId = categoriaId; // Usa categoriaId

    await ejercicio.save();
    res.json(ejercicio);
  } catch (error) {
    // --- SOLUCIÓN AL REFERENCEERROR ---
    console.error('--- ERROR DETECTADO AL ACTUALIZAR EJERCICIO ---');
    console.error(error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ msg: 'Error de validación.' });
    }
    res.status(500).json({ msg: 'Error al actualizar el ejercicio.' });
  }
});

// DELETE /api/fisio/biblioteca/:id (Arregla el CATCH)
router.delete('/biblioteca/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const ejercicio = await EjercicioBiblioteca.findOne({
      where: { id: req.params.id, fisioterapeutaId: req.usuario.id }
    });
    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    
    await ejercicio.destroy();
    res.json({ msg: 'Ejercicio eliminado correctamente.' });
  } catch (error) {
    // --- SOLUCIÓN AL REFERENCEERROR ---
    console.error('--- ERROR DETECTADO AL BORRAR EJERCICIO ---');
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar el ejercicio.' });
  }
});

// --- 6. RUTAS CRUD DE CATEGORÍAS (Limpia los CATCH) ---

router.get('/categorias', [authMiddleware], async (req, res) => {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ msg: 'Error al obtener categorías.' });
  }
});

router.post('/categorias', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevaCategoria = await Categoria.create({ nombre });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(400).json({ msg: 'Error al crear categoría (¿ya existe?)' });
  }
});

router.delete('/categorias/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (categoria) {
      await categoria.destroy();
      res.json({ msg: 'Categoría eliminada.' });
    } else {
      res.status(404).json({ msg: 'Categoría no encontrada.' });
    }
  } catch (error) {
    console.error('Error al borrar categoría:', error);
    res.status(500).json({ msg: 'Error al eliminar. ¿Está en uso?' });
  }
});

module.exports = router;