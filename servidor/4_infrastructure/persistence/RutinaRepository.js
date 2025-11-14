// En servidor/4_infrastructure/persistence/RutinaRepository.js
const { Rutina, Ejercicio } = require('../../3_domain/models');
const sequelize = require('../database/db'); // Asegúrate que la ruta a tu config/db.js es correcta

class RutinaRepository {
  /**
   * Guarda una nueva rutina y sus ejercicios en una transacción
   */
  static async crearRutinaConEjercicios(rutinaData, ejerciciosData) {
    const t = await sequelize.transaction();
    
    try {
      // 1. Crear la Rutina
      const nuevaRutina = await Rutina.create(rutinaData, { transaction: t });

      // 2. Preparar los ejercicios con el ID de la nueva rutina
      const ejerciciosParaCrear = ejerciciosData.map(ej => ({
        ...ej,
        rutinaId: nuevaRutina.id
      }));

      // 3. Crear los Ejercicios
      await Ejercicio.bulkCreate(ejerciciosParaCrear, { transaction: t });

      // 4. Confirmar la transacción
      await t.commit();
      return nuevaRutina; // Devuelve la rutina creada

    } catch (error) {
      // 5. Si algo falla, deshacer todo
      await t.rollback();
      // Lanza el error para que la capa de aplicación lo capture
      throw new Error(`Error al crear la rutina en el repositorio: ${error.message}`);
    }
  }
}

module.exports = RutinaRepository;