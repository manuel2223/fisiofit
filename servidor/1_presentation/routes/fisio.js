// En servidor/1_presentation/routes/fisio.js
const express = require('express');
const router = express.Router();

// --- 1. IMPORTACIONES CORRECTAS ---
const authMiddleware = require('../middleware/authMiddleware');
const fisioMiddleware = require('../middleware/fisioMiddleware');
const AsignarRutinaUseCase = require('../../2_application/use_cases/AsignarRutinaUseCase');
const { Usuario, Rutina, Ejercicio, Cita, EjercicioBiblioteca, Categoria, Resultado, Disponibilidad } = require('../../3_domain/models');
const sequelize = require('../../4_infrastructure/database/db');
const { Op } = require('sequelize');

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

// 2. Ruta GET /paciente/:id
router.get('/paciente/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    // Esta línea fallaba si 'Usuario' no estaba bien importado arriba
    const paciente = await Usuario.findOne({ 
      where: { id: req.params.id, rol: 'paciente' },
      attributes: ['id', 'nombre', 'email']
    });

    if (!paciente) {
      return res.status(404).json({ msg: 'Paciente no encontrado' });
    }
    
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
  let { nombre, descripcion, videoUrl, categoriaId, reglasPostura } = req.body;
  try {
    const nuevoEjercicio = await EjercicioBiblioteca.create({
      nombre,
      descripcion,
      videoUrl: videoUrl === '' ? null : videoUrl,
      categoriaId, // Usa categoriaId
      fisioterapeutaId: req.usuario.id,
      reglasPostura: reglasPostura
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


// PUT /api/fisio/biblioteca/:id
router.put('/biblioteca/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  // 1. AÑADE 'reglasPostura' AQUÍ
  const { nombre, descripcion, videoUrl, categoriaId, reglasPostura } = req.body;
  
  try {
    const ejercicio = await EjercicioBiblioteca.findOne({
      where: { id: req.params.id, fisioterapeutaId: req.usuario.id }
    });
    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    
    ejercicio.nombre = nombre;
    ejercicio.descripcion = descripcion;
    ejercicio.videoUrl = videoUrl === '' ? null : videoUrl;
    ejercicio.categoriaId = categoriaId;
    
    // 2. Y AÑÁDELO AQUÍ PARA ACTUALIZARLO
    ejercicio.reglasPostura = reglasPostura;

    await ejercicio.save();
    res.json(ejercicio);
  } catch (error) {
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


// --- RUTA DE ESTADÍSTICAS (DASHBOARD) ---
// GET /api/fisio/stats
router.get('/stats', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    // ... (1. Citas Hoy y 2. Total Pacientes se quedan igual) ...
    const hoy = new Date();
    const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
    const finDia = new Date(hoy.setHours(23, 59, 59, 999));

    const citasHoy = await Cita.count({
      where: {
        fechaHoraInicio: { [Op.between]: [inicioDia, finDia] },
        estado: 'confirmada'
      }
    });

    const totalPacientes = await Usuario.count({
      where: { rol: 'paciente' }
    });

    // ... (3. Gráfico Semanal se queda igual) ...
    const curr = new Date(); 
    const primerDiaSemana = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
    primerDiaSemana.setHours(0,0,0,0);
    const ultimoDiaSemana = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));
    ultimoDiaSemana.setHours(23,59,59,999);

    const citasSemana = await Cita.findAll({
      where: {
        fechaHoraInicio: { [Op.between]: [primerDiaSemana, ultimoDiaSemana] }
      },
      attributes: ['fechaHoraInicio']
    });

    const diasGrafico = [
      { name: 'Lun', citas: 0 }, { name: 'Mar', citas: 0 }, { name: 'Mié', citas: 0 },
      { name: 'Jue', citas: 0 }, { name: 'Vie', citas: 0 }, { name: 'Sáb', citas: 0 }, { name: 'Dom', citas: 0 }
    ];

    citasSemana.forEach(cita => {
      const fecha = new Date(cita.fechaHoraInicio);
      let diaIndex = fecha.getDay() - 1; 
      if (diaIndex === -1) diaIndex = 6; 
      if (diasGrafico[diaIndex]) diasGrafico[diaIndex].citas += 1;
    });


    // --- 3b. GRÁFICO DONUT: CITAS POR TIPO (NUEVO) ---
    const citasPorTipoRaw = await Cita.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo']
    });

    // Formateamos para Recharts: [{ name: 'Masaje', value: 10 }]
    const graficoTipos = citasPorTipoRaw.map(item => ({
      name: item.tipo,
      value: parseInt(item.getDataValue('total'))
    }));


    res.json({
      citasHoy,
      totalPacientes,
      graficoSemanal: diasGrafico,
      graficoTipos // <-- Enviamos el nuevo gráfico
    });

  } catch (error) {
    console.error('Error en stats:', error);
    res.status(500).json({ msg: 'Error al calcular estadísticas' });
  }
});


