const { Rutina, Ejercicio } = require('../../3_domain/models');
const sequelize = require('../database/db');

class RutinaRepository {
  static async crearRutinaConEjercicios(rutinaData, ejerciciosData) {
    const t = await sequelize.transaction();
    
    try {
      // Crear la Rutina
      const nuevaRutina = await Rutina.create(rutinaData, { transaction: t });

      // Preparar los ejercicios con el ID de la nueva rutina
      const ejerciciosParaCrear = ejerciciosData.map(ej => ({
        ...ej,
        rutinaId: nuevaRutina.id
      }));

      // Crear los Ejercicios
      await Ejercicio.bulkCreate(ejerciciosParaCrear, { transaction: t });

      // Confirmar la transacción
      await t.commit();
      return nuevaRutina; 

    } catch (error) {
      await t.rollback();
      throw new Error(`Error al crear la rutina en el repositorio: ${error.message}`);
    }
  }
}

module.exports = RutinaRepository;