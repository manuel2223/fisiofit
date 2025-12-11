import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ReservarCitaPage from './pages/ReservarCitaPage';
import MisRutinasPage from './pages/MisRutinasPage'; 
import LoginPage from './pages/LoginPage'; 
import RegistroPage from './pages/RegistroPage'; 
import RutaProtegida from './components/RutaProtegida';
import MiCuentaPage from './pages/MiCuentaPage'; 
import RutaProtegidaFisio from './components/RutaProtegidaFisio';
import FisioDashboardPage from './pages/FisioDashboardPage'; 
import AsignarRutinaPage from './pages/AsignarRutinaPage';
import FisioBibliotecaPage from './pages/FisioBibliotecaPage'; 
import EjercicioEntrenamientoPage from './pages/EjercicioEntrenamientoPage';
import PacienteDetallePage from './pages/PacienteDetallePage';
import ConfiguracionHorarioPage from './pages/ConfiguracionHorarioPage';
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <div className="App">
      <Toaster position="top-center" reverseOrder={false} />
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
            <Route path="/entrenar/:ejercicioId" element={<EjercicioEntrenamientoPage />} />
            
            
            <Route path="/mi-cuenta" element={<MiCuentaPage />} />
          </Route>

          {/* --- Rutas Protegidas Fisio --- */}
          <Route element={<RutaProtegidaFisio />}>
            <Route path="/fisio/dashboard" element={<FisioDashboardPage />} />
            
            <Route path="/fisio/asignar/:pacienteId" element={<AsignarRutinaPage />} />
            <Route path="/fisio/biblioteca" element={<FisioBibliotecaPage />} />
            <Route path="/fisio/horario" element={<ConfiguracionHorarioPage />} />
            <Route path="/fisio/paciente/:id" element={<PacienteDetallePage />} />
            
          </Route>
          
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;