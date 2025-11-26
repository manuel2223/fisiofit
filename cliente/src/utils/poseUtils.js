// En cliente/src/utils/poseUtils.js

/**
 * Calcula el ángulo (en grados) entre tres puntos: A -> B -> C
 * B es el punto central (ej. la rodilla).
 */
export function calculateAngle(a, b, c) {
  // 1. Convertimos a coordenadas simples
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  
  // 2. Convertimos a Grados
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  // 3. Normalizamos (el ángulo nunca debe ser mayor de 180)
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

export function smoothKeypoints(currentKeypoints, previousKeypoints, alpha = 0.5) {
  if (!previousKeypoints || previousKeypoints.length === 0) {
    return currentKeypoints;
  }

  return currentKeypoints.map((keypoint, index) => {
    const prev = previousKeypoints[index];
    
    // Si el punto anterior existe y tiene el mismo nombre, suavizamos
    if (prev && prev.name === keypoint.name) {
      return {
        ...keypoint,
        x: (keypoint.x * alpha) + (prev.x * (1 - alpha)),
        y: (keypoint.y * alpha) + (prev.y * (1 - alpha))
        // Nota: No suavizamos el 'score' (confianza), usamos el nuevo
      };
    }
    return keypoint;
  });
}
