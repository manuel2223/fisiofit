const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fisioMiddleware = require('../middleware/fisioMiddleware');
const { Cita, Usuario, Disponibilidad } = require('../../3_domain/models');
const { Op } = require('sequelize'); 
const EmailService = require('../../4_infrastructure/services/EmailService'); 

// GET /api/citas/disponibilidad/:fecha
router.get('/disponibilidad/:fecha', [authMiddleware], async (req, res) => {
  try {
    const { fecha } = req.params;
    const { fisioId } = req.query; 

    if (!fisioId) {
      return res.status(400).json({ msg: 'Falta el ID del fisioterapeuta' });
    }

    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();

    // Buscamos la disponibilidad de ese fisio
    const configDia = await Disponibilidad.findOne({
      where: { 
        diaSemana: diaSemana,
        fisioterapeutaId: fisioId 
      }
    });

    // Si no hay regla para ese fisio, o no está activo
    if (!configDia || !configDia.activo) {
      return res.json({ slots: [], ocupadas: [] });
    }

    // Generación de los Slots
    const slots = [];
    const duracionCita = 30;
    const timeToMins = (str) => { const [h, m] = str.split(':').map(Number); return h * 60 + m; };
    const minsToTime = (mins) => { const h = Math.floor(mins / 60).toString().padStart(2, '0'); const m = (mins % 60).toString().padStart(2, '0'); return `${h}:${m}`; };
    
    let currentMins = timeToMins(configDia.horaInicio);
    const endMins = timeToMins(configDia.horaFin);
    const breakStart = configDia.tieneDescanso ? timeToMins(configDia.horaInicioDescanso) : -1;
    const breakEnd = configDia.tieneDescanso ? timeToMins(configDia.horaFinDescanso) : -1;

    while (currentMins + duracionCita <= endMins) {
      if (configDia.tieneDescanso && currentMins >= breakStart && currentMins < breakEnd) {
        currentMins += duracionCita;
        continue;
      }
      slots.push(minsToTime(currentMins));
      currentMins += duracionCita;
    }

    // Buscar citas ocupadas del fisio
    const inicioDia = new Date(`${fecha}T00:00:00.000Z`);
    const finDia = new Date(`${fecha}T23:59:59.999Z`);

    const citasOcupadas = await Cita.findAll({
      where: {
        fechaHoraInicio: { [Op.between]: [inicioDia, finDia] },
        estado: { [Op.not]: 'cancelada' },
        fisioterapeutaId: fisioId
      },
      attributes: ['fechaHoraInicio']
    });

    const ocupadas = citasOcupadas.map(c => {
      const d = new Date(c.fechaHoraInicio);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    });

    res.json({ slots, ocupadas });

  } catch (error) {
    console.error('Error disponibilidad:', error);
    res.status(500).json({ msg: 'Error al calcular disponibilidad' });
  }
});

// POST /api/citas/reservar
router.post('/reservar', [authMiddleware], async (req, res) => {
  try {
    const { fechaHoraInicio, fechaHoraFin, motivo, tipo, fisioId } = req.body;
    const pacienteId = req.usuario.id;
    
    const datosPaciente = await Usuario.findByPk(pacienteId);

  
    const nuevaCita = await Cita.create({
      pacienteId,
      fisioterapeutaId: fisioId,
      fechaHoraInicio: new Date(fechaHoraInicio),
      fechaHoraFin: new Date(fechaHoraFin),
      estado: 'confirmada',
      motivo,
      tipo
    });

    // Enviar notificaciones por email
    const fechaObj = new Date(fechaHoraInicio);
    const fechaLegible = fechaObj.toLocaleDateString('es-ES');
    const horaLegible = fechaObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});

    // Email al Paciente
    EmailService.enviarConfirmacionCita(
      datosPaciente.email, 
      datosPaciente.nombre, 
      fechaLegible, 
      horaLegible, 
      tipo
    );

    // Email al Fisio
    EmailService.enviarAvisoFisio(
      datosPaciente.nombre, 
      fechaLegible, 
      horaLegible, 
      tipo, 
      motivo
    );

    res.status(201).json({ msg: 'Cita reservada exitosamente.', cita: nuevaCita });

  } catch (error) {
    console.error('Error reservar:', error);
    res.status(500).json({ msg: 'Error al reservar' });
  }
});

// PACIENTE VE SUS CITAS 
// GET /api/citas/mis-citas
router.get('/mis-citas', [authMiddleware], async (req, res) => {
  try {
    const citas = await Cita.findAll({
      where: { pacienteId: req.usuario.id },
      include: [
        {
          model: Usuario,
          as: 'fisioterapeuta', 
          attributes: ['nombre']
        }
      ],
      order: [['fechaHoraInicio', 'DESC']]
    });

    res.json(citas);

  } catch (error) {
    console.error('Error al obtener mis-citas:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// DELETE /api/citas/:id
router.delete('/:id', [authMiddleware], async (req, res) => {
    try {
      const cita = await Cita.findByPk(req.params.id, {
          include: [{ model: Usuario, as: 'paciente' }] 
      });
  
      if (!cita) return res.status(404).json({ msg: 'Cita no encontrada.' });
      if (cita.pacienteId !== req.usuario.id) return res.status(403).json({ msg: 'Acceso denegado.' });
  
      const { fechaHoraInicio, paciente } = cita;
      
      await cita.destroy();

      // Email de cancelación
      const fechaObj = new Date(fechaHoraInicio);
      EmailService.enviarCancelacion(
          paciente.email,
          paciente.nombre,
          fechaObj.toLocaleDateString('es-ES'),
          fechaObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})
      );
  
      res.json({ msg: 'Cita cancelada correctamente.' });
  
    } catch (error) {
      console.error('Error delete:', error);
      res.status(500).json({ msg: 'Error al cancelar reserva' });
    }
  });

module.exports = router;