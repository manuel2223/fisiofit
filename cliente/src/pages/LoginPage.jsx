// En cliente/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erroresCampos, setErroresCampos] = useState({}); 
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroresCampos({}); 

    // --- VALIDACIÓN VISUAL MEJORADA ---
    const nuevosErrores = {};
    let hayError = false;
    let mensajeEspecificoMostrado = false; // Bandera para controlar los toasts
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validar Email
    if (!email.trim()) {
      nuevosErrores.email = true;
      hayError = true;
    } else if (!emailRegex.test(email)) {
      nuevosErrores.email = true;
      hayError = true;
      
      // Error específico
      toast.error('El formato del email no es válido.');
      mensajeEspecificoMostrado = true; // Marcamos que ya hemos avisado
    }

    // 2. Validar Password
    if (!password.trim()) {
      nuevosErrores.password = true;
      hayError = true;
    }

    // Decisión final de errores
    if (hayError) {
      setErroresCampos(nuevosErrores);
      
      // SOLO mostramos el mensaje genérico si NO hemos mostrado ya uno específico
      if (!mensajeEspecificoMostrado) {
         toast.error('Por favor, rellena los campos correctamente.');
      }
      return;
    }
    // -----------------------------------

    const toastId = toast.loading('Iniciando sesión...');

    try {
      const loginData = { email, password };
      const respuesta = await api.post('/auth/login', loginData);

      login(respuesta.data.token, respuesta.data.rol);
      
      toast.success(`¡Bienvenido de nuevo!`, { id: toastId });
      navigate('/'); 

    } catch (errorApi) {
      console.error('Error al iniciar sesión:', errorApi);
      const msg = errorApi.response?.data?.msg || 'Error al iniciar sesión.';
      
      setErroresCampos({ email: true, password: true });
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="login-container">
      <form className="login-form tarjeta" onSubmit={handleSubmit} noValidate>
        <h2>Iniciar Sesión</h2>
        
        <div className="form-grupo">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            className={erroresCampos.email ? 'input-error' : ''}
            onChange={(e) => {
              setEmail(e.target.value);
              if(erroresCampos.email) setErroresCampos({...erroresCampos, email: false});
            }}
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            className={erroresCampos.password ? 'input-error' : ''}
            onChange={(e) => {
              setPassword(e.target.value);
              if(erroresCampos.password) setErroresCampos({...erroresCampos, password: false});
            }}
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