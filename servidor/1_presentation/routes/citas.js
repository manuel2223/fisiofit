// En servidor/routes/citas.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fisioMiddleware = require('../middleware/fisioMiddleware'); // <-- ¡ESTA ES LA QUE FALTABA!
const { Cita, Usuario, Disponibilidad } = require('../../3_domain/models');
const { Op } = require('sequelize'); // Importamos 'Op' para consultas
const EmailService = require('../../4_infrastructure/services/EmailService'); // 1. IMPORTA EL SERVICIO

// GET /api/citas/disponibilidad/:fecha
router.get('/disponibilidad/:fecha', async (req, res) => {
  try {
    const fechaStr = req.params.fecha;
    const fechaObj = new Date(fechaStr);
    const diaSemana = fechaObj.getDay(); 

    const reglaHorario = await Disponibilidad.findOne({
      where: { diaSemana: diaSemana, fisioterapeutaId: 1, activo: true }
    });

    if (!reglaHorario) return res.json({ slots: [], ocupadas: [] }); // Cerrado

    // --- LÓGICA DE GENERACIÓN DE SLOTS ---
    const slotsPosibles = [];
    
    // Helper para convertir "HH:mm" a minutos (ej. "09:30" -> 570)
    const toMinutes = (str) => {
      if (!str) return 0;
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    };

    let minutosActual = toMinutes(reglaHorario.horaInicio);
    const minutosFin = toMinutes(reglaHorario.horaFin);
    
    // Datos del descanso
    const minutosInicioDescanso = reglaHorario.tieneDescanso ? toMinutes(reglaHorario.horaInicioDescanso) : -1;
    const minutosFinDescanso = reglaHorario.tieneDescanso ? toMinutes(reglaHorario.horaFinDescanso) : -1;

    const duracionCita = 30; // Duración en minutos
    // IMPORTANTE: Intervalo entre citas. Ponlo a 30 para tener citas a las :00 y :30
    const intervalo = 30; 

    while (minutosActual + duracionCita <= minutosFin) {
      // ¿Cae este slot dentro del descanso?
      // Si el slot empieza DESPUÉS del inicio del descanso Y ANTES del fin del descanso... saltar
      // O si termina DENTRO del descanso...
      // Lógica simple: Si la hora actual está entre inicio y fin del descanso, no lo añadimos.
      
      const enDescanso = reglaHorario.tieneDescanso && 
                         (minutosActual >= minutosInicioDescanso && minutosActual < minutosFinDescanso);

      if (!enDescanso) {
        const h = Math.floor(minutosActual / 60).toString().padStart(2, '0');
        const m = (minutosActual % 60).toString().padStart(2, '0');
        slotsPosibles.push(`${h}:${m}`);
      }
      
      minutosActual += intervalo;
    }

    // --- BUSCAR CITAS OCUPADAS (Igual que antes) ---
    const inicioDia = new Date(`${fechaStr}T00:00:00.000Z`);
    const finDia = new Date(`${fechaStr}T23:59:59.999Z`);

    const citasOcupadas = await Cita.findAll({
      where: {
        fechaHoraInicio: { [Op.between]: [inicioDia, finDia] },
        estado: 'confirmada'
      },
      attributes: ['fechaHoraInicio']
    });

    const horasOcupadas = citasOcupadas.map(c => {
      return new Date(c.fechaHoraInicio).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'
      });
    });

    res.json({ slots: slotsPosibles, ocupadas: horasOcupadas });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error calculando disponibilidad' });
  }
});

// POST /api/citas/reservar
router.post('/reservar', [authMiddleware], async (req, res) => {
  try {
    const { fechaHoraInicio, fechaHoraFin, motivo, tipo } = req.body;
    const pacienteId = req.usuario.id;
    
    // 2. Necesitamos los datos del paciente (email y nombre) para enviar el correo
    const datosPaciente = await Usuario.findByPk(pacienteId);

    // ... (validaciones y creación de cita igual que antes) ...
    const nuevaCita = await Cita.create({
      /* ... tus datos ... */
      pacienteId,
      fisioterapeutaId: 1,
      fechaHoraInicio: new Date(fechaHoraInicio),
      fechaHoraFin: new Date(fechaHoraFin),
      estado: 'confirmada',
      motivo,
      tipo
    });

    // --- 3. ENVIAR NOTIFICACIONES (¡LA MAGIA!) ---
    
    // Formatear fecha y hora para que se lea bien en el email
    const fechaObj = new Date(fechaHoraInicio);
    const fechaLegible = fechaObj.toLocaleDateString('es-ES');
    const horaLegible = fechaObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});

    // A. Email al Paciente
    EmailService.enviarConfirmacionCita(
      datosPaciente.email, 
      datosPaciente.nombre, 
      fechaLegible, 
      horaLegible, 
      tipo
    );

    // B. Email al Fisio
    EmailService.enviarAvisoFisio(
      datosPaciente.nombre, 
      fechaLegible, 
      horaLegible, 
      tipo, 
      motivo
    );
    // ---------------------------------------------

    res.status(201).json({ msg: 'Cita reservada exitosamente.', cita: nuevaCita });

  } catch (error) {
    // ... (catch igual)
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

// DELETE /api/citas/:id
router.delete('/:id', [authMiddleware], async (req, res) => {
    try {
      const cita = await Cita.findByPk(req.params.id, {
          include: [{ model: Usuario, as: 'paciente' }] // Incluimos usuario para saber su email
      });
  
      if (!cita) return res.status(404).json({ msg: 'Cita no encontrada.' });
      if (cita.pacienteId !== req.usuario.id) return res.status(403).json({ msg: 'Acceso denegado.' });
  
      // Guardamos datos para el email antes de borrar
      const { fechaHoraInicio, paciente } = cita;
      
      await cita.destroy();

      // --- ENVIAR EMAIL DE CANCELACIÓN ---
      const fechaObj = new Date(fechaHoraInicio);
      EmailService.enviarCancelacion(
          paciente.email,
          paciente.nombre,
          fechaObj.toLocaleDateString('es-ES'),
          fechaObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})
      );
      // -----------------------------------
  
      res.json({ msg: 'Cita cancelada correctamente.' });
  
    } catch (error) {
       // ...
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
        as: 'ejercicios' // Asegúrate de que coincide con el alias en models/index.js
      }],
      order: [['createdAt', 'DESC']] // Las más nuevas primero
    });
    res.json(rutinas);
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    res.status(500).json({ msg: 'Error interno al cargar rutinas.' });
  }
});

// --- RUTA PARA BORRAR UNA RUTINA ---
// DELETE /api/fisio/rutinas/:id
router.delete('/rutinas/:id', [authMiddleware, fisioMiddleware], async (req, res) => {
  try {
    const rutina = await Rutina.findByPk(req.params.id);
    
    if (!rutina) return res.status(404).json({ msg: 'Rutina no encontrada' });
    
    // Seguridad: Solo el creador puede borrarla
    if (rutina.fisioterapeutaCreadorId !== req.usuario.id) {
      return res.status(403).json({ msg: 'No tienes permiso para borrar esta rutina.' });
    }

    await rutina.destroy(); // Al borrar la rutina, se borran los ejercicios (CASCADE)
    res.json({ msg: 'Rutina eliminada correctamente' });

  } catch (error) {
    console.error('Error al borrar rutina:', error);
    res.status(500).json({ msg: 'Error interno al borrar.' });
  }
});


module.exports = router;