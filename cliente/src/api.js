import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Interceptor de PETICIÓN 
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

// Interceptor de RESPUESTA 
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('¡Interceptor 401 activado! Token inválido. Cerrando sesión.');
      
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;