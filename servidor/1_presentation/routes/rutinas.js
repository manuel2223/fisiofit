// En servidor/routes/rutinas.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// 1. SOLUCIÓN: Añade 'Usuario' a esta importación
const { Rutina, Ejercicio, Usuario, Resultado } = require('../../3_domain/models'); 

// 2. APLICA EL GUARDIA:
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rutinas = await Rutina.findAll({
      where: { pacienteAsignadoId: req.usuario.id },
      include: [
        { model: Ejercicio, as: 'ejercicios' }, 
        // 3. Ahora esta línea SÍ encontrará el modelo 'Usuario'
        { model: Usuario, as: 'fisioterapeutaCreador', attributes: ['nombre'] } 
      ]
    });

    res.json(rutinas);

  } catch (error) {
    console.error(error.message); // <-- Esto mostrará el error en la consola del server
    res.status(500).send('Error del Servidor');
  }
});


// --- RUTA PARA OBTENER UN EJERCICIO ESPECÍFICO (PARA LA IA) ---
// GET /api/rutinas/ejercicio/:id
router.get('/ejercicio/:id', [authMiddleware], async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findByPk(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ msg: 'Ejercicio no encontrado.' });
    }

    // --- ¡SEGURIDAD! ---
    // Comprueba que este ejercicio pertenece a una rutina de este paciente
    const rutina = await Rutina.findByPk(ejercicio.rutinaId);
    if (rutina.pacienteAsignadoId !== req.usuario.id) {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    // Si todo OK, envía el ejercicio (con sus reglas)
    res.json(ejercicio);

  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA GUARDAR EL FEEDBACK DEL PACIENTE ---
// POST /api/rutinas/feedback
router.post('/feedback', [authMiddleware], async (req, res) => {
  const { ejercicioId, dificultad, dolor, comentarios } = req.body;
  const pacienteId = req.usuario.id;

  try {
    // (Opcional: Podríamos verificar que el ejercicio pertenece al paciente, 
    // pero por ahora confiamos en el ID que manda el frontend)

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