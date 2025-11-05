// En servidor/routes/rutinas.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// 1. SOLUCIÓN: Añade 'Usuario' a esta importación
const { Rutina, Ejercicio, Usuario } = require('../models'); 

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

module.exports = router;