const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); 

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
  },

  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('Valoración Inicial', 'Masaje Deportivo', 'Masaje Relajante', 'Rehabilitación', 'Punción Seca'),
    allowNull: false,
    defaultValue: 'Masaje Deportivo'
  }
}, {
  sequelize,
  modelName: 'Cita'
});

module.exports = Cita;