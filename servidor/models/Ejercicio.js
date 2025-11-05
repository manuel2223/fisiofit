const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Ejercicio extends Model {}

Ejercicio.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombreEjercicio: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true // Validación de que es una URL
    }
  },
  series: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  repeticiones: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
  // La clave foránea (rutinaId) se añade en el Paso 2
}, {
  sequelize,
  modelName: 'Ejercicio'
});

module.exports = Ejercicio;