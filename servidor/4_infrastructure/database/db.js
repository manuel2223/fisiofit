const { Sequelize } = require('sequelize');

// Cargamos las variables de entorno del archivo .env
require('dotenv').config();

// 1. Creamos la instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,    // Nombre de la BBDD (de .env)
  process.env.DB_USER,    // Usuario (de .env)
  process.env.DB_PASSWORD, // Contraseña (de .env)
  {
    host: process.env.DB_HOST, // Host (de .env)
    dialect: 'mysql',          // Le decimos que usamos MySQL
    
    // (Opcional) Configuración del "Pool" de conexiones
    // pool: {
    //   max: 5,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000
    // },

    // (Opcional pero recomendado) Para que Sequelize no muestre
    // cada comando SQL en la consola.
    // Cámbialo a 'console.log' si necesitas depurar una consulta.
    logging: false 
  }
);

// 2. Exportamos la instancia para usarla en otros archivos
// (como en la definición de modelos)
module.exports = sequelize;