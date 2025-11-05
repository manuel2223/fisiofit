import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ReservarCitaPage from './pages/ReservarCitaPage';
import MisRutinasPage from './pages/MisRutinasPage'; 
import LoginPage from './pages/LoginPage'; 
import RegistroPage from './pages/RegistroPage'; 
import RutaProtegida from './components/RutaProtegida'; // 1. Importa el guardia
import MiCuentaPage from './pages/MiCuentaPage'; // 1. Importa la nueva página

function App() {
  return (
    <div className="App">
      <Navbar />
      <main style={{ minHeight: '80vh' }}>
        <Routes>
          {/* --- Rutas Públicas --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          {/* --- Rutas Protegidas --- */}
          <Route element={<RutaProtegida />}>
            <Route path="/rutinas" element={<MisRutinasPage />} />
            <Route path="/reservar" element={<ReservarCitaPage />} />
            
            {/* 2. AÑADE LA NUEVA RUTA AQUÍ */}
            <Route path="/mi-cuenta" element={<MiCuentaPage />} />
          </Route>
          
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;