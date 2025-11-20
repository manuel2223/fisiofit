// En servidor/routes/citas.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Cita, Usuario } = require('../../3_domain/models');
const { Op } = require('sequelize'); // Importamos 'Op' para consultas

// --- RUTA PARA OBTENER HORAS OCUPADAS DE UN DÍA ---
// GET /api/citas/disponibilidad/:fecha
// :fecha tendrá el formato YYYY-MM-DD
router.get('/disponibilidad/:fecha', [authMiddleware], async (req, res) => {
  try {
    const fecha = req.params.fecha;
    
    // Calcula el inicio y fin del día
    const inicioDelDia = new Date(`${fecha}T00:00:00.000Z`);
    const finDelDia = new Date(`${fecha}T23:59:59.999Z`);

    // Busca todas las citas que empiecen ESE día
    const citasReservadas = await Cita.findAll({
      where: {
        fechaHoraInicio: {
          [Op.between]: [inicioDelDia, finDelDia]
        }
      },
      attributes: ['fechaHoraInicio'] // Solo necesitamos la hora de inicio
    });

    // Mapea el resultado para enviar solo las horas (ej: "09:00")
    const horasOcupadas = citasReservadas.map(cita => {
      return new Date(cita.fechaHoraInicio).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid' // Asegúrate de usar la zona horaria correcta
      });
    });

    res.json(horasOcupadas);

  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// POST /api/citas/reservar
router.post('/reservar', [authMiddleware], async (req, res) => {
  try {
    // 1. Recibimos los nuevos campos del body
    const { fechaHoraInicio, fechaHoraFin, motivo, tipo } = req.body;
    const pacienteId = req.usuario.id;
    
    // ID del fisio (hardcodeado para el TFG, o podrías enviarlo desde el front)
    const fisioterapeutaId = 1; 

    if (!fechaHoraInicio || !fechaHoraFin || !tipo) {
      return res.status(400).json({ msg: 'Faltan datos obligatorios (fecha o tipo).' });
    }

    const nuevaCita = await Cita.create({
      pacienteId,
      fisioterapeutaId,
      fechaHoraInicio: new Date(fechaHoraInicio),
      fechaHoraFin: new Date(fechaHoraFin),
      estado: 'confirmada',
      // 2. Guardamos los nuevos campos
      motivo: motivo,
      tipo: tipo
    });

    res.status(201).json({ msg: 'Cita reservada exitosamente.', cita: nuevaCita });

  } catch (error) {
    console.error('Error al reservar la cita:', error);
    res.status(500).json({ msg: 'Error al reservar.' });
  }
});

// --- RUTA PARA QUE UN PACIENTE VEA SUS PROPIAS CITAS ---
// GET /api/citas/mis-citas
router.get('/mis-citas', [authMiddleware], async (req, res) => {
  try {
    const citas = await Cita.findAll({
      where: { pacienteId: req.usuario.id }, // Busca solo las del usuario logueado
      include: [
        {
          model: Usuario,
          as: 'fisioterapeuta', // Asegúrate de que este 'as' coincide con models/index.js
          attributes: ['nombre'] // Incluye el nombre del fisio
        }
      ],
      order: [['fechaHoraInicio', 'DESC']] // Muestra las más nuevas primero
    });

    res.json(citas);

  } catch (error) {
    console.error('Error al obtener mis-citas:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA QUE UN PACIENTE CANCELE UNA CITA ---
// DELETE /api/citas/:id
router.delete('/:id', [authMiddleware], async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    // --- ¡SEGURIDAD CRÍTICA! ---
    // Comprueba que el usuario logueado es el dueño de la cita
    if (cita.pacienteId !== req.usuario.id) {
      return res.status(403).json({ msg: 'Acceso denegado. No puedes cancelar esta cita.' });
    }

    // Si todo es correcto, borra la cita
    await cita.destroy();
    res.json({ msg: 'Cita cancelada correctamente.' });

  } catch (error) {
    console.error('Error al cancelar la cita:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});


module.exports = router;