import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './RegistroPage.css';

function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [rol, setRol] = useState('paciente');
  
  const [erroresCampos, setErroresCampos] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroresCampos({});

    // validación
    const nuevosErrores = {};
    let hayError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombre.trim()) { nuevosErrores.nombre = true; hayError = true; }
    
    // Validación Email
    if (!email.trim()) { 
      nuevosErrores.email = true; 
      hayError = true; 
    } else if (!emailRegex.test(email)) {
      nuevosErrores.email = true;
      toast.error('El formato del email no es válido.');
      hayError = true;
    }

    if (!password) { nuevosErrores.password = true; hayError = true; }
    if (!password2) { nuevosErrores.password2 = true; hayError = true; }

    // Validaciones de contraseña
    if (password && password !== password2) {
      nuevosErrores.password = true;
      nuevosErrores.password2 = true;
      toast.error('Las contraseñas no coinciden.');
      hayError = true;
    } else if (password && password.length < 6) {
      nuevosErrores.password = true;
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      hayError = true;
    }

    if (hayError) {
      setErroresCampos(nuevosErrores);
      if (!nuevosErrores.email && !nuevosErrores.password) {
         toast.error('Por favor, revisa los campos marcados.');
      }
      return;
    }

    const toastId = toast.loading('Creando cuenta...');

    try {
      const nuevoUsuario = { nombre, email, password, rol };
      const API_URL = 'http://localhost:5000/api/auth/registro';
      
      await axios.post(API_URL, nuevoUsuario);

      toast.success('¡Cuenta creada! Por favor, inicia sesión.', { id: toastId });
      navigate('/login');

    } catch (errorApi) {
      console.error('Error al registrar:', errorApi);
      const msg = errorApi.response?.data?.msg || 'Ocurrió un error al registrar.';
      
      if (msg.includes('email') || msg.includes('correo')) {
        setErroresCampos({ email: true });
      }
      
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="registro-container">
      {/* Añadimos noValidate */}
      <form className="registro-form tarjeta" onSubmit={handleSubmit} noValidate>
        <h2>Crear Cuenta</h2>
        
        <div className="form-grupo">
          <label htmlFor="nombre">Nombre Completo</label>
          <input 
            type="text" 
            id="nombre" 
            value={nombre}
            className={erroresCampos.nombre ? 'input-error' : ''}
            onChange={(e) => {
              setNombre(e.target.value);
              if(erroresCampos.nombre) setErroresCampos({...erroresCampos, nombre: false});
            }} 
          />
        </div>

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
              if(erroresCampos.password) setErroresCampos({...erroresCampos, password: false, password2: false});
            }} 
          />
        </div>

        <div className="form-grupo">
          <label htmlFor="password2">Confirmar Contraseña</label>
          <input 
            type="password" 
            id="password2" 
            value={password2}
            className={erroresCampos.password2 ? 'input-error' : ''}
            onChange={(e) => {
              setPassword2(e.target.value);
              if(erroresCampos.password2) setErroresCampos({...erroresCampos, password2: false});
            }} 
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