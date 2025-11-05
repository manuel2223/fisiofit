const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Cita extends Model {}

Cita.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fechaHoraInicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fechaHoraFin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendiente'
  }
  // Las claves foráneas (pacienteId, fisioterapeutaId) se añaden en el Paso 2
}, {
  sequelize,
  modelName: 'Cita'
});

module.exports = Cita;