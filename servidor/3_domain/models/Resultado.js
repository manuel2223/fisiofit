const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db');

class Resultado extends Model {}

Resultado.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dificultad: {
    type: DataTypes.ENUM('Muy Fácil', 'Fácil', 'Normal', 'Difícil', 'Imposible'),
    allowNull: false
  },
  dolor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Resultado'
});

module.exports = Resultado;