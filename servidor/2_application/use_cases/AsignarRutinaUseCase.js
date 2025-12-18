const RutinaRepository = require('../../4_infrastructure/persistence/RutinaRepository');

class AsignarRutinaUseCase {
  static async execute(command) {
    const { pacienteId, fisioterapeutaId, nombreRutina, ejercicios } = command;


    if (!pacienteId || !nombreRutina || !ejercicios || ejercicios.length === 0) {
      throw new Error('Datos de entrada incompletos para la rutina.');
    }

    // Preparar los datos
    const rutinaData = {
      nombre: nombreRutina,
      pacienteAsignadoId: pacienteId,
      fisioterapeutaCreadorId: fisioterapeutaId
    };

    // Limpiar los datos de los ejercicios
    const ejerciciosData = ejercicios.map(ej => ({
      nombreEjercicio: ej.nombreEjercicio,
      series: ej.series,
      repeticiones: ej.repeticiones,
      videoUrl: ej.videoUrl || null,
      reglasPostura: ej.reglasPostura || null
    }));


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