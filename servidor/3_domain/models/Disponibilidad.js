// En servidor/3_domain/models/Disponibilidad.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db');

class Disponibilidad extends Model {}

Disponibilidad.init({
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  diaSemana: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  horaInicio: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  horaFin: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  tieneDescanso: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  horaInicioDescanso: {
    type: DataTypes.STRING,
    allowNull: true
  },
  horaFinDescanso: {
    type: DataTypes.STRING, 
    allowNull: true
  },
  activo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true }
}, {
  sequelize,
  modelName: 'Disponibilidad',
  timestamps: false
});

module.exports = Disponibilidad;