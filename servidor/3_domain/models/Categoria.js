const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db');

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
    unique: true 
  }
}, {
  sequelize,
  modelName: 'Categoria'
});

module.exports = Categoria;