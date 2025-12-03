// En servidor/3_domain/models/Disponibilidad.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db');

class Disponibilidad extends Model {}

Disponibilidad.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  diaSemana: { type: DataTypes.INTEGER, allowNull: false },
  
  // Horario General (Ej: 09:00 a 22:00)
  horaInicio: { type: DataTypes.STRING, allowNull: false },
  horaFin: { type: DataTypes.STRING, allowNull: false },
  
  // --- NUEVO: HORARIO DE DESCANSO (Ej: 14:00 a 16:00) ---
  tieneDescanso: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  horaInicioDescanso: {
    type: DataTypes.STRING, // "14:00"
    allowNull: true
  },
  horaFinDescanso: {
    type: DataTypes.STRING, // "16:00"
    allowNull: true
  },
  // ------------------------------------------------------

  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  sequelize,
  modelName: 'Disponibilidad',
  timestamps: false
});

module.exports = Disponibilidad;