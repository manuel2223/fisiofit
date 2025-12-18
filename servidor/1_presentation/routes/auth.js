const express = require('express');
const router = express.Router();
const { Usuario } = require('../../3_domain/models'); 
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', (req, res) => {
  res.json({ msg: 'Hola desde la ruta de Autenticación' });
});



// REGISTRO
// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    // Obtenemos los datos del formulario
    const { nombre, email, password, rol } = req.body;

    // Validamos que no falten datos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ msg: 'Por favor, rellena todos los campos.' });
    }

    // Comprobamos si el email ya existe en la BD
    const usuarioExistente = await Usuario.findOne({ where: { email: email } });
    if (usuarioExistente) {
      return res.status(400).json({ msg: 'El email introducido ya está registrado.' });
    }

    // Creamos el nuevo usuario en la BD
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      rol
    });

    res.status(201).json({
      msg: 'Usuario registrado exitosamente.',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});



// LOGIN
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Obtenemos email y password del formulario
    const { email, password } = req.body;

    // Buscamos al usuario en la BD por su email
    const usuario = await Usuario.findOne({ where: { email: email } });
    if (!usuario) {
      return res.status(400).json({ msg: 'Email o contraseña incorrectos.' });
    }

    // Comparamos la contraseña del formulario con la guardada
    // ValidarPassword se define en Usuario.js
    const passwordCorrecta = await usuario.validarPassword(password);
    
    if (!passwordCorrecta) {
      return res.status(400).json({ msg: 'Email o contraseña incorrectos.' });
    }

    // Si todo es correcto, se crea el Token JWT con los datos del payload
    const payload = {
      usuario: {
        id: usuario.id,
        rol: usuario.rol
      }
    };

    // Se firma el token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'SECRETA_DE_PRUEBA', // Usa una variable de entorno en producción
      { expiresIn: '1h' }, // El token expira en 1 hora
      (error, token) => {
        if (error) throw error;
        // 6. Enviamos el token al frontend
        res.json({ token, rol: usuario.rol });
      }
    );

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});



// OBTENER DATOS DEL USUARIO (PROTEGIDA)
// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // El 'authMiddleware' nos da el id
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'email', 'rol']
    });

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    res.json(usuario);

  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// ACTUALIZAR DATOS DEL USUARIO
// PUT /api/auth/me
router.put('/me', [authMiddleware], async (req, res) => {
  const { nombre, email, password } = req.body;
  
  try {
    // Busca al usuario en la BD
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    // Actualiza los campos
    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;

    if (password && password.length >= 6) {
      usuario.password = password; 
    }

    await usuario.save();

    // Devuelve el usuario actualizado
    const usuarioActualizado = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    res.json({ msg: 'Datos actualizados correctamente.', usuario: usuarioActualizado });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    // Error si el email ya existe
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'El email ya está en uso por otra cuenta.' });
    }
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});


// OBTENER LISTA DE FISIOS EN EL SELECTOR DE RESERVA 
// GET /api/auth/fisioterapeutas
router.get('/fisioterapeutas', authMiddleware, async (req, res) => {
  try {
    const fisios = await Usuario.findAll({
      where: { rol: 'fisioterapeuta' },
      attributes: ['id', 'nombre'] 
    });
    res.json(fisios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al cargar fisioterapeutas' });
  }
}); 

module.exports = router;