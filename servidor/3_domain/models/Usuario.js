const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../4_infrastructure/database/db'); 
const bcrypt = require('bcryptjs');

class Usuario extends Model {
  // Método de instancia para verificar la contraseña
  validarPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }
}

Usuario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // El email debe ser único
    validate: {
      isEmail: true // Validación de formato de email
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('paciente', 'fisioterapeuta'),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Usuario',
  // Hook para cifrar la contraseña antes de crear (CREATE) o actualizar (UPDATE)
  hooks: {
    beforeCreate: async (usuario) => {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(usuario.password, salt);
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    }
  }
});

module.exports = Usuario;