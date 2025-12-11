import axios from 'axios';

// 1. Crea la instancia de axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// 2. Interceptor de PETICIÓN (Request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor de RESPUESTA (Response)
api.interceptors.response.use(
  
  // (A) Si la respuesta es exitosa (2xx), no hagas nada, solo devuélvela.
  (response) => {
    return response;
  },
  
  // (B) Si la respuesta da un ERROR...
  (error) => {
    // Comprueba si el error es un 401 (Token inválido / No autorizado)
    if (error.response && error.response.status === 401) {
      
      console.log('¡Interceptor 401 activado! Token inválido. Cerrando sesión.');
      
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      
      // Redirige al usuario a la página de login
      window.location.href = '/login';
    }
    
    // (C) Para cualquier otro error (404, 500, etc.), simplemente rechaza la promesa
    // para que el componente (ej. FisioBibliotecaPage) pueda manejarlo en su 'catch'.
    return Promise.reject(error);
  }
);

export default api;