const express = require('express');
const sequelize = require('./4_infrastructure/database/db'); 
const cors = require('cors'); 
require('./3_domain/models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de FisioApp funcionando correctamente!');
});

app.use('/api/auth', require('./1_presentation/routes/auth'));
app.use('/api/citas', require('./1_presentation/routes/citas'));
app.use('/api/fisio', require('./1_presentation/routes/fisio'));
app.use('/api/rutinas', require('./1_presentation/routes/rutinas'));

// Sincronización con la base de datos
async function startServer() {
  try {
    // CUIDADO con force: false, si se pone a true se borra toda la BD (solo para hacer cambios y pruebas)
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