// En servidor/routes/auth.js
const express = require('express');
const router = express.Router();
const { Usuario } = require('../../3_domain/models'); // Importamos el modelo Usuario
const jwt = require('jsonwebtoken'); // <-- ESTA LÍNEA ES LA QUE FALTA
const authMiddleware = require('../middleware/authMiddleware');

// Esto es solo para probar que la ruta funciona
// GET /api/auth
router.get('/', (req, res) => {
  res.json({ msg: 'Hola desde la ruta de Autenticación' });
});



// --- RUTA PARA EL REGISTRO ---
// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    // 1. Obtenemos los datos del formulario (React nos los envía en req.body)
    const { nombre, email, password, rol } = req.body;

    // 2. Validamos que los datos esenciales estén
    if (!nombre || !email || !password || !rol) {
      // Usamos return para que no siga ejecutando
      return res.status(400).json({ msg: 'Por favor, rellena todos los campos.' });
    }

    // 3. Comprobamos si el email ya existe en la BBDD
    const usuarioExistente = await Usuario.findOne({ where: { email: email } });
    if (usuarioExistente) {
      return res.status(400).json({ msg: 'El email introducido ya está registrado.' });
    }

    // 4. Creamos el nuevo usuario en la base de datos
    // ¡OJO! No hasheamos la contraseña aquí.
    // Lo hace automáticamente el "hook" que pusimos en el modelo 'Usuario.js'
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      rol
    });

    // 5. Enviamos una respuesta exitosa
    // (No enviamos la contraseña de vuelta)
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



// --- RUTA PARA EL LOGIN ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // 1. Obtenemos email y password del formulario
    const { email, password } = req.body;

    // 2. Buscamos al usuario en la BBDD por su email
    const usuario = await Usuario.findOne({ where: { email: email } });
    if (!usuario) {
      return res.status(400).json({ msg: 'Email o contraseña incorrectos.' });
    }

    // 3. Comparamos la contraseña del formulario con la guardada (cifrada)
    // Usamos el método 'validarPassword' que creamos en el modelo Usuario.js
    const passwordCorrecta = await usuario.validarPassword(password);
    
    if (!passwordCorrecta) {
      return res.status(400).json({ msg: 'Email o contraseña incorrectos.' });
    }

    // 4. Si todo es correcto, creamos el "pase" (Token JWT)
    // El "payload" son los datos que guardamos dentro del token
    const payload = {
      usuario: {
        id: usuario.id,
        rol: usuario.rol
      }
    };

    // 5. Firmamos el token
    // (¡Deberías poner tu 'SECRETA' en el archivo .env!)
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



// --- RUTA PARA OBTENER DATOS DEL USUARIO (PROTEGIDA) ---
// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // 2. El 'authMiddleware' nos da 'req.usuario.id' (del token)
    const usuario = await Usuario.findByPk(req.usuario.id, {
      // 3. No queremos enviar la contraseña
      attributes: ['id', 'nombre', 'email', 'rol']
    });

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    // 4. Envía los datos del usuario
    res.json(usuario);

  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA ACTUALIZAR (EDITAR) DATOS DEL USUARIO ---
// PUT /api/auth/me
router.put('/me', [authMiddleware], async (req, res) => {
  const { nombre, email, password } = req.body;
  
  try {
    // 1. Busca al usuario en la BBDD usando el token
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    // 2. Actualiza los campos
    usuario.nombre = nombre || usuario.nombre; // Si no viene, deja el que estaba
    usuario.email = email || usuario.email;

    // 3. ¡IMPORTANTE! Manejo de la contraseña
    if (password && password.length >= 6) {
      usuario.password = password; // ¡El hook 'beforeUpdate' se encargará de hashearlo!
    }

    // 4. Guarda los cambios
    await usuario.save();

    // 5. Devuelve el usuario actualizado (sin la contraseña)
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

module.exports = router;