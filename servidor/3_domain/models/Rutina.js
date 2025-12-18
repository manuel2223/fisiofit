const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); 

class Rutina extends Model {}

Rutina.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Rutina de seguimiento'
  }
}, {
  sequelize,
  modelName: 'Rutina'
});

module.exports = Rutina;