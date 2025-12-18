const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Rutina, Ejercicio, Usuario, Resultado } = require('../../3_domain/models'); 


router.get('/', authMiddleware, async (req, res) => {
  try {
    const rutinas = await Rutina.findAll({
      where: { pacienteAsignadoId: req.usuario.id },
      include: [
        { model: Ejercicio, as: 'ejercicios' }, 
        { model: Usuario, as: 'fisioterapeutaCreador', attributes: ['nombre'] } 
      ]
    });
    res.json(rutinas);

  } catch (error) {
    console.error(error.message); 
    res.status(500).send('Error del Servidor');
  }
});


// OBTENER UN EJERCICIO ESPECÍFICO 
// GET /api/rutinas/ejercicio/:id
router.get('/ejercicio/:id', [authMiddleware], async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findByPk(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    }

    // Comprueba que este ejercicio pertenece a una rutina de este paciente
    const rutina = await Rutina.findByPk(ejercicio.rutinaId);
    if (rutina.pacienteAsignadoId !== req.usuario.id) {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    res.json(ejercicio);

  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// GUARDAR EL FEEDBACK DEL PACIENTE 
// POST /api/rutinas/feedback
router.post('/feedback', [authMiddleware], async (req, res) => {
  const { ejercicioId, dificultad, dolor, comentarios } = req.body;
  const pacienteId = req.usuario.id;

  try {
    const nuevoResultado = await Resultado.create({
      ejercicioId,
      pacienteId,
      dificultad,
      dolor,
      comentarios
    });

    res.status(201).json({ msg: 'Feedback guardado correctamente.', resultado: nuevoResultado });

  } catch (error) {
    console.error('Error al guardar feedback:', error);
    res.status(500).json({ msg: 'Error al guardar el progreso.' });
  }
});

module.exports = router;