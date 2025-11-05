// En tu archivo principal (ej. app.js)
const express = require('express');
const sequelize = require('./config/db'); // Tu conexión
const cors = require('cors'); // 1. Importa CORS

// Importa los modelos y relaciones
// Esto es MUY IMPORTANTE, inicializa los modelos
require('./models'); 

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rutinas', require('./routes/rutinas')); 

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