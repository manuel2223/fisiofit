// En servidor/models/index.js
const Usuario = require('./Usuario');
const Cita = require('./Cita');
const Rutina = require('./Rutina');
const Ejercicio = require('./Ejercicio');
const EjercicioBiblioteca = require('./EjercicioBiblioteca'); 
const Categoria = require('./Categoria');
const Resultado = require('./Resultado'); 

// 1. Relaciones de Cita
// Un Usuario (Paciente) tiene muchas Citas
Usuario.hasMany(Cita, { foreignKey: 'pacienteId', as: 'citasPaciente' });
Cita.belongsTo(Usuario, { foreignKey: 'pacienteId', as: 'paciente' });

// Un Usuario (Fisio) tiene muchas Citas
Usuario.hasMany(Cita, { foreignKey: 'fisioterapeutaId', as: 'citasFisio' });
Cita.belongsTo(Usuario, { foreignKey: 'fisioterapeutaId', as: 'fisioterapeuta' });

// 2. Relaciones de Rutina
// Un Usuario (Paciente) tiene muchas Rutinas
Usuario.hasMany(Rutina, { foreignKey: 'pacienteAsignadoId', as: 'rutinasPaciente' });
Rutina.belongsTo(Usuario, { foreignKey: 'pacienteAsignadoId', as: 'pacienteAsignado' });

// Un Usuario (Fisio) crea muchas Rutinas
Usuario.hasMany(Rutina, { foreignKey: 'fisioterapeutaCreadorId', as: 'rutinasCreadas' });
Rutina.belongsTo(Usuario, { foreignKey: 'fisioterapeutaCreadorId', as: 'fisioterapeutaCreador' });

// 3. Relación Rutina <-> Ejercicio
// Una Rutina tiene muchos Ejercicios
Rutina.hasMany(Ejercicio, { foreignKey: 'rutinaId', onDelete: 'CASCADE', as: 'ejercicios' }); // Si se borra la rutina, se borran sus ejercicios
Ejercicio.belongsTo(Rutina, { foreignKey: 'rutinaId' });

Usuario.hasMany(EjercicioBiblioteca, { foreignKey: 'fisioterapeutaId' });
EjercicioBiblioteca.belongsTo(Usuario, { foreignKey: 'fisioterapeutaId' });

// 3. AÑADE LA NUEVA RELACIÓN DE CATEGORÍA
// Una Categoría tiene muchos Ejercicios
Categoria.hasMany(EjercicioBiblioteca, { foreignKey: 'categoriaId' });
EjercicioBiblioteca.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoriaId' });

// Un Usuario (Paciente) tiene muchos Resultados
Usuario.hasMany(Resultado, { foreignKey: 'pacienteId' });
Resultado.belongsTo(Usuario, { foreignKey: 'pacienteId' });

// Un Ejercicio (de la Rutina) puede tener muchos Resultados (si lo hace varios días)
Ejercicio.hasMany(Resultado, { foreignKey: 'ejercicioId' });
Resultado.belongsTo(Ejercicio, { foreignKey: 'ejercicioId' });

// Exportamos todos los modelos para usarlos en la API
module.exports = {
  Usuario,
  Cita,
  Rutina,
  Ejercicio,
  EjercicioBiblioteca,
  Categoria,
  Resultado 
};