// En servidor/2_application/use_cases/AsignarRutinaUseCase.js
const RutinaRepository = require('../../4_infrastructure/persistence/RutinaRepository');

class AsignarRutinaUseCase {
  /**
   * Lógica para ejecutar el caso de uso de asignar una rutina
   * @param {object} command - Los datos de entrada (DTO)
   */
  static async execute(command) {
    const { pacienteId, fisioterapeutaId, nombreRutina, ejercicios } = command;

    // 1. Validación de la Aplicación (Reglas simples)
    if (!pacienteId || !nombreRutina || !ejercicios || ejercicios.length === 0) {
      throw new Error('Datos de entrada incompletos para la rutina.');
    }
    
    // (Aquí iría lógica más compleja, ej: comprobar si el paciente existe)

    // 2. Preparar los datos para el Dominio/Repositorio
    const rutinaData = {
      nombre: nombreRutina,
      pacienteAsignadoId: pacienteId,
      fisioterapeutaCreadorId: fisioterapeutaId
    };

    // (Limpiamos los datos de ejercicios por si acaso)
    const ejerciciosData = ejercicios.map(ej => ({
      nombreEjercicio: ej.nombreEjercicio,
      series: ej.series,
      repeticiones: ej.repeticiones,
      videoUrl: ej.videoUrl || null, // Aseguramos que sea null si está vacío
      reglasPostura: ej.reglasPostura || null
    }));

    // 3. Llamar al Repositorio para que haga el trabajo sucio
    try {
      const nuevaRutina = await RutinaRepository.crearRutinaConEjercicios(rutinaData, ejerciciosData);
      return nuevaRutina;
    } catch (error) {
      // Captura el error del repositorio y lo relanza
      throw new Error(`Error en el caso de uso: ${error.message}`);
    }
  }
}

module.exports = AsignarRutinaUseCase;