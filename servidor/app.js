const express = require('express');
// En servidor/app.js
const sequelize = require('./4_infrastructure/database/db'); // <-- ESTA ES LA RUTA CORRECTA
const cors = require('cors'); // 1. Importa CORS

// Importa los modelos y relaciones
// Esto es MUY IMPORTANTE, inicializa los modelos
require('./3_domain/models');

const app = express();
const PORT = process.env.PORT || 5000;

// ... (aquí van tus middlewares de express, rutas, etc.)

app.use(cors()); 
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de FisioApp funcionando correctamente!');
});

// Cuando alguien vaya a '/api/auth', usa las rutas de 'auth.js'
app.use('/api/auth', require('./1_presentation/routes/auth'));
app.use('/api/citas', require('./1_presentation/routes/citas'));
app.use('/api/fisio', require('./1_presentation/routes/fisio'));
app.use('/api/rutinas', require('./1_presentation/routes/rutinas'));

// Sincronización con la base de datos
async function startServer() {
  try {
    // Sincroniza los modelos con la BBDD.
    // { force: false } significa que no borrará las tablas si ya existen.
    // (Usa { force: true } en desarrollo si haces un cambio grande y no te importa borrar datos)
    await sequelize.sync({ force: false }); 
    console.log('Base de datos sincronizada correctamente.');
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
}

startServer();