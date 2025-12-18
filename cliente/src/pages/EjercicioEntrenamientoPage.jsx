import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

// Importaciones de TensorFlow 
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';

import { calculateAngle, calculateIncline } from '../utils/poseUtils';
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
  const [feedback, setFeedback] = useState('Selecciona la fuente de video');
  const [mode, setMode] = useState('select'); 

  const [mostrarModal, setMostrarModal] = useState(false);
  const [dificultad, setDificultad] = useState('Normal');
  const [dolor, setDolor] = useState(false);
  const [comentarios, setComentarios] = useState('');

  // INICIALIZACIÓN
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

        setMensajeCarga('Listo!');
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

  // BUCLE IA 
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

      if (poses.length > 0 && ejercicio && ejercicio.reglasPostura) {
        const pose = poses[0];
        
        // lado dominante
        const leftPoints = ['left_shoulder', 'left_hip', 'left_knee', 'left_ankle'];
        const rightPoints = ['right_shoulder', 'right_hip', 'right_knee', 'right_ankle'];
        let scoreLeft = 0; let scoreRight = 0;
        pose.keypoints.forEach(kp => {
          if (leftPoints.includes(kp.name)) scoreLeft += kp.score;
          if (rightPoints.includes(kp.name)) scoreRight += kp.score;
        });
        const ignoreLeft = (scoreRight - scoreLeft) > 0.4;
        const ignoreRight = (scoreLeft - scoreRight) > 0.4;

        ejercicio.reglasPostura.forEach(regla => {
          if (ignoreLeft && regla.articulacion.includes('izquierda')) return;
          if (ignoreRight && regla.articulacion.includes('derecha')) return;

          // caso espalda
          if (regla.articulacion.includes('espalda') || regla.articulacion.includes('inclinacion')) {
             const p1 = pose.keypoints.find(k => k.name === regla.puntos[0]);
             const p2 = pose.keypoints.find(k => k.name === regla.puntos[1]);
             
             if (p1 && p2 && p1.score > 0.5 && p2.score > 0.5) {
                const inclinacion = calculateIncline(p1, p2);
                const [min, max] = regla.rangoCorrecto;
                
                p2.anguloCalculado = Math.round(inclinacion);
                // puntos para dibujar la línea amarilla
                regla.puntosActivos = [p1.name, p2.name, 'vertical']; 

                if (inclinacion < min || inclinacion > max) {
                  feedbackVisual.esCorrecto = false;
                  feedbackVisual.mensajes.push(regla.mensajeError);
                }
             }
             return;
          }

          // caso normal
          const p1 = pose.keypoints.find(k => k.name === regla.puntos[0]);
          const p2 = pose.keypoints.find(k => k.name === regla.puntos[1]);
          const p3 = pose.keypoints.find(k => k.name === regla.puntos[2]);

          if (p1 && p2 && p3 && p1.score > 0.5 && p2.score > 0.5 && p3.score > 0.5) {
            const anguloActual = calculateAngle(p1, p2, p3);
            const [min, max] = regla.rangoCorrecto;
            
            p2.anguloCalculado = Math.round(anguloActual);
            regla.puntosActivos = [p1.name, p2.name, p3.name];

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

  // FUNCIÓN DIBUJAR CONO
  const drawArcGuide = (ctx, center, baseAngle, range, isClockwise) => {
    const radius = 100;
    const [minDeg, maxDeg] = range;

    let angle1, angle2;
    if (isClockwise) {
      angle1 = baseAngle + (minDeg * Math.PI / 180);
      angle2 = baseAngle + (maxDeg * Math.PI / 180);
    } else {
      angle1 = baseAngle - (minDeg * Math.PI / 180);
      angle2 = baseAngle - (maxDeg * Math.PI / 180);
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, angle1, angle2, !isClockwise);
    ctx.fillStyle = "rgba(255, 215, 0, 0.2)"; 
    ctx.fill();

    ctx.strokeStyle = "gold";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    ctx.beginPath(); ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(angle1) * radius, center.y + Math.sin(angle1) * radius);
    ctx.stroke();

    ctx.beginPath(); ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(angle2) * radius, center.y + Math.sin(angle2) * radius);
    ctx.stroke();
    ctx.restore();
  };

  // DIBUJO
  const drawCanvas = (poses, ctx, feedbackVisual) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (poses.length > 0) {
      const pose = poses[0];

      // escalado
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      if (!videoWidth || !videoHeight) return;

      const videoRatio = videoWidth / videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      
      let scale = 1, offsetX = 0, offsetY = 0;

      if (videoRatio > canvasRatio) { 
        scale = canvasWidth / videoWidth;
        offsetY = (canvasHeight - videoHeight * scale) / 2;
      } else { 
        scale = canvasHeight / videoHeight;
        offsetX = (canvasWidth - videoWidth * scale) / 2;
      }
      
      // función para transformar coordenadas
      const toCanvasCoords = (kp) => ({
        x: kp.x * scale + offsetX,
        y: kp.y * scale + offsetY
      });

      // dibujar cono amarillo
      if (ejercicio && ejercicio.reglasPostura) {
         ejercicio.reglasPostura.forEach(regla => {
            if (regla.puntosActivos) {
               const p1Name = regla.puntosActivos[0];
               const p2Name = regla.puntosActivos[1];
               const p3Name = regla.puntosActivos[2];

               const kp1 = pose.keypoints.find(k => k.name === p1Name);
               const kp2 = pose.keypoints.find(k => k.name === p2Name);
               
               // Caso Espalda
               if (p3Name === 'vertical' && kp1 && kp2) {
                  const center = toCanvasCoords(kp2);
                  drawArcGuide(ctx, center, -Math.PI / 2, regla.rangoCorrecto, true);
               } 
               // Caso Normal
               else {
                  const kp3 = pose.keypoints.find(k => k.name === p3Name);
                  if (kp1 && kp2 && kp3) {
                     const start = toCanvasCoords(kp1);
                     const center = toCanvasCoords(kp2);
                     const end = toCanvasCoords(kp3);
                     
                     const angleBase = Math.atan2(start.y - center.y, start.x - center.x);
                     const det = (start.x - center.x) * (end.y - center.y) - (start.y - center.y) * (end.x - center.x);
                     const isClockwise = det > 0;

                     drawArcGuide(ctx, center, angleBase, regla.rangoCorrecto, isClockwise);
                  }
               }
            }
         });
      }

      // dibujar esqueleto
      const colorEsqueleto = feedbackVisual.esCorrecto ? '#00FF00' : '#FF0000';
      
      ctx.lineWidth = 6;
      ctx.strokeStyle = colorEsqueleto;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // resaltar segmentos activos
      if (ejercicio && ejercicio.reglasPostura) {
         ejercicio.reglasPostura.forEach(regla => {
            if (regla.puntosActivos) {
               const p1Name = regla.puntosActivos[0];
               const p2Name = regla.puntosActivos[1];
               const p3Name = regla.puntosActivos[2];

               const kp1 = pose.keypoints.find(k => k.name === p1Name);
               const kp2 = pose.keypoints.find(k => k.name === p2Name);
               
               if (kp1 && kp2) {
                  const c1 = toCanvasCoords(kp1);
                  const c2 = toCanvasCoords(kp2);
                  ctx.beginPath();
                  ctx.moveTo(c1.x, c1.y);
                  ctx.lineTo(c2.x, c2.y);
                  
                  if (p3Name && p3Name !== 'vertical') {
                     const kp3 = pose.keypoints.find(k => k.name === p3Name);
                     if (kp3) {
                        const c3 = toCanvasCoords(kp3);
                        ctx.lineTo(c3.x, c3.y);
                     }
                  }
                  ctx.stroke();
               }
            }
         });
      }

      // dibujar puntos
      ctx.fillStyle = colorEsqueleto;
      for (let kp of pose.keypoints) {
        if (kp.score > 0.5) {
          const c = toCanvasCoords(kp);
          
          if (kp.anguloCalculado) {
             ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 2 * Math.PI); ctx.fill();
             
             ctx.font = "bold 24px Arial";
             ctx.textAlign = "center";
             ctx.strokeStyle = 'black';
             ctx.lineWidth = 3;
             ctx.strokeText(kp.anguloCalculado + "°", c.x, c.y - 20);
             ctx.fillStyle = 'white';
             ctx.fillText(kp.anguloCalculado + "°", c.x, c.y - 20);
             ctx.fillStyle = colorEsqueleto; 
          } else {
             ctx.fillStyle = 'white';
             ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, 2 * Math.PI); ctx.fill();
             ctx.fillStyle = colorEsqueleto; 
          }
        }
      }
    }
  };

  // CONTROLES 
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
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
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

  // FEEDBACK Y GUARDADO
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
          {/*<p>--- o ---</p>
          <input type="file" id="upload-video" accept="video/*" onChange={handleFileUpload} style={{display:'none'}} />
          <label htmlFor="upload-video" className="boton-secundario">Subir Video</label>*/}
        </div>
      )}
      <div className="media-container" style={{ display: mode === 'select' ? 'none' : 'block' }}>
        <video ref={videoRef} id="video-feed" width="640" height="480" muted={mode === 'webcam'} playsInline onCanPlay={handleVideoReady} onEnded={handleVideoEnd} controls={mode === 'upload'}></video>
        <canvas ref={canvasRef} id="pose-canvas" width="640" height="480"></canvas>
      </div>
      <div className="feedback-box">
        <h3>IA: {feedback}</h3>
        {mode !== 'select' && (<button onClick={handleTerminar} className="boton-primario" style={{marginTop: '1rem', width: '100%'}}>Terminar y Guardar</button>)}
      </div>
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-header"><h3>📝 Resumen</h3></div>
            <form onSubmit={enviarFeedback}>
              <div className="form-grupo"><label>Dificultad</label><select value={dificultad} onChange={e => setDificultad(e.target.value)}><option>Muy Fácil</option><option>Fácil</option><option>Normal</option><option>Difícil</option><option>Imposible</option></select></div>
              <div className="form-grupo" style={{display:'flex', alignItems:'center', gap:'0.8rem', background: '#FFF5F5', padding: '10px', borderRadius: '8px', border: '1px dashed #FEB2B2'}}><input type="checkbox" checked={dolor} onChange={e => setDolor(e.target.checked)} className="checkbox-dolor"/><label style={{margin:0, color: '#C53030', fontWeight: 'bold', cursor:'pointer'}} onClick={()=>setDolor(!dolor)}>¿Has sentido dolor?</label></div>
              <div className="form-grupo"><textarea value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="Comentarios..." rows="3"></textarea></div>
              <button type="submit" className="boton-primario" style={{width:'100%'}}>Enviar</button>
              <button type="button" className="boton-secundario" style={{width:'100%', marginTop:'0.5rem'}} onClick={() => { setMostrarModal(false); if (mode === 'webcam') { videoRef.current.play(); loopRef.current = requestAnimationFrame(poseLoop); }}}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EjercicioEntrenamientoPage;