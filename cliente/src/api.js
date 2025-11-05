import axios from 'axios';

// 1. Crea una "instancia" de axios
const api = axios.create({
  // 2. Define la URL base de tu backend
  baseURL: 'http://localhost:5000/api'
});

// 3. El Interceptor: "El Mensajero"
// Esto se ejecuta ANTES de que CADA petición se envíe
api.interceptors.request.use(
  (config) => {
    // 4. Busca el token en el localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // 5. Si hay token, lo añade a la cabecera 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;