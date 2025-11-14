// En servidor/3_domain/models/Categoria.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); // Ajusta esta ruta

class Categoria extends Model {}

Categoria.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // No queremos dos categorías "Core"
  }
  // No necesitamos 'fisioterapeutaId' aquí, las categorías son globales
}, {
  sequelize,
  modelName: 'Categoria'
});

module.exports = Categoria;