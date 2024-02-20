export function smoothing_kernel_spiky(dist: number, radius_of_influence: number) {
  if (dist > radius_of_influence) return 0;
  const scale = 15.0 / (Math.PI * Math.pow(radius_of_influence, 6.0));
  return scale * Math.pow(radius_of_influence - dist, 3)
}

export function smoothing_kernel_spiky_derivative(dist: number, radius_of_influence: number) {
  if (dist > radius_of_influence) return 0.0;
  let scale = -45.0 / (Math.PI * Math.pow(radius_of_influence, 6));
  return scale * (radius_of_influence - dist) * (radius_of_influence - dist)
}

export function dist(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  const a = x2 - x1;
  const b = y2 - y1;
  const c = z2 - z1;
  return Math.hypot(a * a, b * b, c * c);
}
