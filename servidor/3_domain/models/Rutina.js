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
  // Las claves foráneas (pacienteAsignadoId, fisioterapeutaCreadorId) se añaden en el Paso 2
}, {
  sequelize,
  modelName: 'Rutina'
});

module.exports = Rutina;