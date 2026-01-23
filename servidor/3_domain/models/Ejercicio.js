const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); 

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
      isUrl: true 
    }
  },
  series: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  repeticiones: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reglasPostura: {
    type: DataTypes.JSON,
    allowNull: true
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: true // o false, según prefieras
  }
}, {
  sequelize,
  modelName: 'Ejercicio'
});

module.exports = Ejercicio;