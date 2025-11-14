import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate
import api from '../api'; // <-- USAMOS NUESTRO ARCHIVO
import { useAuth } from '../context/AuthContext'; // 1. Importa el hook
import './LoginPage.css'; // Crearemos este CSS ahora

function LoginPage() {
  // 1. Estados para guardar el email y la contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para mensajes de error

  const navigate = useNavigate(); // Hook para redirigir
  const { login } = useAuth(); // 2. Trae la función 'login' del contexto

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Preparamos los datos para enviar
      const loginData = { email, password };

      // 2. Llamamos a la API de LOGIN
      const respuesta = await api.post('/auth/login', loginData);

      login(respuesta.data.token, respuesta.data.rol); // 3. Llama a 'login' con token y rol
      navigate('/'); // Redirigimos a la página de inicio

    } catch (errorApi) {
      // 6. Si la API da error (email no existe, pass incorrecta)
      console.error('Error al iniciar sesión:', errorApi);
      if (errorApi.response && errorApi.response.data && errorApi.response.data.msg) {
        // Mostramos el error del backend ("Email o contraseña incorrectos")
        setError(errorApi.response.data.msg);
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form tarjeta" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        
        {/* Muestra el mensaje de error si existe */}
        {error && <p className="error-mensaje">{error}</p>}

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

        <button type="submit" className="boton-primario">
          Entrar
        </button>
        
        <p className="link-registro">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;