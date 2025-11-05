import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // <-- USAMOS NUESTRO ARCHIVO
import './RegistroPage.css'; // Crearemos este CSS

function RegistroPage() {
  // 1. Estados para todos los campos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // Para confirmar la contraseña
  const [rol, setRol] = useState('paciente'); // Por defecto, se registra como paciente
  const [error, setError] = useState('');

  const navigate = useNavigate(); // 3. Hook para redirigir

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // (Validaciones del frontend se quedan igual)
    if (!nombre || !email || !password || !password2) {
      setError('Por favor, rellena todos los campos.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    // (El resto de validaciones...)

    try {
      // 4. Creamos el objeto con los datos a enviar
      const nuevoUsuario = {
        nombre,
        email,
        password,
        rol
      };

      // 5. ¡LA LLAMADA A LA API!
      const respuesta = await api.post('/auth/registro', nuevoUsuario);

      // 6. Si todo va bien
      console.log('Usuario registrado:', respuesta.data);
      
      // (Opcional) Redirigimos al login tras un registro exitoso
      alert('¡Registro exitoso! Por favor, inicia sesión.');
      navigate('/login');

    } catch (errorApi) {
      // 7. Si la API nos da un error (ej. email duplicado)
      console.error('Error al registrar:', errorApi);
      if (errorApi.response && errorApi.response.data && errorApi.response.data.msg) {
        // Mostramos el error que nos envía el backend (ej. "El email ya existe")
        setError(errorApi.response.data.msg);
      } else {
        setError('Ocurrió un error al registrar. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="registro-container">
      <form className="registro-form tarjeta" onSubmit={handleSubmit}>
        <h2>Crear Cuenta</h2>
        
        {error && <p className="error-mensaje">{error}</p>}

        <div className="form-grupo">
          <label htmlFor="nombre">Nombre Completo</label>
          <input 
            type="text" 
            id="nombre" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required 
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="password2">Confirmar Contraseña</label>
          <input 
            type="password" 
            id="password2" 
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required 
          />
        </div>

        <div className="form-grupo">
          <label>Quiero registrarme como:</label>
          <div className="opciones-rol">
            <label>
              <input 
                type="radio" 
                value="paciente" 
                checked={rol === 'paciente'}
                onChange={(e) => setRol(e.target.value)} 
              />
              Paciente
            </label>
            <label>
              <input 
                type="radio" 
                value="fisioterapeuta" 
                checked={rol === 'fisioterapeuta'}
                onChange={(e) => setRol(e.target.value)} 
              />
              Fisioterapeuta
            </label>
          </div>
        </div>

        <button type="submit" className="boton-primario">
          Crear Cuenta
        </button>
        
        <p className="link-login">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default RegistroPage;