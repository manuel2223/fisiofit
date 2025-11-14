// En servidor/middleware/fisioMiddleware.js

// Este middleware se ejecuta DESPUÉS de 'authMiddleware'
module.exports = function(req, res, next) {
  try {
    // authMiddleware ya nos ha dado 'req.usuario'
    if (req.usuario.rol !== 'fisioterapeuta') {
      return res.status(403).json({ msg: 'Acceso denegado. No eres fisioterapeuta.' });
    }
    
    // Si es fisio, le dejamos continuar
    next();

  } catch (error) {
    res.status(401).json({ msg: 'Error de permisos' });
  }
};