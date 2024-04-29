import { simulation_settings } from "../types";
import { dist, smoothing_kernel_spiky, smoothing_kernel_spiky_derivative } from "./math_helpers";

const COLISSION_DAMPING_FACTOR = 0.9;

export function move_particles(dt: number, positions: Float32Array, velocities: Float32Array) {
  for (let i = 0; i < positions.length; i++) {
    positions[i] += velocities[i] * dt;
  }
}

export function apply_gravity(dt: number, velocities: Float32Array, simulation_settings: simulation_settings) {
  for (let i = 0; i < velocities.length / 3; i++) {
    velocities[3 * i + 1] += simulation_settings.gravity * dt;
  }
}

export function keep_particles_in_bound(positions: Float32Array, velocities: Float32Array, simulation_bound: Array<number>) {
  for (let i = 0; i < positions.length / 3; i++) {
    for (let dimension = 0; dimension < 3; dimension++) {
      // convention: simulation_bound is symmetric around (0, 0, 0)
      // simulation_bound is given as 
      if (Math.abs(positions[3 * i + dimension]) > simulation_bound[dimension]) {
        const index = 3 * i + dimension
        positions[index] = Math.max(Math.min(positions[index], simulation_bound[dimension]), - simulation_bound[dimension]);
        velocities[index] *= -1.0 * COLISSION_DAMPING_FACTOR;;
      }
    }
  }
}

export function update_densities(positions: Float32Array, densities: Float32Array, simulation_settings: simulation_settings) {
  const n = densities.length;
  for (let i = 0; i < n; i++) {
    let density = 0.0;
    for (let j = 0; j < n; j++) {
      const distance = dist(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2], positions[3 * j], positions[3 * j + 1], positions[3 * j + 2]);
      density += smoothing_kernel_spiky(distance, simulation_settings.radius_of_influence);
    }
    densities[i] = density * simulation_settings.mass;
  }
}

export function update_pressure_forces(positions: Float32Array, densities: Float32Array, pressure_forces: Float32Array, simulation_settings: simulation_settings) {
  const n = densities.length;
  for (let i = 0; i < n; i++) {
    let pressure_force = [0.0, 0.0, 0.0];
    for (let j = 0; j < n; j++) {
      if (i == j) continue;
      const distance = dist(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2], positions[3 * j], positions[3 * j + 1], positions[3 * j + 2]);
      const pressure_1 = density_to_pressure(densities[i], simulation_settings);
      const pressure_2 = density_to_pressure(densities[j], simulation_settings);
      const average_pressure = (pressure_1 + pressure_2) / 2.0;
      for (let dimension = 0; dimension < 3; dimension++) {
        if (distance == 0) continue;
        const direction = (positions[3 * j + dimension] - positions[3 * i + dimension]) / distance;
        pressure_force[dimension] += average_pressure / densities[i] * direction * smoothing_kernel_spiky_derivative(distance, simulation_settings.radius_of_influence);
      }
    }
    // set the calculated forces
    for (let dimension = 0; dimension < 3; dimension++)
      pressure_forces[3 * i + dimension] = pressure_force[dimension] * simulation_settings.mass;
  }
}

function density_to_pressure(density: number, simulation_settings: simulation_settings) {
  return simulation_settings.pressure_multiplier * (density - simulation_settings.target_density);
}

export function apply_pressure_forces(dt: number, velocities: Float32Array, pressure_forces: Float32Array, densities: Float32Array) {
  for (let i = 0; i < densities.length; i++) {
    if (densities[i] == 0) continue;
    for (let dimension = 0; dimension < 3; dimension++) {
      velocities[3 * i + dimension] = Math.min(10., velocities[3 * i + dimension] + pressure_forces[3 * i + dimension] / densities[i] * dt);
    }
  }
}
