// En cliente/src/pages/EjercicioEntrenamientoPage.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

// --- Importaciones de TensorFlow ---
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';

import './EjercicioEntrenamientoPage.css';

const POSE_LANDMARKS = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.BlazePose);

function EjercicioEntrenamientoPage() {
  const { ejercicioId } = useParams();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const loopRef = useRef(null); // Guarda el ID del bucle de animación

  const [cargando, setCargando] = useState(true);
  const [mensajeCarga, setMensajeCarga] = useState('Cargando...');
  const [ejercicio, setEjercicio] = useState(null);
  const [feedback, setFeedback] = useState('Selecciona una fuente de video');
  const [mode, setMode] = useState('select'); // 'select', 'webcam', 'upload'

  // 1. Carga del Modelo y Datos (SOLO UNA VEZ)
  useEffect(() => {
    const setupDetector = async () => {
      try {
        setMensajeCarga('Cargando datos del ejercicio...');
        const res = await api.get(`/rutinas/ejercicio/${ejercicioId}`);
        setEjercicio(res.data);

        setMensajeCarga('Inicializando motor de IA...');
        await tf.setBackend('webgl');
        await tf.ready();

        setMensajeCarga('Cargando modelo de IA (BlazePose)...');
        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = { runtime: 'tfjs', modelType: 'lite' };
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);

        setMensajeCarga('¡Listo!');
        setCargando(false);
      } catch (err) {
        console.error("Error al iniciar TensorFlow:", err);
        setMensajeCarga(`Error: ${err.message}.`);
      }
    };
    
    setupDetector();

    // Función de limpieza
    return () => {
      cancelAnimationFrame(loopRef.current);
      if(detectorRef.current) detectorRef.current.dispose();
      // Apaga la cámara si estaba encendida
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [ejercicioId]);

  // 2. Bucle de Detección
  const poseLoop = async () => {
    if (detectorRef.current && videoRef.current && canvasRef.current) {
      // Comprueba si el video está listo para dar datos
      if (videoRef.current.readyState < 2) {
        loopRef.current = requestAnimationFrame(poseLoop); // Espera al siguiente frame
        return;
      }

      const poses = await detectorRef.current.estimatePoses(videoRef.current, {
        flipHorizontal: mode === 'webcam' 
      });
      
      const ctx = canvasRef.current.getContext('2d');
      drawCanvas(poses, ctx);

      if (ejercicio && ejercicio.reglasPostura && poses.length > 0) {
        // analizarPostura(poses[0], ejercicio.reglasPostura);
      }
    }
    loopRef.current = requestAnimationFrame(poseLoop);
  };
// --- 3. FUNCIÓN DE DIBUJO (CON ESCALADO INTELIGENTE) ---
  const drawCanvas = (poses, ctx) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (poses.length > 0) {
      const pose = poses[0];

      // --- ¡LA SOLUCIÓN DE ESCALADO! ---
      // 1. Obtenemos los tamaños del 'lienzo' (640x480)
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      
      // 2. Obtenemos los tamaños del 'video real' (ej. 1080x1920)
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      // 3. Calculamos cómo se ha 'encogido' el video (object-fit: contain)
      const videoRatio = videoWidth / videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > canvasRatio) {
        // Video más ancho que el lienzo (bandas negras arriba/abajo)
        scale = canvasWidth / videoWidth;
        offsetY = (canvasHeight - videoHeight * scale) / 2;
      } else {
        // Video más alto que el lienzo (bandas negras a los lados)
        // Este es el caso de tu video de TikTok
        scale = canvasHeight / videoHeight;
        offsetX = (canvasWidth - videoWidth * scale) / 2;
      }
      // --- FIN DE LA SOLUCIÓN DE ESCALADO ---


      // 4. Dibujamos los puntos (Keypoints) APLICANDO EL ESCALADO
      ctx.fillStyle = 'lime';
      for (let keypoint of pose.keypoints) {
        if (keypoint.score > 0.3) {
          // La IA nos da puntos en el espacio 640x480 (estirado)
          // Nosotros los re-escalamos al espacio 640x480 (encogido)
          
          // Primero, "des-estiramos" el punto para que esté en el rango 0-1 del video nativo
          const relativeX = keypoint.x / canvasWidth;
          const relativeY = keypoint.y / canvasHeight;

          // Ahora, lo "re-encogemos" al tamaño 'contain'
          const finalX = (relativeX * videoWidth * scale) + offsetX;
          const finalY = (relativeY * videoHeight * scale) + offsetY;

          ctx.beginPath();
          ctx.arc(finalX, finalY, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 5. Dibujamos el esqueleto (Conexiones) APLICANDO EL ESCALADO
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      for (const [startPoint, endPoint] of POSE_LANDMARKS) {
        const kp1 = pose.keypoints.find(k => k.name === startPoint);
        const kp2 = pose.keypoints.find(k => k.name === endPoint);

        if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
          // Aplicamos el mismo escalado a ambos puntos
          const relX1 = kp1.x / canvasWidth;
          const relY1 = kp1.y / canvasHeight;
          const x1 = (relX1 * videoWidth * scale) + offsetX;
          const y1 = (relY1 * videoHeight * scale) + offsetY;

          const relX2 = kp2.x / canvasWidth;
          const relY2 = kp2.y / canvasHeight;
          const x2 = (relX2 * videoWidth * scale) + offsetX;
          const y2 = (relY2 * videoHeight * scale) + offsetY;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }
  };

  // --- 4. FUNCIONES DE CONTROL (CORREGIDAS) ---

  // Inicia la Webcam
  const startWebcam = async () => {
    try {
      setFeedback('Accediendo a la cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.src = null; // Limpia el 'src' de video subido (si lo hay)
      videoRef.current.srcObject = stream;
      setMode('webcam');
      // El evento 'onCanPlay' del <video> se encargará del resto
    } catch (err) {
      console.error("Error al iniciar la webcam:", err);
      setFeedback('No se pudo acceder a la cámara.');
    }
  };

  // Maneja la subida de un archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Apaga la webcam (si estaba encendida)
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      const url = URL.createObjectURL(file);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      setMode('upload');
      setFeedback('Cargando vídeo...');
      // El evento 'onCanPlay' del <video> se encargará del resto
    }
  };

  // Esta función AHORA inicia el bucle (para ambos modos)
  const handleVideoReady = () => {
    videoRef.current.play();
    setFeedback(mode === 'webcam' ? '¡Cámara lista! Colócate en posición.' : '¡Vídeo listo! Reproduciendo...');
    
    // Detiene cualquier bucle anterior (importante si se cambia de modo)
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
    }
    // Inicia el nuevo bucle
    loopRef.current = requestAnimationFrame(poseLoop);
    
  };

  // Detiene el bucle cuando el video subido termina
  const handleVideoEnd = () => {
    if (mode === 'upload') { // Solo si es un video subido
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
      setFeedback('El video ha terminado.');
    }
  };

  // --- 5. RENDERIZADO CONDICIONAL ---
  
  if (cargando) {
    return (
      <div className="entrenamiento-container">
        <div className="zona-carga"><h3>{mensajeCarga}</h3></div>
      </div>
    );
  }

  return (
    <div className="entrenamiento-container">
      <h2>{ejercicio ? ejercicio.nombreEjercicio : 'Entrenamiento Asistido'}</h2>

      {mode === 'select' && (
        <div className="mode-selector">
          <button className="boton-primario" onClick={startWebcam}>Usar Webcam</button>
          <p>--- o ---</p>
          <input 
            type="file" 
            id="upload-video" 
            accept="video/*" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="upload-video" className="boton-secundario">Subir Archivo de Video</label>
        </div>
      )}

      <div className="media-container" style={{ display: mode === 'select' ? 'none' : 'block' }}>
        <video 
          ref={videoRef} 
          id="video-feed" 
          width="640" 
          height="480" 
          autoPlay // Quitado autoPlay, lo controlamos nosotros
          muted={mode === 'webcam'} // Silenciado si es webcam
          playsInline
          // ¡AQUÍ ESTÁ LA MAGIA!
          onCanPlay={handleVideoReady} // Se dispara cuando el video (webcam o archivo) está listo
          onEnded={handleVideoEnd}
          
          controls={mode === 'upload'} // <-- ¡TU PETICIÓN DE CONTROLES!
        ></video>
        <canvas 
          ref={canvasRef} 
          id="pose-canvas" 
          width="640" 
          height="480"
        ></canvas>
      </div>

      <div className="feedback-box">
        <h3>Feedback:</h3>
        <p>{feedback}</p>
      </div>
    </div>
  );
}

export default EjercicioEntrenamientoPage;