// --- RUTA PARA OBTENER EL HISTORIAL DE RESULTADOS DE UN PACIENTE ---
// GET /api/fisio/paciente/:id/resultados
router.get('/paciente/:id/resultados', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const resultados = await Resultado.findAll({
      where: { pacienteId: req.params.id },
      include: [
        { 
          model: Ejercicio, 
          attributes: ['nombreEjercicio'] // Para saber qué ejercicio hizo
        }
      ],
      order: [['fecha', 'DESC']] // Los más recientes primero
    });

    res.json(resultados);

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- GESTIÓN DE HORARIO ---
// GET /api/fisio/horario
router.get('/horario', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const horario = await Disponibilidad.findAll({
      where: { fisioterapeutaId: req.usuario.id }
    });
    res.json(horario);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener horario' });
  }
});

// POST /api/fisio/horario (Guardar configuración masiva)
router.post('/horario', [authMiddleware, fisioMiddleware], async (req, res) => {
  const { dias } = req.body; // Array de objetos [{ diaSemana: 1, horaInicio: '09:00', ... }]
  
  try {
    // Borramos lo anterior y guardamos lo nuevo (estrategia simple)
    await Disponibilidad.destroy({ where: { fisioterapeutaId: req.usuario.id } });
    
    const nuevosDias = dias.map(d => ({ ...d, fisioterapeutaId: req.usuario.id }));
    await Disponibilidad.bulkCreate(nuevosDias);
    
    res.json({ msg: 'Horario actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al guardar horario' });
  }
});

// --- RUTA PARA OBTENER LAS RUTINAS DE UN PACIENTE ---
// GET /api/fisio/paciente/:id/rutinas
router.get('/paciente/:id/rutinas', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const rutinas = await Rutina.findAll({
      where: { pacienteAsignadoId: req.params.id },
      include: [{ 
        model: Ejercicio, 
        as: 'ejercicios' // Muestra los ejercicios dentro de cada rutina
      }],
      order: [['createdAt', 'DESC']] // Las más nuevas primero
    });
    res.json(rutinas);
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    res.status(500).json({ msg: 'Error interno al cargar rutinas.' });
  }
});

// --- RUTA PARA BORRAR UNA RUTINA (Ya que estás, añade esta también por si acaso) ---
// DELETE /api/fisio/rutinas/:id
router.delete('/rutinas/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const rutina = await Rutina.findByPk(req.params.id);
    
    if (!rutina) return res.status(404).json({ msg: 'Rutina no encontrada' });
    
    // Seguridad extra: verificar que el fisio es el dueño
    if (rutina.fisioterapeutaCreadorId !== req.usuario.id) {
      return res.status(403).json({ msg: 'No tienes permiso para borrar esta rutina.' });
    }

    await rutina.destroy();
    res.json({ msg: 'Rutina eliminada correctamente' });
  } catch (error) {
    console.error('Error al borrar rutina:', error);
    res.status(500).json({ msg: 'Error interno al borrar.' });
  }
});

module.exports = router;