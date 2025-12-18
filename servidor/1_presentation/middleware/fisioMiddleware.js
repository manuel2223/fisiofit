module.exports = function(req, res, next) {
  try {
    // Viene de authMiddleware
    if (req.usuario.rol !== 'fisioterapeuta') {
      return res.status(403).json({ msg: 'Acceso denegado. No eres fisioterapeuta.' });
    }
    
    // Si es fisio, le dejamos continuar
    next();

  } catch (error) {
    res.status(401).json({ msg: 'Error de permisos' });
  }
};