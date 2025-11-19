// En servidor/models/EjercicioBiblioteca.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); 

class EjercicioBiblioteca extends Model {}

EjercicioBiblioteca.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
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
      isUrl: true // Opcional: valida que sea una URL
    }
  },
  reglasPostura: {
    type: DataTypes.JSON,
    allowNull: true // Es opcional, no todos los ejercicios tendrán IA
  }
 
  // La clave foránea 'fisioterapeutaId' la añadiremos en models/index.js
}, {
  sequelize,
  modelName: 'EjercicioBiblioteca'
});

module.exports = EjercicioBiblioteca;