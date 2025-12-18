const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Lee el token de la cabecera
  const authHeader = req.header('Authorization');
  
  // Comprueba si existe
  if (!authHeader) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  try {
    // El token viene como "Bearer [token]". Lo separo.
    const token = authHeader.split(' ')[1];

    // Verifica si el token es válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRETA_DE_PRUEBA');

    // Añade los datos del usuario 
    req.usuario = decoded.usuario; 
    
    next();

  } catch (error) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};