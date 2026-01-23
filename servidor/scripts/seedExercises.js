const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const db = require('../4_infrastructure/database/db'); 
// Asegúrate de que importas EjercicioBiblioteca aquí
const { EjercicioBiblioteca, Categoria } = require('../3_domain/models'); 

// --- CONFIGURACIÓN ---
const API_KEY = 'd0f7dcb801msh7dd63fd0b620c81p16d9a7jsnf471a95556a1';
const BATCH_SIZE = 50; 

// Traductor simple para que las categorías salgan en español
const DICCIONARIO_CATEGORIAS = {
  'back': 'Espalda',
  'cardio': 'Cardio',
  'chest': 'Pecho',
  'lower arms': 'Brazos (Antebrazo)',
  'lower legs': 'Piernas (Gemelos)',
  'neck': 'Cuello',
  'shoulders': 'Hombros',
  'upper arms': 'Brazos (Bíceps/Tríceps)',
  'upper legs': 'Piernas (Muslos)',
  'waist': 'Abdominales / Core'
};

const seed = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await db.authenticate();
    
    // Esto actualizará la tabla EjercicioBiblioteca añadiendo 'categoriaId' si falta
    await db.sync({ alter: true }); 

    console.log('🚀 Iniciando descarga masiva a la BIBLIOTECA...');

    let offset = 0;
    let seguirBuscando = true;
    let totalGuardados = 0;

    // BUCLE PRINCIPAL
    while (seguirBuscando) {
      
      const options = {
        method: 'GET',
        url: 'https://exercisedb.p.rapidapi.com/exercises',
        params: { limit: BATCH_SIZE, offset: offset },
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      };

      try {
        console.log(`📡 Pidiendo bloque: offset ${offset} (Límite ${BATCH_SIZE})...`);
        const response = await axios.request(options);
        const ejerciciosAPI = response.data;

        // Si la API devuelve vacío, paramos
        if (!Array.isArray(ejerciciosAPI) || ejerciciosAPI.length === 0) {
          console.log('🏁 La API no ha devuelto más resultados.');
          seguirBuscando = false;
          break;
        }

        console.log(`   📦 Recibidos ${ejerciciosAPI.length} items. Guardando...`);

        for (const item of ejerciciosAPI) {
          // 1. Gestionar Categoría (Traducida)
          const nombreIngles = item.bodyPart;
          const nombreEsp = DICCIONARIO_CATEGORIAS[nombreIngles] || nombreIngles;
          
          const [categoria] = await Categoria.findOrCreate({
            where: { nombre: nombreEsp },
            defaults: { nombre: nombreEsp }
          });

          // 2. Gestionar EjercicioBiblioteca
          const nombreTitular = item.name.charAt(0).toUpperCase() + item.name.slice(1);
          
          // Construimos la URL manualmente con el ID
          const urlFabricada = `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${item.id}.gif`;
          console.log(`   📘 ${nombreTitular} -> ${urlFabricada}`);

          const [ejercicioBib, created] = await EjercicioBiblioteca.findOrCreate({
            where: { nombre: nombreTitular }, // Buscamos por nombre único
            defaults: {
              nombre: nombreTitular,
              // Concatenamos info útil en la descripción
              descripcion: `Ejercicio enfocado en ${item.target}. Equipamiento: ${item.equipment}.`,
              videoUrl: urlFabricada,
              categoriaId: categoria.id, // Sequelize usará esto gracias a la relación
              reglasPostura: null // Se queda vacío por ahora
            }
          });

          if (created) totalGuardados++;
        }

        // Avanzamos el offset
        offset += ejerciciosAPI.length; 
        
        // Pausa de seguridad
        await new Promise(resolve => setTimeout(resolve, 200)); 

      } catch (err) {
        console.error('❌ Error en el bloque (probablemente API limit):', err.message);
        seguirBuscando = false; 
      }
    }

    console.log('------------------------------------------------');
    console.log(`✅ TOTAL FINAL: ${totalGuardados} ejercicios guardados en EjercicioBiblioteca.`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit();
  }
};

seed();