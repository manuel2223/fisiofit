export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
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


export function calculateIncline(puntoA, puntoB) {

  
  const dy = puntoA.y - puntoB.y; 
  const dx = puntoA.x - puntoB.x; 

  let radians = Math.atan2(dx, dy); 
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 90) {
      angle = 180 - angle;
  }
  
  return angle;
}