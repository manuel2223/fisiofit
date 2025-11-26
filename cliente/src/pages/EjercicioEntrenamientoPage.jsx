// En cliente/src/pages/EjercicioEntrenamientoPage.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

// --- Importaciones de TensorFlow ---
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';

import { calculateAngle } from '../utils/poseUtils';
import './EjercicioEntrenamientoPage.css';

const POSE_LANDMARKS = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.BlazePose);

function EjercicioEntrenamientoPage() {
  const { ejercicioId } = useParams();
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const loopRef = useRef(null); 

  const [cargando, setCargando] = useState(true);
  const [mensajeCarga, setMensajeCarga] = useState('Cargando...');
  const [ejercicio, setEjercicio] = useState(null);
  const [feedback, setFeedback] = useState('Selecciona una fuente de video');
  const [mode, setMode] = useState('select'); 

  // Estados para el Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [dificultad, setDificultad] = useState('Normal');
  const [dolor, setDolor] = useState(false);
  const [comentarios, setComentarios] = useState('');

  // 1. INICIALIZACIÓN
  useEffect(() => {
    const setupDetector = async () => {
      try {
        setMensajeCarga('Cargando datos...');
        const res = await api.get(`/rutinas/ejercicio/${ejercicioId}`);
        setEjercicio(res.data);

        setMensajeCarga('Inicializando IA...');
        await tf.setBackend('webgl');
        await tf.ready();

        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = { runtime: 'tfjs', modelType: 'full' }; 
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);

        setMensajeCarga('¡Listo!');
        setCargando(false);
      } catch (err) {
        console.error(err);
        setMensajeCarga(`Error: ${err.message}`);
      }
    };
    setupDetector();

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (detectorRef.current) detectorRef.current.dispose();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [ejercicioId]);

  // 2. BUCLE IA
  const poseLoop = async () => {
    if (detectorRef.current && videoRef.current && canvasRef.current) {
      if (videoRef.current.readyState < 2) {
        loopRef.current = requestAnimationFrame(poseLoop);
        return;
      }

      const poses = await detectorRef.current.estimatePoses(videoRef.current, {
        flipHorizontal: false
      });
      
      const ctx = canvasRef.current.getContext('2d');
      let feedbackVisual = { esCorrecto: true, mensajes: [] };

      // Análisis de Reglas
      if (poses.length > 0 && ejercicio && ejercicio.reglasPostura) {
        const pose = poses[0];
        
        // Lado Dominante
        const leftPoints = ['left_shoulder', 'left_hip', 'left_knee', 'left_ankle'];
        const rightPoints = ['right_shoulder', 'right_hip', 'right_knee', 'right_ankle'];
        let scoreLeft = 0;
        let scoreRight = 0;
        pose.keypoints.forEach(kp => {
          if (leftPoints.includes(kp.name)) scoreLeft += kp.score;
          if (rightPoints.includes(kp.name)) scoreRight += kp.score;
        });
        const ignoreLeft = (scoreRight - scoreLeft) > 0.5;
        const ignoreRight = (scoreLeft - scoreRight) > 0.5;

        ejercicio.reglasPostura.forEach(regla => {
          if (ignoreLeft && regla.articulacion.includes('izquierda')) return;
          if (ignoreRight && regla.articulacion.includes('derecha')) return;

          const p1 = pose.keypoints.find(k => k.name === regla.puntos[0]);
          const p2 = pose.keypoints.find(k => k.name === regla.puntos[1]);
          const p3 = pose.keypoints.find(k => k.name === regla.puntos[2]);

          if (p1 && p2 && p3 && p1.score > 0.5 && p2.score > 0.5 && p3.score > 0.5) {
            const anguloActual = calculateAngle(p1, p2, p3);
            const [min, max] = regla.rangoCorrecto;
            p2.anguloCalculado = Math.round(anguloActual);

            if (anguloActual < min || anguloActual > max) {
              feedbackVisual.esCorrecto = false;
              feedbackVisual.mensajes.push(regla.mensajeError);
            }
          }
        });
      }

      drawCanvas(poses, ctx, feedbackVisual);

      if (!feedbackVisual.esCorrecto && feedbackVisual.mensajes.length > 0) {
        const msg = feedbackVisual.mensajes[0];
        if (feedback !== msg) setFeedback(msg);
      } else if (poses.length > 0) {
        if (feedback !== "¡Postura Correcta!") setFeedback("¡Postura Correcta!");
      }
    }
    loopRef.current = requestAnimationFrame(poseLoop);
  };

  // 3. DIBUJO (¡CORREGIDO!)
  const drawCanvas = (poses, ctx, feedbackVisual) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (poses.length > 0) {
      const pose = poses[0];

      // --- MATEMÁTICAS DE ESCALADO ---
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Si no hay vídeo, no dibujamos para evitar división por cero
      if (!videoWidth || !videoHeight) return;

      const videoRatio = videoWidth / videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > canvasRatio) { 
        scale = canvasWidth / videoWidth;
        offsetY = (canvasHeight - videoHeight * scale) / 2;
      } else { 
        scale = canvasHeight / videoHeight;
        offsetX = (canvasWidth - videoWidth * scale) / 2;
      }
      // -------------------------------

      const colorEsqueleto = feedbackVisual.esCorrecto ? '#00FF00' : '#FF0000';
      const grosorLinea = feedbackVisual.esCorrecto ? 2 : 4;

      // Puntos
      ctx.fillStyle = colorEsqueleto;
      for (let keypoint of pose.keypoints) {
        if (keypoint.score > 0.3) {
          // ¡AQUÍ ESTABA EL ERROR! Usamos las matemáticas de escalado
          // TensorFlow devuelve coordenadas relativas al elemento (0-640)
          // Nosotros las "re-encajamos" en el área visible del vídeo
          
          const relativeX = keypoint.x / canvasWidth;
          const relativeY = keypoint.y / canvasHeight;
          
          const finalX = (relativeX * videoWidth * scale) + offsetX;
          const finalY = (relativeY * videoHeight * scale) + offsetY;

          ctx.beginPath();
          ctx.arc(finalX, finalY, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          if (keypoint.anguloCalculado) {
             ctx.font = "bold 16px Arial";
             ctx.fillStyle = "yellow";
             ctx.fillText(keypoint.anguloCalculado + "°", finalX + 10, finalY);
             ctx.fillStyle = colorEsqueleto;
          }
        }
      }

      // Líneas
      ctx.strokeStyle = colorEsqueleto;
      ctx.lineWidth = grosorLinea;
      for (const [start, end] of POSE_LANDMARKS) {
        const kp1 = pose.keypoints.find(k => k.name === start);
        const kp2 = pose.keypoints.find(k => k.name === end);

        if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
          // Escalado P1
          const relX1 = kp1.x / canvasWidth;
          const relY1 = kp1.y / canvasHeight;
          const x1 = (relX1 * videoWidth * scale) + offsetX;
          const y1 = (relY1 * videoHeight * scale) + offsetY;

          // Escalado P2
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

  // 4. CONTROLES
  const startWebcam = async () => {
    try {
      setFeedback('Accediendo a la cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.src = null;
        videoRef.current.srcObject = stream;
      }
      setMode('webcam');
    } catch (err) {
      console.error(err);
      setFeedback('No se pudo acceder a la cámara.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      setMode('upload');
      setFeedback('Cargando vídeo...');
    }
  };

  const handleVideoReady = () => {
    if (videoRef.current) {
      videoRef.current.play();
      // NO tocamos el tamaño del canvas aquí, dejamos que el CSS y drawCanvas se encarguen
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      loopRef.current = requestAnimationFrame(poseLoop);
      
      setFeedback(mode === 'webcam' ? '¡Cámara lista!' : '¡Vídeo listo!');
    }
  };

  const handleVideoEnd = () => {
    if (mode === 'upload') {
      cancelAnimationFrame(loopRef.current);
      setFeedback('Video terminado.');
    }
  };

  // 5. FEEDBACK
  const handleTerminar = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (videoRef.current) videoRef.current.pause();
    setMostrarModal(true);
  };

  const enviarFeedback = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Guardando...');
    try {
      await api.post('/rutinas/feedback', {
        ejercicioId: ejercicio.id,
        dificultad, dolor, comentarios
      });
      toast.success('¡Progreso guardado!', { id: toastId });
      navigate('/rutinas');
    } catch (err) {
      toast.error('Error al guardar', { id: toastId });
      if (videoRef.current) videoRef.current.play();
    }
  };

  if (cargando) return <div className="entrenamiento-container"><h3>{mensajeCarga}</h3></div>;

  return (
    <div className="entrenamiento-container">
      <h2>{ejercicio ? ejercicio.nombreEjercicio : 'Entrenamiento'}</h2>

      {mode === 'select' && (
        <div className="mode-selector">
          <button className="boton-primario" onClick={startWebcam}>Usar Webcam</button>
          <p>--- o ---</p>
          <input type="file" id="upload-video" accept="video/*" onChange={handleFileUpload} style={{display:'none'}} />
          <label htmlFor="upload-video" className="boton-secundario">Subir Video</label>
        </div>
      )}

      <div className="media-container" style={{ display: mode === 'select' ? 'none' : 'block' }}>
        <video 
          ref={videoRef} 
          id="video-feed" 
          // ¡IMPORTANTE! VOLVEMOS A PONER EL TAMAÑO FIJO
          width="640" 
          height="480"
          // -------------------------------------------
          onCanPlay={handleVideoReady}
          onEnded={handleVideoEnd}
          playsInline
          muted={mode === 'webcam'}
          controls={mode === 'upload'}
        ></video>
        <canvas 
          ref={canvasRef} 
          id="pose-canvas" 
          // ¡IMPORTANTE! VOLVEMOS A PONER EL TAMAÑO FIJO
          width="640" 
          height="480"
          // -------------------------------------------
        ></canvas>
      </div>

      <div className="feedback-box">
        <h3>IA: {feedback}</h3>
        {mode !== 'select' && (
          <button onClick={handleTerminar} className="boton-primario" style={{marginTop: '1rem', width: '100%'}}>
            Terminar y Guardar
          </button>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-header"><h3>📝 Resumen</h3></div>
            <form onSubmit={enviarFeedback}>
              <div className="form-grupo">
                <label>Dificultad</label>
                <select value={dificultad} onChange={e => setDificultad(e.target.value)}>
                  <option>Muy Fácil</option><option>Fácil</option><option>Normal</option><option>Difícil</option><option>Imposible</option>
                </select>
              </div>
              <div className="form-grupo" style={{display:'flex', alignItems:'center', gap:'0.8rem', background: '#FFF5F5', padding: '10px', borderRadius: '8px', border: '1px dashed #FEB2B2'}}>
                <label style={{margin:0, color: '#C53030', fontWeight: 'bold', cursor:'pointer'}} onClick={()=>setDolor(!dolor)}>¿Has sentido dolor?</label>
                <input type="checkbox" checked={dolor} onChange={e => setDolor(e.target.checked)} className="checkbox-dolor"/>
              </div>
              <div className="form-grupo">
                <textarea value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="Comentarios..." rows="3"></textarea>
              </div>
              <button type="submit" className="boton-primario" style={{width:'100%'}}>Enviar</button>
              <button type="button" className="boton-secundario" style={{width:'100%', marginTop:'0.5rem'}} onClick={() => {
                setMostrarModal(false);
                if (mode === 'webcam') { videoRef.current.play(); loopRef.current = requestAnimationFrame(poseLoop); }
              }}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EjercicioEntrenamientoPage;