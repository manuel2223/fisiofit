const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fisioMiddleware = require('../middleware/fisioMiddleware');
const AsignarRutinaUseCase = require('../../2_application/use_cases/AsignarRutinaUseCase');
const { Usuario, Rutina, Ejercicio, Cita, EjercicioBiblioteca, Categoria, Resultado, Disponibilidad } = require('../../3_domain/models');
const sequelize = require('../../4_infrastructure/database/db');
const { Op } = require('sequelize');

// GET /api/fisio/paciente
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

// GET /api/fisio/paciente/:id
router.get('/paciente/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
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

// POST /api/fisio/rutinas
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
    console.error('ERROR DETECTADO AL ASIGNAR RUTINA', error);
    res.status(400).json({ msg: error.message || 'Error en el caso de uso.' });
  }
});

// GET /api/fisio/citas
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


// RUTAS PARA LA BIBLIOTECA DE EJERCICIOS

// GET /api/fisio/biblioteca
router.get('/biblioteca', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const ejercicios = await EjercicioBiblioteca.findAll({
      where: {
        // Lógica: Mis ejercicios O los públicos (null)
        [Op.or]: [
          { fisioterapeutaId: req.usuario.id }, 
          { fisioterapeutaId: null }
        ]
      },
      include: [
        { 
          model: Categoria, 
          as: 'categoria', // <--- ¡AQUÍ ESTÁ LA CLAVE! Hay que ponerlo.
          attributes: ['nombre'] 
        }
      ],
      order: [
        ['nombre', 'ASC'] 
      ]
    });
    
    res.json(ejercicios);
  } catch (error) {
    console.error('Error en GET /fisio/biblioteca:', error);
    res.status(500).json({ msg: 'Error al obtener la biblioteca.' });
  }
});

// POST /api/fisio/biblioteca 
router.post('/biblioteca', [authMiddleware, fisioMiddleware], async (req, res) => {
  let { nombre, descripcion, videoUrl, categoriaId, reglasPostura } = req.body;
  try {
    const nuevoEjercicio = await EjercicioBiblioteca.create({
      nombre,
      descripcion,
      videoUrl: videoUrl === '' ? null : videoUrl,
      categoriaId,
      fisioterapeutaId: req.usuario.id,
      reglasPostura: reglasPostura
    });
    res.status(201).json(nuevoEjercicio);
  } catch (error) {
    console.error('ERROR DETECTADO AL GUARDAR EJERCICIO');
    console.error(error); 
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map(err => err.message).join('. ');
      return res.status(400).json({ msg: `Error de validación: ${mensajes}` });
    }
    res.status(500).json({ msg: 'Error interno del servidor al crear el ejercicio.' });
  }
});


// PUT /api/fisio/biblioteca/:id
router.put('/biblioteca/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  const { nombre, descripcion, videoUrl, categoriaId, reglasPostura } = req.body;
  
  try {
    // CAMBIO: Usamos findByPk (Buscar por Primary Key) para buscar solo por ID
    // Quitamos la restricción de "fisioterapeutaId" para poder editar los del seed.
    const ejercicio = await EjercicioBiblioteca.findByPk(req.params.id);

    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    
    // Actualizamos los campos
    ejercicio.nombre = nombre;
    ejercicio.descripcion = descripcion;
    ejercicio.videoUrl = videoUrl === '' ? null : videoUrl;
    ejercicio.categoriaId = categoriaId;
    ejercicio.reglasPostura = reglasPostura;

    // Si quieres que al editar un ejercicio global pase a ser "tuyo", podrías descomentar esto:
    // ejercicio.fisioterapeutaId = req.usuario.id; 

    await ejercicio.save();
    res.json(ejercicio);

  } catch (error) {
    console.error('ERROR DETECTADO AL ACTUALIZAR EJERCICIO:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ msg: 'Error de validación.' });
    }
    res.status(500).json({ msg: 'Error al actualizar el ejercicio.' });
  }
});

// DELETE /api/fisio/biblioteca/:id 
router.delete('/biblioteca/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    // CAMBIO: Lo mismo aquí, buscamos solo por ID
    const ejercicio = await EjercicioBiblioteca.findByPk(req.params.id);

    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    
    await ejercicio.destroy();
    res.json({ msg: 'Ejercicio eliminado correctamente.' });

  } catch (error) {
    console.error('ERROR DETECTADO AL BORRAR EJERCICIO:', error);
    // Controlar si el ejercicio está en uso en alguna rutina
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ msg: 'No se puede borrar: Este ejercicio está siendo usado en una rutina.' });
    }
    res.status(500).json({ msg: 'Error al eliminar el ejercicio.' });
  }
});


//RUTAS PARA LAS CATEGORIAS

// GET /api/fisio/categorias
router.get('/categorias', [authMiddleware], async (req, res) => {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ msg: 'Error al obtener categorías.' });
  }
});

// POST /api/fisio/categorias
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

// DELETE /api/fisio/categorias/:id
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


// ESTADÍSTICAS DEL DASHBOARD
// GET /api/fisio/stats
router.get('/stats', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
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

    // Gráfico semanal
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


    // Gráfico Donut de citas por tipo
    const citasPorTipoRaw = await Cita.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo']
    });

    const graficoTipos = citasPorTipoRaw.map(item => ({
      name: item.tipo,
      value: parseInt(item.getDataValue('total'))
    }));


    res.json({
      citasHoy,
      totalPacientes,
      graficoSemanal: diasGrafico,
      graficoTipos 
    });

  } catch (error) {
    console.error('Error en stats:', error);
    res.status(500).json({ msg: 'Error al calcular estadísticas' });
  }
});


// HISTORIAL DE RESULTADOS DE UN PACIENTE
// GET /api/fisio/paciente/:id/resultados
router.get('/paciente/:id/resultados', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const resultados = await Resultado.findAll({
      where: { pacienteId: req.params.id },
      include: [
        { 
          model: Ejercicio, 
          attributes: ['nombreEjercicio'] 
        }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(resultados);

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});


// GESTIÓN DE HORARIO

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

// POST /api/fisio/horario
router.post('/horario', [authMiddleware, fisioMiddleware], async (req, res) => {
  const { dias } = req.body; 
  
  try {
    await Disponibilidad.destroy({ where: { fisioterapeutaId: req.usuario.id } });
    
    const nuevosDias = dias.map(d => ({ ...d, fisioterapeutaId: req.usuario.id }));
    await Disponibilidad.bulkCreate(nuevosDias);
    
    res.json({ msg: 'Horario actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al guardar horario' });
  }
});


// OBTENER LAS RUTINAS DE UN PACIENTE
// GET /api/fisio/paciente/:id/rutinas
router.get('/paciente/:id/rutinas', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const rutinas = await Rutina.findAll({
      where: { pacienteAsignadoId: req.params.id },
      include: [{ 
        model: Ejercicio, 
        as: 'ejercicios' 
      }],
      order: [['createdAt', 'DESC']] 
    });
    res.json(rutinas);
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    res.status(500).json({ msg: 'Error interno al cargar rutinas.' });
  }
});

// BORRAR UNA RUTINA
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