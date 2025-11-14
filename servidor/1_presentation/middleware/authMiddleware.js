const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Lee el token de la cabecera 'Authorization'
  const authHeader = req.header('Authorization');
  
  // 2. Comprueba si existe
  if (!authHeader) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  try {
    // 3. El token viene como "Bearer [token]". Lo separamos.
    const token = authHeader.split(' ')[1];

    // 4. Verifica si el token es válido (con tu palabra secreta)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRETA_DE_PRUEBA');

    // 5. ¡ÉXITO! Añadimos los datos del usuario (el 'payload') al objeto 'req'
    // Esto es muy útil para saber QUIÉN está haciendo la petición
    req.usuario = decoded.usuario; 
    
    // 6. Le dice a la petición que "siga" su camino
    next();

  } catch (error) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};